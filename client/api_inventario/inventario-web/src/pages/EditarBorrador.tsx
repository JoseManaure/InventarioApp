// src/pages/EditarBorrador.tsx
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

export default function EditarBorrador() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // estados (idénticos a Cotizaciones.tsx)
  const [cliente, setCliente] = useState('');
  const [rutCliente, setRutCliente] = useState('');
  const [direccion, setDireccion] = useState('');
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [tipo] = useState<'cotizacion'>('cotizacion'); // fijo en cotizacion
  const [correlativo, setCorrelativo] = useState<number | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [busqueda, setBusqueda] = useState('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [precios, setPrecios] = useState<Record<string, number>>({});
  const [giroCliente, setGiroCliente] = useState('');
  const [direccionCliente, setDireccionCliente] = useState('');
  const [comunaCliente, setComunaCliente] = useState('');
  const [ciudadCliente, setCiudadCliente] = useState('Santiago');
  const [atencion, setAtencion] = useState('');
  const [emailCliente, setEmailCliente] = useState('');
  const [telefonoCliente, setTelefonoCliente] = useState('');
  const [productos, setProductos] = useState<any[]>([]);
  const [preciosPersonalizados, setPreciosPersonalizados] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!id) return;
    api.get(`/cotizaciones/${id}`)
      .then(res => {
        const d = res.data;
        setCliente(d.cliente || '');
        setRutCliente(d.rutCliente || '');
        setDireccion(d.direccion || '');
        setDireccionCliente(d.direccionCliente || '');
        setComunaCliente(d.comunaCliente || '');
        setCiudadCliente(d.ciudadCliente || '');
        setFechaEntrega(d.fechaEntrega || '');
        setMetodoPago(d.metodoPago || 'efectivo');
        setGiroCliente(d.giroCliente || '');
        setAtencion(d.atencion || '');
        setEmailCliente(d.emailCliente || '');
        setTelefonoCliente(d.telefonoCliente || '');

        const preciosIniciales: Record<string, number> = {};
        const preciosPersIniciales: Record<string, number> = {};
        const seleccionadosIniciales: Record<string, number> = {};

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
      .catch(err => console.error("Error cargando borrador:", err));
  }, [id]);

  useEffect(() => {
    api.get('/items').then(res => setItems(res.data)).catch(console.error);
  }, []);

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

  const actualizarBorrador = async () => {
    const { seleccionados } = calcularResumen();
    try {
      const res = await api.put(`/cotizaciones/${id}`, {
        cliente, direccion, rutCliente, giroCliente, direccionCliente,
        comunaCliente, ciudadCliente, atencion, emailCliente, telefonoCliente,
        fechaHoy: new Date().toLocaleDateString(), fechaEntrega, metodoPago,
        tipo: 'cotizacion', estado: 'borrador',
        productos: seleccionados.map(p => ({
          itemId: p.id, cantidad: p.cantidad,
          precio: preciosPersonalizados[p.id] ?? p.precio,
        })),
      });
      setCorrelativo(res.data.numero);
      alert('✅ Borrador actualizado');
      navigate('/cotizaciones');
    } catch (err) {
      console.error(err);
      alert('❌ Error al actualizar borrador');
    }
  };

  const { seleccionados, subtotal, iva, total } = calcularResumen();

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
        <FileText className="w-6 h-6 text-blue-600" />
        EDITAR BORRADOR
      </h1>

      <AccionesCotizacion
        onGuardarBorrador={actualizarBorrador}
        onConfirmar={actualizarBorrador}
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
        disableTipo={true} // 👈 siempre fijo
        metodoPago={metodoPago} setMetodoPago={setMetodoPago}
        tipo={tipo} setTipo={() => {}} // bloqueado
        giroCliente={giroCliente} setGiroCliente={setGiroCliente}
        direccionCliente={direccionCliente} setDireccionCliente={setDireccionCliente}
        comunaCliente={comunaCliente} setComunaCliente={setComunaCliente}
        ciudadCliente={ciudadCliente} setCiudadCliente={setCiudadCliente}
        atencion={atencion} setAtencion={setAtencion}
        emailCliente={emailCliente} setEmailCliente={setEmailCliente}
        telefonoCliente={telefonoCliente} setTelefonoCliente={setTelefonoCliente}
      />

      <BuscadorProductos
        busqueda={busqueda}
        setBusqueda={setBusqueda}
        onAgregar={(item) => {
          setSelectedItems(prev => ({
            ...prev,
            [item._id]: (prev[item._id] || 0) + 1
          }));
        }}
      />

      <ResumenTablaProductos
        seleccionados={seleccionados}
        subtotal={subtotal}
        iva={iva}
        total={total}
        onCantidadChange={handleCantidadChange}
        onEliminar={eliminarProducto}
        onPrecioChange={handlePrecioChange}
      />
    </div>
  );
}
