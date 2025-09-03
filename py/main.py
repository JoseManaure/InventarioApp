# main.py
from fastapi import FastAPI, Request, Form, BackgroundTasks
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
import os
import requests
from typing import Dict, Any
from twilio.rest import Client as TwilioClient
from twilio.twiml.messaging_response import MessagingResponse
import uvicorn
import uuid
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Config desde ENV ---
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:4000")  # tu backend
API_TOKEN = os.getenv("API_TOKEN", "")  # si tu API necesita auth (Bearer)
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_WHATSAPP_FROM = os.getenv("TWILIO_WHATSAPP_FROM", "whatsapp:+1415XXXXXXX")  # tu número twilio
PORT = int(os.getenv("PORT", 8000))

twilio_client = TwilioClient(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN) if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN else None

app = FastAPI(title="WhatsApp Quote Bot - Microservice")

# --- Sesiones simples en memoria ---
# En producción usa Redis (persistente y multi-instance).
sessions: Dict[str, Dict[str, Any]] = {}

# --- Modelos ---
class CreateCotizacionPayload(BaseModel):
    cliente: str
    direccion: str = ""
    fechaEntrega: str = ""
    metodoPago: str = "efectivo"
    tipo: str = "cotizacion"
    productos: list  # [{ itemId, cantidad, precio, total }]
    # Puedes extender campos aquí


# --- Helpers ---
def send_whatsapp_via_twilio(to_whatsapp: str, body: str):
    if not twilio_client:
        logger.warning("Twilio client no configurado. No se envía mensaje.")
        return None
    # to_whatsapp debe venir como: "whatsapp:+569XXXXXXXX"
    msg = twilio_client.messages.create(
        body=body,
        from_=TWILIO_WHATSAPP_FROM,
        to=to_whatsapp
    )
    logger.info("Mensaje enviado SID=%s", msg.sid)
    return msg.sid

def call_create_cotizacion(payload: dict):
    """Llamada a tu API /cotizaciones para crear la cotización"""
    headers = {"Content-Type": "application/json"}
    if API_TOKEN:
        headers["Authorization"] = f"Bearer {API_TOKEN}"
    resp = requests.post(f"{API_BASE_URL}/cotizaciones", json=payload, headers=headers, timeout=15)
    resp.raise_for_status()
    return resp.json()

def format_products_for_backend(items):
    """Convierte lista de dicts {sku?, nombre?, cantidad, precio} a lo que espera backend.
    Ajusta según tu backend: aquí enviamos itemId = sku o nombre."""
    out = []
    for it in items:
        id_field = it.get("sku") or it.get("itemId") or it.get("nombre")
        cantidad = int(it.get("cantidad") or 0)
        precio = float(it.get("precio") or 0)
        out.append({
            "itemId": str(id_field),
            "cantidad": cantidad,
            "precio": precio,
            "total": round(cantidad * precio)
        })
    return out

# --- Flujo de conversación básico ---
# Estados posibles:
# "idle", "waiting_cliente", "waiting_producto_add", "confirmar_envio", "generando"
# session structure:
# { id: session_id, phase: str, data: { cliente, direccion, productos: [{nombre,cantidad,precio}], metodoPago } }

def start_session(from_number: str):
    sid = str(uuid.uuid4())
    sessions[from_number] = {
        "id": sid,
        "phase": "collect_cliente",
        "data": {
            "cliente": None,
            "direccion": None,
            "productos": [],
            "metodoPago": "efectivo"
        }
    }
    return sessions[from_number]

# --- Webhook Twilio (WhatsApp) ---
# Twilio posts form fields: From, Body, etc.
@app.post("/webhook/twilio", response_class=PlainTextResponse)
async def twilio_webhook(From: str = Form(...), Body: str = Form(...)):
    """
    Endpoint público que Twilio llamará con mensajes entrantes.
    From example: "whatsapp:+569XXXXXXXX"
    Body: texto del cliente
    """
    logger.info("Webhook recvd From=%s Body=%s", From, Body)
    user = From  # usar número como key de sesión

    text = Body.strip()
    # Comandos rápidos:
    text_upper = text.upper()

    # iniciar flujo
    if text_upper.startswith("COTIZAR") or text_upper.startswith("CREAR COTIZACION"):
        sess = start_session(user)
        reply = ("Perfecto. Vamos a crear una cotización.\n"
                 "Primero dime el nombre del cliente (ej: Cliente: ACME Ltda):")
        response = MessagingResponse()
        response.message(reply)
        return PlainTextResponse(str(response), media_type="application/xml")

    # si no hay sesión iniciada, usar comandos
    if user not in sessions:
        # soporte comando en una sola línea: COTIZAR cliente=ACME; producto=SKU1,2,1000; producto=SKU2,1,500
        if text_upper.startswith("COTIZAR FAST") or text_upper.startswith("COTIZAR:"):
            # Intento parse rápido (muy permissive)
            # formato esperado (ejemplo):
            # COTIZAR: cliente=ACME; direccion=Av. Las Condes 123; producto=SKU1|2|10000; producto=SKU2|1|5000; pago=credito
            try:
                payload = {"cliente": None, "direccion": "", "productos": [], "metodoPago": "efectivo", "tipo": "cotizacion"}
                parts = text.split(";")
                for p in parts:
                    p = p.strip()
                    if not p: continue
                    if "=" in p:
                        k,v = p.split("=",1)
                        k = k.strip().lower()
                        v = v.strip()
                        if k == "cliente":
                            payload["cliente"] = v
                        elif k == "direccion":
                            payload["direccion"] = v
                        elif k in ("pago","metodo","pagos","metodopago"):
                            payload["metodoPago"] = v
                        elif k == "producto":
                            # producto valor esperado sku|cantidad|precio  -> permitir varios producto=...
                            parts_product = v.split("|")
                            if len(parts_product) >= 3:
                                sku, qty, price = parts_product[0].strip(), parts_product[1].strip(), parts_product[2].strip()
                                payload["productos"].append({
                                    "itemId": sku,
                                    "cantidad": int(qty),
                                    "precio": float(price),
                                    "total": int(int(qty) * float(price))
                                })
                if not payload["cliente"] or len(payload["productos"]) == 0:
                    raise ValueError("Faltan cliente o productos")
                # llamar backend
                created = call_create_cotizacion(payload)
                reply = f"Cotización creada con éxito. Número: {created.get('numero') or created.get('_id')}\nID: {created.get('_id')}"
            except Exception as e:
                logger.exception("Error COTIZAR FAST")
                reply = f"No pude procesar tu cotización rápida. Usa formato: COTIZAR: cliente=ACME; producto=SKU|2|1000; producto=SKU2|1|500"
            resp = MessagingResponse()
            resp.message(reply)
            return PlainTextResponse(str(resp), media_type="application/xml")
        # si no hay sesión ni comando
        resp = MessagingResponse()
        resp.message("Escribe 'COTIZAR' para iniciar una cotización o 'COTIZAR FAST: ...' para enviar en una sola línea.")
        return PlainTextResponse(str(resp), media_type="application/xml")

    # si hay sesión en progreso
    sess = sessions[user]
    phase = sess["phase"]
    data = sess["data"]

    # ---- manejar fases ----
    if phase == "collect_cliente":
        # esperar nombre de cliente
        # aceptar formatos como "Cliente: ACME" o solo texto
        if ":" in text:
            possible = text.split(":",1)[1].strip()
        else:
            possible = text
        data["cliente"] = possible
        sess["phase"] = "collect_direccion"
        resp = MessagingResponse()
        resp.message("Entendido. Ahora envíame la dirección de entrega (o escribe 'omit' para dejar en blanco).")
        return PlainTextResponse(str(resp), media_type="application/xml")

    if phase == "collect_direccion":
        if text.lower() != "omit":
            data["direccion"] = text
        sess["phase"] = "add_productos"
        resp = MessagingResponse()
        resp.message("Perfecto. Ahora añade productos uno por uno en el formato:\nSKU|cantidad|precio\nEj: PROD123|2|15000\nCuando termines escribe 'FIN'.")
        return PlainTextResponse(str(resp), media_type="application/xml")

    if phase == "add_productos":
        if text.strip().upper() == "FIN":
            if len(data["productos"]) == 0:
                resp = MessagingResponse()
                resp.message("Aún no agregaste productos. Agrega al menos uno con SKU|cantidad|precio.")
                return PlainTextResponse(str(resp), media_type="application/xml")
            sess["phase"] = "confirmar_envio"
            # mostrar resumen
            lines = [f"Cliente: {data['cliente']}", f"Dirección: {data.get('direccion','-')}", "Productos:"]
            for it in data["productos"]:
                lines.append(f"- {it.get('itemId')} x{it.get('cantidad')} @ ${it.get('precio')}")
            lines.append("\nEscribe 'CONFIRMAR' para crear la cotización o 'CANCELAR' para abortar.")
            resp = MessagingResponse()
            resp.message("\n".join(lines))
            return PlainTextResponse(str(resp), media_type="application/xml")
        # parsear producto linea
        try:
            parts = text.split("|")
            if len(parts) < 3:
                raise ValueError("Formato inválido")
            sku = parts[0].strip()
            cantidad = int(parts[1].strip())
            precio = float(parts[2].strip())
            data["productos"].append({"itemId": sku, "cantidad": cantidad, "precio": precio, "total": cantidad * precio})
            resp = MessagingResponse()
            resp.message(f"Añadido: {sku} x{cantidad} @ ${precio}. Escribe otro producto o 'FIN'.")
            return PlainTextResponse(str(resp), media_type="application/xml")
        except Exception as e:
            logger.exception("error parse producto")
            resp = MessagingResponse()
            resp.message("No pude leer ese producto. Usa formato SKU|cantidad|precio (ej: PROD1|2|15000).")
            return PlainTextResponse(str(resp), media_type="application/xml")

    if phase == "confirmar_envio":
        if text.strip().upper() == "CONFIRMAR":
            # construir payload y enviar al backend (async)
            sess["phase"] = "generando"
            payload = {
                "cliente": data["cliente"],
                "direccion": data.get("direccion",""),
                "fechaEntrega": "",
                "metodoPago": data.get("metodoPago","efectivo"),
                "tipo": "cotizacion",
                "productos": data["productos"]
            }
            try:
                created = call_create_cotizacion(payload)
                # limpiar sesión
                del sessions[user]
                resp = MessagingResponse()
                resp.message(f"Cotización creada ✅\nNúmero: {created.get('numero') or created.get('_id')}\nID: {created.get('_id')}")
                return PlainTextResponse(str(resp), media_type="application/xml")
            except Exception as e:
                logger.exception("Error creando cotizacion backend")
                sess["phase"] = "confirmar_envio"
                resp = MessagingResponse()
                resp.message("Hubo un error creando la cotización en el servidor. Intenta de nuevo más tarde.")
                return PlainTextResponse(str(resp), media_type="application/xml")
        elif text.strip().upper() == "CANCELAR":
            del sessions[user]
            resp = MessagingResponse()
            resp.message("Operación cancelada. Escribe 'COTIZAR' para iniciar otra cotización.")
            return PlainTextResponse(str(resp), media_type="application/xml")
        else:
            resp = MessagingResponse()
            resp.message("Escribe 'CONFIRMAR' para crear la cotización o 'CANCELAR' para abortar.")
            return PlainTextResponse(str(resp), media_type="application/xml")

    # default
    resp = MessagingResponse()
    resp.message("No entendí tu mensaje. Escribe 'COTIZAR' para iniciar una cotización.")
    return PlainTextResponse(str(resp), media_type="application/xml")


# health
@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)
