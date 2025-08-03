// src/pages/VerCotizaciones.tsx
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { generarGuiaPDF } from '../utils/pdf'; // Asegúrate que esta función esté importada correctamente

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
  productos?: {
    nombre: string;
    cantidad: number;
    precio: number;
    total: number;
  }[];
}

export default function VerCotizaciones() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const navigate = useNavigate(); // 👈 Inicializa navegador
  
  
  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await api.get('/cotizaciones');
        const soloCotizaciones = res.data.filter((c: Cotizacion) => c.tipo === 'cotizacion');
        setCotizaciones(soloCotizaciones);
      } catch (err) {
        console.error('Error al cargar cotizaciones', err);
      }
    };

    cargar();
  }, []);

 
const convertirCotizacion = async (cotizacion) => {
  try {
    const pdfBlob = generarGuiaPDF(cotizacion.cliente, cotizacion.productos, {
      tipo: 'nota',
      direccion: cotizacion.direccion,
      fechaEntrega: cotizacion.fechaEntrega,
      metodoPago: cotizacion.metodoPago,
      tipoDocumento: 'nota',
      rutCliente: cotizacion.rutCliente,
      numeroDocumento: cotizacion.numero,
      giroCliente: cotizacion.giroCliente,
      direccionCliente: cotizacion.direccionCliente,
      comunaCliente: cotizacion.comunaCliente,
      ciudadCliente: cotizacion.ciudadCliente,
      atencion: cotizacion.atencion,
      emailCliente: cotizacion.emailCliente,
      telefonoCliente: cotizacion.telefonoCliente,
    });

    const formData = new FormData();
    const file = new File([pdfBlob], `nota-${cotizacion.numero}.pdf`, { type: 'application/pdf' });
    formData.append('file', file);
    formData.append('cotizacionId', cotizacion._id);

    // ✅ Subir PDF
    await api.post('/cotizaciones/upload-pdf', formData);

    // ✅ Convertir a nota (con token en header)
   await api.post(`/cotizaciones/${cotizacion._id}/convertir-a-nota`);


    alert('Convertido a nota y PDF subido exitosamente');
    navigate('/notas');
  } catch (error) {
    console.error('Error al generar o subir el PDF:', error);
    alert('Error al convertir cotización');
  }
};

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Cotizaciones Generadas</h2>

      <table className="w-full border text-sm shadow-md rounded-lg overflow-hidden">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-2 px-4 border-b">Cliente</th>
            <th className="py-2 px-4 border-b">Dirección</th>
            <th className="py-2 px-4 border-b">Fecha Entrega</th>
            <th className="py-2 px-4 border-b">Pago</th>
            <th className="py-2 px-4 border-b">Total</th>
            <th className="py-2 px-4 border-b">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {cotizaciones.map((cot) => (
            <tr key={cot._id} className="hover:bg-gray-50">
              <td className="py-2 px-4">{cot.cliente}</td>
              <td className="py-2 px-4">{cot.direccion}</td>
              <td className="py-2 px-4">{cot.fechaEntrega}</td>
              <td className="py-2 px-4">{cot.metodoPago}</td>
              <td className="py-2 px-4">${cot.total?.toLocaleString('es-CL') || '0'}</td>
              <td className="py-2 px-4 space-y-1">
                {cot.pdfUrl && (
                  <div>
                    <a
                      href={`http://localhost:3000${cot.pdfUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 underline block"
                    >
                      Abrir PDF
                    </a>
                  </div>
                )}
                <button onClick={() => convertirCotizacion(cot)}>Convertir a Nota</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
