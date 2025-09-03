Variables de entorno (ejemplo):

API_BASE_URL → http://tu-backend:4000

API_TOKEN → si tu backend requiere Bearer token

TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM → credenciales Twilio

PORT → puerto (default 8000)

Flujo de prueba:

Ejecución local (ngrok): uvicorn main:app --reload --port 8000

Expón http://localhost:8000/webhook/twilio vía ngrok.

En Twilio Sandbox WhatsApp configura el webhook de mensajes entrantes a esa URL.

En WhatsApp escribe COTIZAR y sigue los pasos.