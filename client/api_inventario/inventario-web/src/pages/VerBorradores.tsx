import { useEffect, useState } from 'react';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';

export default function VerBorradores() {
  const [borradores, setBorradores] = useState([]);
  const navigate = useNavigate();

  const cargarBorradores = () => {
    api.get('/cotizaciones/borradores')
      .then(res => setBorradores(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    cargarBorradores();
  }, []);

  const eliminarBorrador = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este borrador?')) return;
    try {
      await api.delete(`/cotizaciones/${id}`);
      cargarBorradores(); // recargar la lista
    } catch (err) {
      console.error('Error al eliminar borrador', err);
      alert('Error al eliminar borrador');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Borradores guardados</h2>
      <table className="w-full border shadow text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Cliente</th>
            <th className="p-2 text-left">Entrega</th>
            <th className="p-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {borradores.map(b => (
            <tr key={b._id} className="border-t">
              <td className="p-2">{b.cliente}</td>
              <td className="p-2">{b.fechaEntrega}</td>
              <td className="p-2 text-center space-x-2">
                <button
                  className="text-blue-600 hover:underline"
                  onClick={() => navigate(`/cotizacion/${b._id}`)}
                >
                  Editar
                </button>
                <button
                  className="text-red-600 hover:underline"
                  onClick={() => eliminarBorrador(b._id)}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
