// src/pages/Cotizaciones.tsx
import { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import api from '../api/api';
import type { Item } from '../types/Item';
import { generarGuiaPDF } from '../utils/pdf';
import { useParams, useNavigate } from 'react-router-dom';

import BuscadorProductos from '../components/BuscadorProductos';
import FormularioCliente from '../components/FormularioCliente';
import AccionesCotizacion from '../components/AccionesCotizacion';
import ResumenTablaProductos from '../components/ResumenTablaProductos';

interface ProductoResumen {
  id: string;
  nombre: string;
  cantidad: number;
  precio: number;
  total: number;
}

export default function Cotizaciones() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [cliente, setCliente] = useState('');
  const [rutCliente, setRutCliente] = useState('');
  const [direccion, setDireccion] = useState('');
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [tipo, setTipo] = useState<'cotizacion' | 'nota'>('cotizacion');
  const [correlativo, setCorrelativo] = useState<number | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItems, setSelectedItems] = useState<Record<string, { cantidad: number; nombre: string; precio: number }>>({});
  const [busqueda, setBusqueda] = useState('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const [formaPago, setFormaPago] = useState("65% Al inicio y 35% al momento de la entrega.");
  const [nota, setNota] = useState("Esta cotización es aceptada después de cancelado el 65%.");
  const [giroCliente, setGiroCliente] = useState('');
  const [direccionCliente, setDireccionCliente] = useState('');
  const [comunaCliente, setComunaCliente] = useState('');
  const [ciudadCliente, setCiudadCliente] = useState('Santiago');
  const [atencion, setAtencion] = useState('');
  const [emailCliente, setEmailCliente] = useState('');
  const [telefonoCliente, setTelefonoCliente] = useState('');

  useEffect(() => {
    let mounted = true;

    const cargarItems = async () => {
      try {
        const res = await api.get('/items');
        if (!mounted) return;
        const data = Array.isArray(res.data) ? res.data : res.data.items || [];
        setItems(data);
      } catch (err) {
        console.error(err);
      }
    };

    const cargarCotizacion = async () => {
      if (!id) return;
      try {
        const res = await api.get(`/cotizaciones/${id}`);
        if (!mounted) return;
        const d = res.data;

        setCliente(d.cliente || '');
        setRutCliente(d.rutCliente || '');
        setDireccion(d.direccion || '');
        setDireccionCliente(d.direccionCliente || '');
        setComunaCliente(d.comunaCliente || '');
        setCiudadCliente(d.ciudadCliente || 'Santiago');
        setFechaEntrega(d.fechaEntrega || '');
        setMetodoPago(d.metodoPago || 'efectivo');
        setTipo(d.tipo || 'cotizacion');
        setGiroCliente(d.giroCliente || '');
        setAtencion(d.atencion || '');
        setEmailCliente(d.emailCliente || '');
        setTelefonoCliente(d.telefonoCliente || '');
        setFormaPago(d.formaPago ?? "");
        setNota(d.nota ?? "");

        const seleccionadosIniciales: Record<string, { cantidad: number; nombre: string; precio: number }> = {};
        (d.productos || []).forEach((p: any) => {
          const idProd = (p.itemId?._id || p.itemId || p._id).toString();
          seleccionadosIniciales[idProd] = {
            cantidad: p.cantidad || 1,
            nombre: p.nombre || p.itemId?.nombre || '[Eliminado]',
            precio: p.precio || p.itemId?.precio || 0
          };
        });
        setSelectedItems(seleccionadosIniciales);
      } catch (err) {
        console.error(err);
      }
    };

    cargarItems().then(() => cargarCotizacion());
    return () => { mounted = false; }
  }, [id]);

  const handleCantidadChange = (id: string, cantidad: number) => {
    setSelectedItems(prev => {
      const copia = { ...prev };
      if (cantidad <= 0) delete copia[id];
      else copia[id] = { ...copia[id], cantidad };
      return copia;
    });
  };

  const handlePrecioChange = (id: string, precio: number) => {
    setSelectedItems(prev => ({ ...prev, [id]: { ...prev[id], precio } }));
  };

  const eliminarProducto = (id: string) => {
    setSelectedItems(prev => { const copia = { ...prev }; delete copia[id]; return copia; });
  };

  const calcularResumen = () => {
    const seleccionados: ProductoResumen[] = Object.entries(selectedItems).map(([id, data]) => ({
      id,
      nombre: data.nombre,
      cantidad: data.cantidad,
      precio: data.precio,
      total: data.cantidad * data.precio
    }));

    const subtotal = seleccionados.reduce((acc, p) => acc + p.total, 0);
    const iva = subtotal * 0.19;
    const total = subtotal + iva;

    return { seleccionados, subtotal, iva, total };
  };

  const { seleccionados, subtotal, iva, total } = calcularResumen();

  const guardarBorrador = async () => {
    try {
      await api.post('/cotizaciones', {
        cliente, direccion, fechaEntrega, metodoPago,
        tipo, rutCliente, giroCliente, formaPago,
        nota, direccionCliente, comunaCliente, ciudadCliente, atencion,
        emailCliente, telefonoCliente, estado: "borrador",
        productos: seleccionados.map(p => ({
          itemId: p.id.toString(), // 🔹 forzar string
          cantidad: p.cantidad,
          nombre: p.nombre,
          precio: p.precio,
          total: p.total
        }))
      });
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
          itemId: p.id.toString(), // 🔹 forzar string
          cantidad: p.cantidad,
          nombre: p.nombre,
          precio: p.precio,
          total: p.total
        }))
      };
      let res;
      if (id) res = await api.put(`/cotizaciones/${id}`, data);
      else res = await api.post('/cotizaciones', data);

      setCorrelativo(res.data.numero);

      const pdfBlob = generarGuiaPDF(cliente, seleccionados, {
        fechaEntrega, metodoPago, tipoDocumento: tipo, rutCliente, numeroDocumento: res.data.numero,
        giroCliente, direccionCliente, comunaCliente, ciudadCliente, atencion, emailCliente, telefonoCliente,
        tipo, direccion, formaPago, nota
      });

      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      setShowPdfModal(true);

      const fd = new FormData();
      fd.append('file', new File([pdfBlob], `cotizacion-${res.data.numero}.pdf`, { type: 'application/pdf' }));
      fd.append('cotizacionId', res.data._id);
      await api.post('/cotizaciones/upload-pdf', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

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
        direccion={direccion} setDireccion={setDireccion}
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
        formaPago={formaPago} setFormaPago={setFormaPago}
        nota={nota} setNota={setNota}
      />

      <div className="sticky top-0 z-20 bg-gray-50 p-4 rounded-lg shadow-sm">
        <BuscadorProductos
          busqueda={busqueda}
          setBusqueda={setBusqueda}
          onAgregar={(item) => setSelectedItems(prev => ({
            ...prev,
            [item._id.toString()]: {
              cantidad: (prev[item._id.toString()]?.cantidad || 0) + 1,
              nombre: item.nombre,
              precio: prev[item._id.toString()]?.precio ?? item.precio
            }
          }))}
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
