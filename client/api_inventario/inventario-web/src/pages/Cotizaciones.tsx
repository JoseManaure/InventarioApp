import { useState, useEffect } from 'react';
import { CheckCircle, FileText } from 'lucide-react';
import api from '../api/api';
import type { Item } from '../types/Item';
import { generarGuiaPDF } from '../utils/pdf';
import { useParams } from 'react-router-dom';




export default function Cotizacion() {
  const { id } = useParams<{ id: string }>();
  const [cliente, setCliente] = useState('');
  const [rutCliente, setRutCliente] = useState('');
  const [direccion, setDireccion] = useState('');
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [tipo, setTipo] = useState<'cotizacion' | 'nota'>('cotizacion');
  const [correlativo, setCorrelativo] = useState<number | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const [giroCliente, setGiroCliente] = useState('');
  const [direccionCliente, setDireccionCliente] = useState('');
  const [comunaCliente, setComunaCliente] = useState('');
  const [ciudadCliente, setCiudadCliente] = useState('Santiago');
  const [atencion, setAtencion] = useState('');
  const [emailCliente, setEmailCliente] = useState('');
  const [telefonoCliente, setTelefonoCliente] = useState('');

  const [enviando, setEnviando] = useState(false);
useEffect(() => {
  if (id) {
    api.get(`/cotizaciones/${id}`)
      .then(res => {
        const d = res.data;
        setCliente(d.cliente || '');
        setRutCliente(d.rutCliente || '');
        setDireccion(d.direccion || '');
        setFechaEntrega(d.fechaEntrega || '');
        setMetodoPago(d.metodoPago || 'efectivo');
        setTipo(d.tipo || 'cotizacion');

        // 🔧 Aseguramos cargar precios y nombres si vienen desde el backend
        const cantidades: Record<string, number> = {};
        const productosDesdeCotizacion = d.productos || [];

        // ⚠️ Aquí nos aseguramos que los productos queden con cantidad Y precio
        const productosCompletos = productosDesdeCotizacion.map((p: any) => {
          const id = p.itemId || p._id;
          cantidades[id] = p.cantidad;

          return {
            _id: id,
            nombre: p.nombre || '[Sin nombre]',
            cantidad: p.cantidad,
            precio: p.precio || 0,
          };
        });

        setSelectedItems(cantidades);
        setItems((prevItems) => {
          // Mezclar productos de la cotización con los previos
          const nuevos = [...prevItems];
          productosCompletos.forEach((p) => {
            const yaExiste = nuevos.some(i => i._id === p._id);
            if (!yaExiste) nuevos.push(p);
          });
          return nuevos;
        });

        // Campos adicionales
        setGiroCliente(d.giroCliente || '');
        setDireccionCliente(d.direccionCliente || '');
        setComunaCliente(d.comunaCliente || '');
        setCiudadCliente(d.ciudadCliente || '');
        setAtencion(d.atencion || '');
        setEmailCliente(d.emailCliente || '');
        setTelefonoCliente(d.telefonoCliente || '');
      })
      .catch(err => {
        console.error('❌ Error al cargar cotización o nota', err);
        alert('No se pudo cargar el documento');
      });
  }
}, [id]);



  useEffect(() => {
    api.get('/items').then(res => setItems(res.data)).catch(console.error);
  }, []);

  const handleAgregarProducto = (item: Item) => {
    if (tipo === 'nota' && item.cantidad <= 0) {
      alert('❌ No hay stock disponible');
      return;
    }
    setSelectedItems(prev => ({ ...prev, [item._id]: (prev[item._id] || 0) + 1 }));
    setBusqueda('');
  };

  const eliminarProducto = (id: string) => {
    setSelectedItems(prev => {
      const u = { ...prev }; delete u[id]; return u;
    });
  };

  const handleCantidadChange = (id: string, cantidad: number) => {
    setSelectedItems(prev => {
      const u = { ...prev, [id]: cantidad };
      if (cantidad <= 0) delete u[id];
      return u;
    });
  };

  const calcularResumen = () => {
    const seleccionados = Object.entries(selectedItems).map(([id, cantidad]) => {
      const i = items.find(it => it._id === id);
      const precio = i?.precio ?? 0;
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

  const guardarBorrador = async () => {
    const { seleccionados, total } = calcularResumen();
    try {
      await api.post('/cotizaciones/borrador', {
        cliente, direccion, fechaEntrega,
        metodoPago, tipo, total,
        productos: seleccionados.map(p => ({
          itemId: p.id,
          cantidad: p.cantidad,
          precio: p.precio,
          total: p.total,
        })),
      });
      alert('✅ Borrador guardado');
    } catch {
      alert('❌ Error al guardar borrador');
    }
  };

  const enviarCotizacion = async () => {
    if (enviando) return; // evita doble envío
    setEnviando(true);
      if (id) {
    await actualizarCotizacion();
    return;
  }
    const { seleccionados } = calcularResumen();
    if (tipo === 'nota') {
  for (const p of seleccionados) {
    const i = items.find(it => it._id === p.id);
    if (!i) continue;
    if (p.cantidad > i.cantidad) {
      alert(`⚠️ Advertencia: "${p.nombre}" no tiene suficiente stock. El stock quedará en negativo.`);
      // No se hace return, solo advertencia
    }
  }
}

    try {
      const res = await api.post('/cotizaciones', {
        cliente, direccion, rutCliente,
        fechaHoy: new Date().toLocaleDateString(),
        fechaEntrega, metodoPago, tipo,
        productos: seleccionados.map(p => ({
          itemId: p.id, cantidad: p.cantidad,
        })),
      });
      setCorrelativo(res.data.numero);
      const pdfBlob = generarGuiaPDF(cliente, seleccionados, {
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
      });
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      const fd = new FormData();
      fd.append('file', new File([pdfBlob], 'doc.pdf', { type: 'application/pdf' }));
      fd.append('cotizacionId', res.data._id);
      await api.post('/cotizaciones/upload-pdf', fd);
      alert('✅ Documento creado');
      resetFormulario();
    } catch (err) {
      console.error(err);
      alert('❌ Error al crear');
    }
  };


  const actualizarCotizacion = async () => {
  const { seleccionados } = calcularResumen();
  try {
    const res = await api.put(`/cotizaciones/${id}`, {
      cliente, direccion, rutCliente,
      fechaEntrega, metodoPago, tipo,
      productos: seleccionados.map(p => ({
        itemId: p.id,
        cantidad: p.cantidad,
           precio: p.precio,
      })),
    });

    setCorrelativo(res.data.numero);
    const pdfBlob = generarGuiaPDF(cliente, seleccionados, {
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
    });

    const url = URL.createObjectURL(pdfBlob);
    setPdfUrl(url);

    const fd = new FormData();
    fd.append('file', new File([pdfBlob], 'doc.pdf', { type: 'application/pdf' }));
    fd.append('cotizacionId', res.data._id);
    await api.post('/cotizaciones/upload-pdf', fd);

    alert('✅ Cotización actualizada');
  } catch (err) {
    console.error(err);
    alert('❌ Error al actualizar cotización');
  }
};



  const { seleccionados, subtotal, iva, total } = calcularResumen();

  const resetFormulario = () => {
  setCliente('');
  setRutCliente('');
  setDireccion('');
  setFechaEntrega('');
  setMetodoPago('efectivo');
  setTipo('cotizacion');
  setSelectedItems({});
  setBusqueda('');
  setGiroCliente('');
  setDireccionCliente('');
  setComunaCliente('');
  setCiudadCliente('Santiago');
  setAtencion('');
  setEmailCliente('');
  setTelefonoCliente('');
  setPdfUrl(null);
  setCorrelativo(null);
};


  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
        <FileText className="w-6 h-6 text-blue-600" />
        DOCUMENTO
      </h1>
         {/* Acciones */}
      <div className="flex flex-wrap gap-4 justify-between">
        <div className="flex gap-2">
          <button onClick={guardarBorrador}
            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded font-semibold shadow">
            <FileText className="w-5 h-5" /> Borrador
          </button>
          <button
          onClick={enviarCotizacion}
          disabled={enviando}
          className={`flex items-center gap-2 px-6 py-3 rounded font-semibold 
            ${enviando ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
  <CheckCircle className="w-5 h-5" /> {enviando ? 'Creando...' : 'Confirmar'}
</button>

        {pdfUrl && <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Ver PDF</a>}
        </div>
      </div>
      {correlativo &&
        <p className="text-lg font-medium text-gray-700">
          Número {tipo==='cotizacion'?'de Cotización':'de Nota'}: {correlativo}
        </p>}
      <div className="relative">
        <br></br><br></br>        
      </div>

      {/* Tabla fija de productos */}
    <div className="w-full max-w-5xl mx-auto">
  <table className="w-full table-fixed border-collapse bg-white shadow-md rounded-lg min-h-[200px]">
    <thead>
      <tr className="bg-gray-100 text-gray-700 text-sm">
        <th className="px-4 py-2 w-24">Cantidad</th>
        <th className="px-4 py-2">Detalle</th>
        <th className="px-4 py-2 text-right w-32">Valor Unit.</th>
        <th className="px-4 py-2 text-right w-32">Subtotal</th>
        <th className="px-4 py-2 text-center w-24">Acción</th>
      </tr>
    </thead>
    <tbody>
      {seleccionados.length === 0 ? (
        <tr>
          <td colSpan={5} className="text-center py-6 text-gray-500 italic bg-gray-50">
            🛒 Agrega productos desde el buscador superior. Aquí verás el resumen.
          </td>
        </tr>
      ) : (
        seleccionados.map((p) => (
          <tr key={p.id} className="hover:bg-gray-50 text-sm">
            <td className="px-4 py-2">
              <input
                type="number"
                min={1}
                className="w-16 border rounded p-1 text-sm"
                value={p.cantidad}
                onChange={(e) => handleCantidadChange(p.id, parseInt(e.target.value))}
              />
            </td>
            <td className="px-4 py-2">{p.nombre}</td>
            <td className="px-4 py-2 text-right">${p.precio.toLocaleString('es-CL')}</td>
            <td className="px-4 py-2 text-right">${p.total.toLocaleString('es-CL')}</td>
            <td className="px-4 py-2 text-center">
              <button
                className="text-red-600 hover:text-red-800 text-sm"
                onClick={() => eliminarProducto(p.id)}
              >
                Eliminar
              </button>
            </td>
          </tr>
        ))
      )}
    </tbody>

    {/* Pie de resumen solo si hay productos */}
    {seleccionados.length > 0 && (
      <tfoot className="bg-gray-50 text-sm font-medium">
        <tr>
          <td colSpan={3} className="px-4 py-2 text-right">Subtotal</td>
          <td colSpan={2} className="px-4 py-2 text-right">${subtotal.toLocaleString('es-CL')}</td>
        </tr>
        <tr>
          <td colSpan={3} className="px-4 py-2 text-right">IVA (19%)</td>
          <td colSpan={2} className="px-4 py-2 text-right">${iva.toLocaleString('es-CL')}</td>
        </tr>
        <tr>
          <td colSpan={3} className="px-4 py-2 text-right text-green-700">Total</td>
          <td colSpan={2} className="px-4 py-2 text-right text-green-700">${total.toLocaleString('es-CL')}</td>
        </tr>
      </tfoot>
    )}
  </table>
</div>



      {/* Campos generales cliente */}
      <div className="grid md:grid-cols-3 gap-4">
        <input value={cliente} onChange={e => setCliente(e.target.value)} placeholder="Nombre cliente"
               className="border p-2 rounded" />
        <input value={rutCliente} onChange={e => setRutCliente(e.target.value)} placeholder="RUT cliente"
               className="border p-2 rounded" />
        <input value={direccion} onChange={e => setDireccion(e.target.value)} placeholder="Dirección de Dpcho"
               className="border p-2 rounded" />
        <input type="date" value={fechaEntrega} onChange={e => setFechaEntrega(e.target.value)}
               className="border p-2 rounded" />
        <select value={metodoPago} onChange={e => setMetodoPago(e.target.value)}
                className="border p-2 rounded">
          <option value="efectivo">Efectivo</option>
          <option value="transferencia">Transferencia</option>
          <option value="debito">Débito</option>
        </select>
        <select value={tipo} onChange={e => setTipo(e.target.value as never)}
                className="border p-2 rounded">
          <option value="cotizacion">Cotización</option>
          <option value="nota">Nota de Venta</option>
        </select>
      </div>

      <div className="mt-6 p-4 border rounded-lg shadow bg-gray-50">
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Agregar producto..."
          className="w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {busqueda && (
          <ul className="absolute z-10 bg-white w-full border shadow max-h-60 overflow-auto">
          {items
            .filter(i => i.nombre.toLowerCase().includes(busqueda.toLowerCase()))
            .slice(0, 4) // 👈 Limita a los primeros 4 resultados
            .map(i => (
              <li
                key={i._id}
                className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${i.cantidad === 0 ? 'text-gray-400' : ''}`}
                onClick={() => handleAgregarProducto(i)}
              >
                {i.nombre} - ${i.precio.toLocaleString('es-CL')} ({i.cantidad} disp.)
              </li>
            ))}

          </ul>
        )}
  <h2 className="text-lg font-semibold mb-4 text-gray-700">📋 Datos adicionales del cliente</h2>

  <div className="grid md:grid-cols-3 gap-4">
    <input
      value={giroCliente}
      onChange={e => setGiroCliente(e.target.value)}
      placeholder="Giro"
      className="border p-2 rounded"
    />
    <input
      value={direccionCliente}
      onChange={e => setDireccionCliente(e.target.value)}
      placeholder="Dirección"
      className="border p-2 rounded"
    />
    <input
      value={comunaCliente}
      onChange={e => setComunaCliente(e.target.value)}
      placeholder="Comuna"
      className="border p-2 rounded"
    />
    <input
      value={ciudadCliente}
      onChange={e => setCiudadCliente(e.target.value)}
      placeholder="Ciudad"
      className="border p-2 rounded"
    />
    <input
      value={atencion}
      onChange={e => setAtencion(e.target.value)}
      placeholder="Atención (Sr/Sra)"
      className="border p-2 rounded"
    />
    <input
      type="email"
      value={emailCliente}
      onChange={e => setEmailCliente(e.target.value)}
      placeholder="Correo electrónico"
      className="border p-2 rounded"
    />
    <input
      value={telefonoCliente}
      onChange={e => setTelefonoCliente(e.target.value)}
      placeholder="Celular"
      className="border p-2 rounded"
    />
  </div>
</div>



   
    </div>
  );
}
