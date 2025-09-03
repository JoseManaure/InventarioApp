import { useEffect, useState } from 'react';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';


interface Borrador {
  _id: string;
  cliente: string;
  fechaHoy: string;
  total: number;
}


export default function Borradores() {
  
  const [borradores, setBorradores] = useState<Borrador[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    api.get('/cotizaciones/borradores')
      .then(res => setBorradores(res.data))
      .catch(err => console.error('Error al obtener borradores', err));
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">📝 Borradores Guardados</h1>

      {borradores.length === 0 ? (
        <p className="text-gray-500">No hay borradores guardados.</p>
      ) : (
        <div className="bg-white shadow rounded border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">#</th>
                <th className="px-4 py-2 text-left">Cliente</th>
                <th className="px-4 py-2">Fecha</th>
                <th className="px-4 py-2">Total</th>
                <th className="px-4 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {borradores.map((borrador, i) => (
                <tr key={borrador._id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{i + 1}</td>
                  <td className="px-4 py-2">{borrador.cliente}</td>
                  <td className="px-4 py-2">{borrador.fechaHoy}</td>
                  <td className="px-4 py-2">${borrador.total?.toLocaleString('es-CL') || 0}</td>
                  <td className="px-4 py-2">
                    <button
                      className="text-blue-600 hover:underline"
                      onClick={() => navigate(`/cotizacion/${borrador._id}`)}
                    >
                      Continuar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
