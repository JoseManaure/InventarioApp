/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/VistaCotizacion.tsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/api';

export default function VistaCotizacion() {
  const { id } = useParams();
  const [cotizacion, setCotizacion] = useState<any>(null);

  useEffect(() => {
    if (id) {
      api.get(`/cotizaciones/${id}`)
        .then(res => setCotizacion(res.data))
        .catch(err => {
          console.error('❌ Error al cargar cotización', err);
          alert('No se pudo cargar la cotización');
        });
    }
  }, [id]);

  if (!cotizacion) return <div className="p-4">Cargando cotización...</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Cotización #{cotizacion.numero}</h2>
      <p><strong>Cliente:</strong> {cotizacion.cliente}</p>
      <p><strong>Dirección:</strong> {cotizacion.direccion}</p>
      <p><strong>Método de pago:</strong> {cotizacion.metodoPago}</p>
      <p><strong>Fecha entrega:</strong> {cotizacion.fechaEntrega}</p>

      <h3 className="mt-6 mb-2 font-semibold">Productos</h3>
      <table className="w-full border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Nombre</th>
            <th className="border p-2">Cantidad</th>
            <th className="border p-2">Precio</th>
            <th className="border p-2">Total</th>
          </tr>
        </thead>
        <tbody>
          {cotizacion.productos.map((p: any, index: number) => (
            <tr key={index}>
              <td className="border p-2">{p.nombre}</td>
              <td className="border p-2">{p.cantidad}</td>
              <td className="border p-2">${p.precio}</td>
              <td className="border p-2">${p.total}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 font-bold text-right">
        Total: ${cotizacion.total?.toLocaleString()}
      </div>
    </div>
  );
}
