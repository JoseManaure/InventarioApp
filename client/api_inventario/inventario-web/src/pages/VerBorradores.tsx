// src/pages/VerBorradores.tsx
import {
  User,
  MapPin,
  CalendarDays,
  CreditCard,
  DollarSign,
  FileText,
  Pencil,
  Trash2
} from 'lucide-react';

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

interface Borrador {
  _id: string;
  cliente: string;
  direccion: string;
  fechaHoy: string;
  fechaEntrega: string;
  metodoPago: string;
  tipo: 'cotizacion' | 'nota';
  productos?: {
    nombre: string;
    cantidad: number;
    precio: number;
    total: number;
  }[];
  total: number;
}

export default function VerBorradores() {
  const [borradores, setBorradores] = useState<Borrador[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await api.get('/cotizaciones/borrador');
        setBorradores(res.data);
      } catch (err) {
        console.error('Error al cargar borradores', err);
        alert('❌ Error al cargar borradores');
      }
    };
    cargar();
  }, []);

  const continuarBorrador = (borrador: Borrador) => {
    if (borrador._id) {
      navigate(`/borrador/${borrador._id}`);
    } else {
      alert('ID inválido. No se puede continuar con este borrador.');
    }
  };

  const eliminarBorrador = async (borrador: Borrador) => {
    if (!borrador._id) {
      alert('ID inválido. No se puede eliminar este borrador.');
      return;
    }
    const confirmar = window.confirm(`¿Eliminar borrador de ${borrador.cliente}? Esta acción no se puede deshacer.`);
    if (!confirmar) return;

    try {
      await api.delete(`/cotizaciones/${borrador._id}`);
      alert('Borrador eliminado');
      setBorradores(borradores.filter(b => b._id !== borrador._id));
    } catch (err) {
      console.error('Error al eliminar borrador', err);
      alert('❌ Error al eliminar borrador');
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Borradores</h2>

      <table className="w-full text-sm shadow-md rounded-lg overflow-hidden border border-gray-200">
        <thead>
          <tr>
            <th className="bg-green-100 text-left px-4 py-2">
              <div className="flex items-center gap-2"><User size={16} /> Cliente</div>
            </th>
            <th className="bg-blue-100 text-left px-4 py-2">
              <div className="flex items-center gap-2"><MapPin size={16} /> Dirección</div>
            </th>
            <th className="bg-yellow-100 text-left px-4 py-2">
              <div className="flex items-center gap-2"><CalendarDays size={16} /> Fecha Entrega</div>
            </th>
            <th className="bg-purple-100 text-left px-4 py-2">
              <div className="flex items-center gap-2"><CreditCard size={16} /> Pago</div>
            </th>
            <th className="bg-pink-100 text-left px-4 py-2">
              <div className="flex items-center gap-2"><DollarSign size={16} /> Total</div>
            </th>
            <th className="bg-gray-200 text-left px-4 py-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {borradores.map((borrador) => (
            <tr key={borrador._id} className="hover:bg-gray-50">
              <td className="bg-green-50 px-4 py-2">{borrador.cliente}</td>
              <td className="bg-blue-50 px-4 py-2">{borrador.direccion}</td>
              <td className="bg-yellow-50 px-4 py-2">{borrador.fechaEntrega}</td>
              <td className="bg-purple-50 px-4 py-2">{borrador.metodoPago}</td>
              <td className="bg-pink-50 px-4 py-2">${borrador.total?.toLocaleString('es-CL') || '0'}</td>
              <td className="bg-gray-50 px-4 py-2 flex gap-2">
                <button
                  onClick={() => continuarBorrador(borrador)}
                  className="flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                  title="Continuar edición"
                >
                  <Pencil size={16} /> Continuar
                </button>
                <button
                  onClick={() => eliminarBorrador(borrador)}
                  className="flex items-center gap-1 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                  title="Eliminar borrador"
                >
                  <Trash2 size={16} /> Eliminar
                </button>
              </td>
            </tr>
          ))}
          {borradores.length === 0 && (
            <tr>
              <td colSpan={6} className="text-center py-6 text-gray-500">
                No hay borradores guardados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
