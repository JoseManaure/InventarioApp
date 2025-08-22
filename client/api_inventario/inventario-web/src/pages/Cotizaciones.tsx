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

export default function Cotizaciones() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Estados generales
  const [cliente, setCliente] = useState('');
  const [rutCliente, setRutCliente] = useState('');
  const [direccion, setDireccion] = useState('');
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [tipo, setTipo] = useState<'cotizacion' | 'nota'>('cotizacion');
  const [correlativo, setCorrelativo] = useState<number | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [busqueda, setBusqueda] = useState('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [precios, setPrecios] = useState<Record<string, number>>({});
  const [preciosPersonalizados, setPreciosPersonalizados] = useState<Record<string, number>>({});
  const [productos, setProductos] = useState<any[]>([]);

  // Campos adicionales
  const [formaPago, setFormaPago] = useState("65% Al inicio y 35% al momento de la entrega.");
  const [nota, setNota] = useState("Esta cotización es aceptada después de cancelado el 65%.");

  const [giroCliente, setGiroCliente] = useState('');
  const [direccionCliente, setDireccionCliente] = useState('');
  const [comunaCliente, setComunaCliente] = useState('');
  const [ciudadCliente, setCiudadCliente] = useState('Santiago');
  const [atencion, setAtencion] = useState('');
  const [emailCliente, setEmailCliente] = useState('');
  const [telefonoCliente, setTelefonoCliente] = useState('');

  // Cargar items y cotización existente
  useEffect(() => {
    api.get('/items').then(res => setItems(res.data)).catch(console.error);

    if (!id) return;

    api.get(`/cotizaciones/${id}`)
      .then(res => {
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

        const preciosIniciales: Record<string, number> = {};
        const preciosPersIniciales: Record<string, number> = {};
        const seleccionadosIniciales: Record<string, number> = {};

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (d.productos || []).forEach((p: any) => {
          const idProd = p.itemId || p._id;
          preciosIniciales[idProd] = p.precio || 0;
          preciosPersIniciales[idProd] = p.precio || 0;
          seleccionadosIniciales[idProd] = p.cantidad || 1;
        });

        setProductos(d.productos || []);
        setPrecios(preciosIniciales);
        setPreciosPersonalizados(preciosPersIniciales);
        setSelectedItems(seleccionadosIniciales);
      })
      .catch(console.error);
  }, [id]);

  const eliminarProducto = (id: string) => {
    setSelectedItems(prev => {
      const copia = { ...prev };
      delete copia[id];
      return copia;
    });
  };

  const handlePrecioChange = (id: string, nuevoPrecio: number) => {
    setPreciosPersonalizados(prev => ({ ...prev, [id]: nuevoPrecio }));
  };

  const handleCantidadChange = (id: string, cantidad: number) => {
    setSelectedItems(prev => {
      const copia = { ...prev, [id]: cantidad };
      if (cantidad <= 0) delete copia[id];
      return copia;
    });
  };

  const calcularResumen = () => {
    const seleccionados = Object.entries(selectedItems).map(([id, cantidad]) => {
      const i = items.find(it => it._id === id);
      const precio = preciosPersonalizados[id] ?? (i?.precio ?? 0);
      return {
        id,
        nombre: i?.nombre ?? '[Eliminado]',
        cantidad,
        precio,
        total: precio * cantidad,
      };
    });
    const subtotal = seleccionados.reduce((a, p) => a + p.total, 0);
    const iva = subtotal * 0.19;
    return { seleccionados, subtotal, iva, total: subtotal + iva };
  };

  const { seleccionados, subtotal, iva, total } = calcularResumen();

  // Función para guardar borrador
  const guardarBorrador = async () => {
    const { seleccionados, total } = calcularResumen();
    try {
      await api.post('/cotizaciones/borrador', {
        cliente, direccion, fechaEntrega, metodoPago,
        tipo, total, rutCliente, giroCliente, formaPago,
        nota, direccionCliente, comunaCliente, ciudadCliente, atencion,
        emailCliente, telefonoCliente, estado: "borrador",
        productos: seleccionados.map(p => ({ itemId: p.id, cantidad: p.cantidad, precio: p.precio, total: p.total })),
      });
      alert('✅ Borrador guardado');
      navigate("/borradores");
    } catch {
      alert('❌ Error al guardar borrador');
    }
  };

  // Función para crear o actualizar cotización
  const enviarCotizacion = async () => {
    if (enviando) return;
    setEnviando(true);
    const { seleccionados } = calcularResumen();
    try {
      let res;
      if (id) {
        res = await api.put(`/cotizaciones/${id}`, {
          cliente, direccion, rutCliente, giroCliente, direccionCliente,
          comunaCliente, ciudadCliente, atencion, emailCliente, telefonoCliente,
          formaPago, nota, fechaHoy: new Date().toLocaleDateString(), fechaEntrega, metodoPago, tipo,
          productos: seleccionados.map(p => ({ itemId: p.id, cantidad: p.cantidad, precio: preciosPersonalizados[p.id] ?? p.precio })),
        });
      } else {
        res = await api.post('/cotizaciones', {
          cliente, direccion, rutCliente, giroCliente, direccionCliente,
          comunaCliente, ciudadCliente, atencion, emailCliente, telefonoCliente,
          formaPago, nota, fechaHoy: new Date().toLocaleDateString(), fechaEntrega, metodoPago, tipo,
          productos: seleccionados.map(p => ({ itemId: p.id, cantidad: p.cantidad, precio: preciosPersonalizados[p.id] ?? p.precio })),
        });
      }

      setCorrelativo(res.data.numero);
      const productosParaPDF = seleccionados.map(p => ({ ...p, precio: preciosPersonalizados[p.id] ?? p.precio }));

      // ✅ Aquí se pasan formaPago y nota al PDF
      const pdfBlob = generarGuiaPDF(cliente, productosParaPDF, {
        fechaEntrega,
        metodoPago,
        tipoDocumento: tipo,
        rutCliente,
        numeroDocumento: res.data.numero,
        giroCliente,
        direccionCliente,
        comunaCliente,
        ciudadCliente,
        atencion,
        emailCliente,
        telefonoCliente,
        tipo,
        direccion,
        formaPago,
        nota,
      });

      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      setShowPdfModal(true);

      const fd = new FormData();
      fd.append('file', new File([pdfBlob], 'doc.pdf', { type: 'application/pdf' }));
      fd.append('cotizacionId', res.data._id);
      await api.post('/cotizaciones/upload-pdf', fd);

      alert('✅ Cotización creada/actualizada');
    } catch (err) {
      console.error(err);
      alert('❌ Error al crear/actualizar');
    }
    setEnviando(false);
  };

  // Función para enviar WhatsApp
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

      {/* Buscador de productos fuera del scroll */}
      <div className="sticky top-0 z-20 bg-gray-50 p-4 rounded-lg shadow-sm">
        <BuscadorProductos
          busqueda={busqueda}
          setBusqueda={setBusqueda}
          onAgregar={(item) => setSelectedItems((prev) => ({ ...prev, [item._id]: (prev[item._id] || 0) + 1 }))}
        />
      </div>

      {/* Tabla de productos con scroll interno */}
      <div className="border rounded-lg overflow-y-auto max-h-96 shadow-sm">
        <ResumenTablaProductos
          seleccionados={seleccionados}
          subtotal={subtotal}
          iva={iva}
          total={total}
          onCantidadChange={handleCantidadChange}
          onEliminar={eliminarProducto}
          onPrecioChange={handlePrecioChange}
          placeholder="Agrega productos aquí"
        />
      </div>

      {/* Modal PDF */}
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
