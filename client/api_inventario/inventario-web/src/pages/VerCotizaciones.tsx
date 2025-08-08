// src/pages/VerCotizaciones.tsx
import {
  User,
  MapPin,
  CalendarDays,
  CreditCard,
  DollarSign,
  FileText,
  Pencil
} from 'lucide-react';

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { generarGuiaPDF } from '../utils/pdf';

interface Cotizacion {
  total: number;
  _id: string;
  cliente: string;
  direccion: string;
  fechaHoy: string;
  fechaEntrega: string;
  metodoPago: string;
  tipo: 'cotizacion' | 'nota';
  pdfUrl?: string;
  numero?: number;
  rutCliente?:number;
  giroCliente?:string;
  emailCliente?:string;


  productos?: {
    nombre: string;
    cantidad: number;
    precio: number;
    total: number;
  }[];
  yaConvertida?: boolean; // ← NUEVO
}

export default function VerCotizaciones() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await api.get('/cotizaciones');
        const soloCotizaciones = res.data
          .filter((c: Cotizacion) => c.tipo === 'cotizacion');
        setCotizaciones(soloCotizaciones);
      } catch (err) {
        console.error('Error al cargar cotizaciones', err);
      }
    };

    cargar();
  }, []);

  const convertirCotizacion = async (cotizacion: Cotizacion) => {
    try {
      const confirmar = window.confirm('¿Convertir esta cotización en nota de venta?');
      if (!confirmar) return;

      const res = await api.post(`/cotizaciones/${cotizacion._id}/convertir-a-nota`);
      const nuevaNota = res.data;

      const pdfBlob = generarGuiaPDF(nuevaNota.cliente, nuevaNota.productos, {
        tipo: 'nota',
        direccion: nuevaNota.direccion,
        fechaEntrega: nuevaNota.fechaEntrega,
        metodoPago: nuevaNota.metodoPago,
        tipoDocumento: 'nota',
        numeroDocumento: nuevaNota.numeroDocumento,
        cotizacionBaseNumero: cotizacion.numero,
        rutCliente: nuevaNota.rutCliente,
        giroCliente: nuevaNota.giroCliente,
        direccionCliente: nuevaNota.direccionCliente,
        comunaCliente: nuevaNota.comunaCliente,
        ciudadCliente: nuevaNota.ciudadCliente,
        atencion: nuevaNota.atencion,
        emailCliente: nuevaNota.emailCliente,
        telefonoCliente: nuevaNota.telefonoCliente,
      });

      const formData = new FormData();
      const file = new File([pdfBlob], `nota-${nuevaNota.numeroDocumento}.pdf`, { type: 'application/pdf' });
      formData.append('file', file);
      formData.append('cotizacionId', nuevaNota._id);

      await api.post('/cotizaciones/upload-pdf', formData);

      alert('✅ Convertido a nota de venta y PDF subido exitosamente');
      navigate('/notas');
    } catch (error) {
      console.error('❌ Error al generar o subir el PDF:', error);
      alert('Error al convertir cotización');
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Cotizaciones Generadas</h2>

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
      <th className="bg-gray-200 text-left px-4 py-2">
        <div className="flex items-center gap-2"><FileText size={16} /> Acciones</div>
      </th>
    </tr>
  </thead>
  <tbody>
    {cotizaciones.map((cot) => (
      <tr key={cot._id} className="hover:bg-gray-50">
        <td className="bg-green-50 px-4 py-2">{cot.cliente}</td>
        <td className="bg-blue-50 px-4 py-2">{cot.direccion}</td>
        <td className="bg-yellow-50 px-4 py-2">{cot.fechaEntrega}</td>
        <td className="bg-purple-50 px-4 py-2">{cot.metodoPago}</td>
        <td className="bg-pink-50 px-4 py-2">${cot.total?.toLocaleString('es-CL') || '0'}</td>
        <td className="bg-gray-50 px-4 py-2 space-y-1">
          {cot.pdfUrl && (
            <a
              href={`http://localhost:3000${cot.pdfUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline flex items-center gap-1"
            >
              <FileText size={14} /> PDF
            </a>
          )}

          <button
            onClick={() => convertirCotizacion(cot)}
            disabled={cot.yaConvertida}
            className={`w-full px-3 py-1 text-sm text-white rounded flex items-center justify-center gap-1 ${
              cot.yaConvertida ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <FileText size={14} />
            {cot.yaConvertida ? 'Ya convertida' : 'Convertir a Nota'}
          </button>

          <button
            onClick={() => navigate(`/cotizaciones/${cot._id}`)}
            className="w-full px-3 py-1 text-sm text-white bg-green-600 hover:bg-green-700 rounded flex items-center justify-center gap-1"
          >
            <Pencil size={14} /> Editar
          </button>
        </td>
      </tr>
    ))}
  </tbody>
</table>



    </div>
  );
}
