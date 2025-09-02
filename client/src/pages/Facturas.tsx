import { useState, useEffect, useMemo } from 'react';
import api from '../api/api';

interface Producto {
  nombre: string;
  cantidad: number;
  precioUnitario: number;
}

interface Factura {
  _id: string;
  empresa: string;
  rut: string;
  rol: string;
  direccion: string;
  productos?: Producto[];
  numeroDocumento: string;
  tipoDocumento: 'factura' | 'boleta' | 'guia';
  fechaCreacion: string;
}

export default function Facturas() {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(false);
  const [mesSeleccionado, setMesSeleccionado] = useState<string>(() => {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  });
  const [pagina, setPagina] = useState(1);
  const [selectedFactura, setSelectedFactura] = useState<Factura | null>(null);

  const facturasPorPagina = 5;

  useEffect(() => {
  const cargarFacturas = async () => {
    setLoading(true);
    try {
       const res = await api.get('/facturas', { params: { limite: 1000 } });
      setFacturas(res.data.facturas || []); // ✅ extrae el array de facturas
    } catch (err) {
      console.error('Error cargando facturas', err);
    } finally {
      setLoading(false);
    }
  };
  cargarFacturas();
}, []);

  const facturasFiltradas = useMemo(() => {
    return facturas.filter(f => {
      if (!mesSeleccionado) return true;
      return f.fechaCreacion?.slice(0, 7) === mesSeleccionado;
    });
  }, [facturas, mesSeleccionado]);

  const indexInicio = (pagina - 1) * facturasPorPagina;
  const indexFin = indexInicio + facturasPorPagina;
  const facturasPaginadas = facturasFiltradas.slice(indexInicio, indexFin);

  const totales = facturasFiltradas.reduce(
    (acc, f) => {
      const neto = f.productos?.reduce(
        (sum, p) => sum + (Number(p.cantidad) || 0) * (Number(p.precioUnitario) || 0),
        0
      ) || 0;
      const iva = Math.round(neto * 0.19);
      acc.neto += neto;
      acc.iva += iva;
      acc.total += neto + iva;
      return acc;
    },
    { neto: 0, iva: 0, total: 0 }
  );

  const totalPaginas = Math.ceil(facturasFiltradas.length / facturasPorPagina);

  const formatearFecha = (fecha: string) => {
    if (!fecha) return '';
    const d = new Date(fecha);
    return `${d.getDate().toString().padStart(2,'0')}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getFullYear()}`;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-semibold mb-6">Facturas</h2>

      {/* Filtro por mes */}
      <div className="mb-4 flex items-center gap-2">
        <label className="font-medium">Filtrar por mes:</label>
        <input
          type="month"
          value={mesSeleccionado}
          onChange={e => { setMesSeleccionado(e.target.value); setPagina(1); }}
          className="border rounded px-3 py-1"
        />
      </div>

      {/* Tabla de facturas */}
      <div className="shadow-md rounded-lg overflow-x-auto bg-white">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-100 border-b border-gray-300">
            <tr>
              <th className="p-3 font-medium text-gray-700 uppercase text-sm">Empresa</th>
              <th className="p-3 font-medium text-gray-700 uppercase text-sm">RUT</th>
              <th className="p-3 font-medium text-gray-700 uppercase text-sm">Fecha</th>
              <th className="p-3 font-medium text-gray-700 uppercase text-sm">Documento</th>
              <th className="p-3 font-medium text-gray-700 uppercase text-sm">Neto</th>
              <th className="p-3 font-medium text-gray-700 uppercase text-sm">IVA</th>
              <th className="p-3 font-medium text-gray-700 uppercase text-sm">Total</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="p-4 text-center">Cargando...</td>
              </tr>
            ) : facturasPaginadas.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-4 text-center text-gray-500">No hay facturas</td>
              </tr>
            ) : (
              facturasPaginadas.map(f => {
                const neto = f.productos?.reduce(
                  (sum, p) => sum + (Number(p.cantidad) || 0) * (Number(p.precioUnitario) || 0),
                  0
                ) || 0;
                const iva = Math.round(neto * 0.19);
                const total = neto + iva;
                return (
                  <tr key={f._id} className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer">
                    <td className="p-3">{f.empresa}</td>
                    <td className="p-3 text-blue-600 underline" onClick={() => setSelectedFactura(f)}>{f.rut}</td>
                    <td className="p-3">{formatearFecha(f.fechaCreacion)}</td>
                    <td className="p-3">{f.numeroDocumento} ({f.tipoDocumento})</td>
                    <td className="p-3 font-semibold">${neto.toLocaleString('es-CL')}</td>
                    <td className="p-3 font-semibold">${iva.toLocaleString('es-CL')}</td>
                    <td className="p-3 font-bold">${total.toLocaleString('es-CL')}</td>
                  </tr>
                );
              })
            )}
          </tbody>
          <tfoot className="bg-gray-100">
            <tr>
              <td colSpan={4} className="p-3 text-right font-bold">Totales:</td>
              <td className="p-3 font-bold">${totales.neto.toLocaleString('es-CL')}</td>
              <td className="p-3 font-bold">${totales.iva.toLocaleString('es-CL')}</td>
              <td className="p-3 font-bold">${totales.total.toLocaleString('es-CL')}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex justify-center items-center gap-4 mt-4">
        <button
          disabled={pagina === 1}
          onClick={() => setPagina(pagina - 1)}
          className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
        >
          Anterior
        </button>
        <span className="font-medium">Página {pagina} de {totalPaginas || 1}</span>
        <button
          disabled={pagina === totalPaginas || totalPaginas === 0}
          onClick={() => setPagina(pagina + 1)}
          className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>

      {/* Modal de detalle de factura */}
      {selectedFactura && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-2xl p-6 relative">
            <h3 className="text-2xl font-semibold mb-4">Detalle de Factura: {selectedFactura.numeroDocumento}</h3>
            <button
              onClick={() => setSelectedFactura(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 font-bold"
            >
              X
            </button>
            <p><b>Empresa:</b> {selectedFactura.empresa}</p>
            <p><b>RUT:</b> {selectedFactura.rut}</p>
            <p><b>Tipo:</b> {selectedFactura.tipoDocumento}</p>
            <p><b>Dirección:</b> {selectedFactura.direccion}</p>
            <p><b>Rol / OC:</b> {selectedFactura.rol}</p>
            <p><b>Fecha:</b> {formatearFecha(selectedFactura.fechaCreacion)}</p>

            <h4 className="mt-4 font-semibold">Productos:</h4>
            <ul className="list-disc pl-5">
              {selectedFactura.productos?.map((p, i) => (
                <li key={i}>{p.nombre} - Cantidad: {p.cantidad} - Precio Unitario: ${p.precioUnitario?.toLocaleString('es-CL')}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
