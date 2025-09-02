import { useEffect, useState } from 'react';
import api from '../api/api';

type Factura = {
  _id: string;
  empresa: string;
  rut: string;
  direccion: string;
  tipo: 'compra' | 'venta';
  productos: {
    nombre: string;
    cantidad: number;
    precio: number;
    iva: number;
  }[];
  fecha: string;
  total: number;
};

export default function VerFacturas() {
  const [facturas, setFacturas] = useState<Factura[]>([]);

  useEffect(() => {
    api.get('/facturas').then(res => setFacturas(res.data)).catch(err => {
      console.error('Error al cargar facturas', err);
    });
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Facturas Registradas</h2>

      <div className="overflow-x-auto">
        <table className="w-full table-auto border-collapse rounded-lg shadow-md">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="p-2 text-left">Empresa</th>
              <th className="p-2 text-left">RUT</th>
              <th className="p-2 text-left">Dirección</th>
              <th className="p-2 text-left">Tipo</th>
              <th className="p-2 text-left">Fecha</th>
              <th className="p-2 text-left">Productos</th>
              <th className="p-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y">
            {facturas.map(f => (
              <tr key={f._id} className="hover:bg-gray-100">
                <td className="p-2">{f.empresa}</td>
                <td className="p-2">{f.rut}</td>
                <td className="p-2">{f.direccion}</td>
                <td className="p-2 capitalize">{f.tipo}</td>
                <td className="p-2">{new Date(f.fecha).toLocaleDateString()}</td>
                <td className="p-2">
                  <ul className="list-disc ml-5">
                    {f.productos.map((p, idx) => (
                      <li key={idx}>
                        {p.nombre} - {p.cantidad} x ${p.precio.toLocaleString('es-CL')}
                      </li>
                    ))}
                  </ul>
                </td>
                <td className="p-2 text-right font-semibold text-green-700">
                  ${f.total.toLocaleString('es-CL')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {facturas.length === 0 && (
          <p className="text-gray-500 mt-4">No hay facturas registradas.</p>
        )}
      </div>
    </div>
  );
}
