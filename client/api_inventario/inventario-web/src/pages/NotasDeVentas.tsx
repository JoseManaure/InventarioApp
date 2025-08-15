// src/pages/NotasDeVenta.tsx
import { useEffect, useState } from 'react';
import api from '../api/api';

interface Producto {
  nombre: string;
  cantidad: number;
  precio: number;
}

interface NotaDeVenta {
  _id: string;
  cliente: string;
  direccion: string;
  fechaEntrega: string;
  metodoPago: string;
  productos: Producto[];
  pdfUrl?: string;
  anulada?: string;
  cotizacionOriginalId?: string;
}

export default function NotasDeVenta() {
  const [notas, setNotas] = useState<NotaDeVenta[]>([]);

  useEffect(() => {
    cargarNotas();
  }, []);

  const cargarNotas = async () => {
    try {
      const res = await api.get('/cotizaciones');
      const notasFiltradas = res.data.filter((c: NotaDeVenta) => c.tipo === 'nota');
      setNotas(notasFiltradas);
    } catch (err) {
      console.error('Error al cargar notas de venta', err);
    }
  };

  const anularNota = async (id: string) => {
    const confirmar = window.confirm('¿Seguro que quieres anular esta nota?');
    if (!confirmar) return;

    try {
      await api.put(`/cotizaciones/${id}/anular`);
      alert('Nota anulada correctamente');
      cargarNotas();
    } catch (error) {
      console.error('Error al anular nota:', error);
      alert('Error al anular la nota');
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-semibold mb-6 text-gray-800">Notas de Venta</h2>
      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-100 border-b border-gray-300">
            <tr>
              <th className="p-3 text-gray-700 font-medium uppercase text-sm">Cliente</th>
              <th className="p-3 text-gray-700 font-medium uppercase text-sm">Dirección</th>
              <th className="p-3 text-gray-700 font-medium uppercase text-sm">Fecha Entrega</th>
              <th className="p-3 text-gray-700 font-medium uppercase text-sm">Método Pago</th>
              <th className="p-3 text-gray-700 font-medium uppercase text-sm">Neto</th>
              <th className="p-3 text-gray-700 font-medium uppercase text-sm">IVA</th>
              <th className="p-3 text-gray-700 font-medium uppercase text-sm">Total</th>
              <th className="p-3 text-gray-700 font-medium uppercase text-sm">PDF</th>
              <th className="p-3 text-gray-700 font-medium uppercase text-sm">Acción</th>
            </tr>
          </thead>
          <tbody>
            {notas.map((nota) => {
              // ✅ Recalcular totales usando el precio actual de los productos en estado local
              const neto = nota.productos?.reduce((acc, p) => {
                const cantidad = Number(p.cantidad) || 0;
                const precio = Number(p.precio) || 0;
                return acc + cantidad * precio;
              }, 0) || 0;
              const iva = Math.round(neto * 0.19);
              const total = neto + iva;

              return (
                <tr key={nota._id} className={`${nota.anulada ? 'bg-red-50' : 'bg-white'} border-b border-gray-200`}>
                  <td className="p-3 text-gray-800">{nota.cliente}</td>
                  <td className="p-3 text-gray-800">{nota.direccion}</td>
                  <td className="p-3 text-gray-800">{nota.fechaEntrega}</td>
                  <td className="p-3 text-gray-800">{nota.metodoPago}</td>
                  <td className={`p-3 font-semibold ${nota.anulada ? 'text-red-600' : 'text-gray-800'}`}>
                    ${neto.toLocaleString('es-CL')}
                  </td>
                  <td className={`p-3 font-semibold ${nota.anulada ? 'text-red-600' : 'text-gray-800'}`}>
                    ${iva.toLocaleString('es-CL')}
                  </td>
                  <td className={`p-3 font-bold ${nota.anulada ? 'text-red-600' : 'text-gray-900'}`}>
                    ${total.toLocaleString('es-CL')}
                  </td>
                  <td className="p-3">
                    {nota.pdfUrl ? (
                      <a
                        href={`http://localhost:3000${nota.pdfUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline hover:text-blue-800"
                      >
                        Abrir PDF
                      </a>
                    ) : (
                      <span className="text-gray-400 text-sm">No disponible</span>
                    )}
                  </td>
                  <td className="p-3">
                    {!nota.anulada ? (
                      <button
                        onClick={() => anularNota(nota._id)}
                        className="px-4 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                      >
                        Anular
                      </button>
                    ) : (
                      <span className="text-red-600 font-semibold">Anulada</span>
                    )}
                  </td>
                </tr>
              );
            })}

            {notas.length === 0 && (
              <tr>
                <td colSpan={9} className="p-4 text-center text-gray-500">
                  No hay notas de venta registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
