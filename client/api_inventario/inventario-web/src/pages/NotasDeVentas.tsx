// src/pages/NotasDeVenta.tsx
import { useEffect, useState } from 'react';
import api from '../api/api';

interface Producto {
  nombre: string;
  cantidad: number;
  precio: number;
}

interface NotaDeVenta {
  total: number;
  tipo: string;
  _id: string;
  cliente: string;
  direccion: string;
  fechaEntrega: string;
  metodoPago: string;
  productos: Producto[];
  pdfUrl?: string;
  anulada?:string;
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
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Notas de Venta</h2>
      <table className="w-full border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Cliente</th>
            <th className="p-2 border">Fecha Entrega</th>
            <th className="p-2 border">Método Pago</th>
            <th className="p-2 border">Total</th>
            <th className="p-2 border">PDF</th>
            <th className="p-2 border">Acción</th>
          </tr>
        </thead>
        <tbody>
          {notas.map((nota) => (
            <tr key={nota._id} className={nota.anulada ? 'bg-red-100' : ''}>
              <td>{nota.cliente}</td>
              <td>{nota.fechaEntrega}</td>
              <td>{nota.metodoPago}</td>
              <td className={nota.anulada ? 'text-red-600 font-bold' : ''}>
                ${nota.total?.toLocaleString() || '0'}
              </td>
              <td>
                {nota.pdfUrl ? (
                  <a
                    href={`http://localhost:3000${nota.pdfUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 underline"
                  >
                    Abrir PDF
                  </a>
                ) : (
                  <span className="text-gray-500 text-sm">PDF no disponible</span>
                )}
              </td>
              <td>
                {!nota.anulada && (
                  <button
                    onClick={() => anularNota(nota._id)}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Anular
                  </button>
                )}
                {nota.anulada && (
                  <span className="text-red-600 font-semibold">Anulada</span>
                )}
              </td>
            </tr>
          ))}

          {notas.length === 0 && (
            <tr>
              <td colSpan={6} className="text-center p-4 text-gray-500">
                No hay notas de venta registradas.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
