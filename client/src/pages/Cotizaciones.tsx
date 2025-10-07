import { useState } from 'react';
import { FileText } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { generarGuiaPDF } from '../utils/pdf';
import api from '../api/api';

import BuscadorProductos from '../components/BuscadorProductos';
import FormularioCliente from '../components/FormularioCliente';
import AccionesCotizacion from '../components/AccionesCotizacion';
import ResumenTablaProductos from '../components/ResumenTablaProductos';

import { useCotizacion } from '../hooks/useCotizacion';
import type { ProductoResumen } from '../hooks/useCotizacion';
import type { Item } from '../types/Item';

export default function Cotizaciones() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    cliente, setCliente,
    rutCliente, setRutCliente,
    direccion, setDireccion,
    fechaEntrega, setFechaEntrega,
    metodoPago, setMetodoPago,
    tipo, setTipo,
    selectedItems,
    agregarItem,
    handleCantidadChange,
    handlePrecioChange,
    eliminarProducto,
    calcularResumen,
    giroCliente, setGiroCliente,
    direccionCliente, setDireccionCliente,
    comunaCliente, setComunaCliente,
    ciudadCliente, setCiudadCliente,
    atencion, setAtencion,
    emailCliente, setEmailCliente,
    telefonoCliente, setTelefonoCliente,
    formaPago, setFormaPago,
    nota, setNota
  } = useCotizacion(id);

  const [busqueda, setBusqueda] = useState('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [correlativo, setCorrelativo] = useState<number | null>(null);

  const { seleccionados, subtotal, iva, total } = calcularResumen();

  // 🔹 Funciones locales para crear y actualizar cotización
  const fetchCrearCotizacion = async (data: any) => {
    const res = await api.post('/cotizaciones', data);
    return res.data;
  };

  const fetchActualizarCotizacion = async (id: string, data: any) => {
    const res = await api.put(`/cotizaciones/${id}`, data);
    return res.data;
  };

  const guardarBorrador = async () => {
    try {
      await fetchCrearCotizacion({ estado: 'borrador' });
      alert('✅ Borrador guardado');
      navigate("/ver-borradores");
    } catch {
      alert('❌ Error al guardar borrador');
    }
  };

  const enviarCotizacion = async () => {
    if (enviando) return;
    setEnviando(true);

    try {
      const data = {
        cliente, direccion, rutCliente, giroCliente, direccionCliente,
        comunaCliente, ciudadCliente, atencion, emailCliente, telefonoCliente,
        formaPago, nota, fechaHoy: new Date().toLocaleDateString(), fechaEntrega, metodoPago, tipo,
        productos: seleccionados.map(p => ({
          itemId: p.id.toString(),
          cantidad: p.cantidad,
          nombre: p.nombre,
          precio: p.precio,
          total: p.total
        }))
      };
      let res;
      if (id) res = await fetchActualizarCotizacion(id, data);
      else res = await fetchCrearCotizacion(data);

      setCorrelativo(res.numero);

      const pdfBlob = generarGuiaPDF(cliente, seleccionados, {
        fechaEntrega, metodoPago, tipoDocumento: tipo, rutCliente, numeroDocumento: res.numero,
        giroCliente, direccionCliente, comunaCliente, ciudadCliente, atencion, emailCliente, telefonoCliente,
        tipo, direccion, formaPago, nota
      });

      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      setShowPdfModal(true);

      const fd = new FormData();
      fd.append('file', new File([pdfBlob], `cotizacion-${res.numero}.pdf`, { type: 'application/pdf' }));
      fd.append('cotizacionId', res._id);
      await api.post('/cotizaciones/upload-pdf', fd, { headers: { 'Content-Type': 'multipart/form-data' } });

      alert('✅ Cotización creada/actualizada');
    } catch (err) {
      console.error(err);
      alert('❌ Error al crear/actualizar');
    }

    setEnviando(false);
  };

  const enviarWhatsapp = () => {
    if (!telefonoCliente) { alert("⚠️ El cliente no tiene número de teléfono"); return; }
    const numero = telefonoCliente.replace(/\s+/g, "");
    const linkPDF = `${window.location.origin}/pdfs/doc.pdf`;
    const mensaje = `Hola ${cliente}, te envío la ${tipo === "nota" ? "nota de venta" : "cotización"} N°${correlativo ?? "pendiente"}.

Total: $${total.toLocaleString("es-CL")}
Forma de pago: ${metodoPago}
Fecha de entrega: ${fechaEntrega || "Por confirmar"}

Puedes descargar el documento aquí: ${linkPDF}

¡Gracias por tu preferencia!`;

    const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
        <FileText className="w-6 h-6 text-blue-600" />
        DOCUMENTO
      </h1>

      <AccionesCotizacion
        onGuardarBorrador={guardarBorrador}
        onConfirmar={enviarCotizacion}
        enviando={enviando}
        pdfUrl={pdfUrl}
        correlativo={correlativo}
        tipo={tipo}
      />

      <FormularioCliente
        cliente={cliente} setCliente={setCliente}
        rutCliente={rutCliente} setRutCliente={setRutCliente}
        fechaEntrega={fechaEntrega} setFechaEntrega={setFechaEntrega}
        disableTipo={!!id}
        metodoPago={metodoPago} setMetodoPago={setMetodoPago}
        tipo={tipo} setTipo={setTipo}
        giroCliente={giroCliente} setGiroCliente={setGiroCliente}
        direccionCliente={direccionCliente} setDireccionCliente={setDireccionCliente}
        comunaCliente={comunaCliente} setComunaCliente={setComunaCliente}
        ciudadCliente={ciudadCliente} setCiudadCliente={setCiudadCliente}
        atencion={atencion} setAtencion={setAtencion}
        emailCliente={emailCliente} setEmailCliente={setEmailCliente}
        telefonoCliente={telefonoCliente} setTelefonoCliente={setTelefonoCliente}
        direccion={direccion} setDireccion={setDireccion}
        formaPago={formaPago} setFormaPago={setFormaPago}
        nota={nota} setNota={setNota}
      />

      <div className="sticky top-0 z-20 bg-gray-50 p-4 rounded-lg shadow-sm">
        <BuscadorProductos
          busqueda={busqueda}
          setBusqueda={setBusqueda}
          onAgregar={agregarItem}
        />
      </div>

      <div className="border rounded-lg overflow-y-auto max-h-96 shadow-sm">
        {seleccionados.length > 0 ? (
          <ResumenTablaProductos
            seleccionados={seleccionados}
            subtotal={subtotal}
            iva={iva}
            total={total}
            onCantidadChange={handleCantidadChange}
            onEliminar={eliminarProducto}
            onPrecioChange={handlePrecioChange}
          />
        ) : (
          <p className="p-4 text-gray-500">Agrega productos aquí</p>
        )}
      </div>

      {showPdfModal && pdfUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-3/4 h-5/6 relative flex flex-col">
            <button onClick={() => setShowPdfModal(false)} className="absolute top-2 right-2 text-gray-600 hover:text-gray-900">✕</button>
            <iframe src={pdfUrl} className="w-full flex-grow rounded-b-lg" title="PDF Preview" />
            <div className="p-4 flex justify-end gap-3 border-t">
              <button onClick={enviarWhatsapp} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg">📲 Enviar por WhatsApp</button>
              <button onClick={() => setShowPdfModal(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg">❌ Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
