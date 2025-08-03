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
  cotizacionOriginalId?: string;
}

export default function NotasDeVenta() {
  const [notas, setNotas] = useState<NotaDeVenta[]>([]);

  useEffect(() => {
    api.get('/cotizaciones')
      .then(res => {
        const notasFiltradas = res.data.filter((c: NotaDeVenta) => c.tipo === 'nota');
        setNotas(notasFiltradas);
      })
      .catch(err => console.error('Error al cargar notas de venta', err));
  }, []);

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
             <th className="p-2 border">Accion</th>
          </tr>
        </thead>
        <tbody>
          {notas.map((nota) => (
            <tr key={nota._id}>
              <td>{nota.cliente}</td>
              <td>{nota.fechaEntrega}</td>
              <td>{nota.metodoPago}</td>
              <td>${nota.total?.toLocaleString() || '0'}</td>
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
             
          <td><a href={`/cotizaciones/${nota.cotizacionOriginalId}`}>Editar</a></td>
                      </tr>
          ))}

          {notas.length === 0 && (
            <tr>
              <td colSpan={5} className="text-center p-4 text-gray-500">
                No hay notas de venta registradas.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
