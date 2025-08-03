// src/pages/Facturas.tsx
import { useEffect, useState } from 'react';
import api from '../api/api';

type Producto = {
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  iva: number;
};

type Factura = {
  _id: string;
  nombreEmpresa: string;
  rut: string;
  rol: string;
  direccion: string;
  fechaCompra: string;
  productos: Producto[];
};

export default function Facturas() {
  const [facturas, setFacturas] = useState<Factura[]>([]);

  useEffect(() => {
    api.get('/facturas')
      .then(res => setFacturas(res.data))
      .catch(err => console.error('Error al obtener facturas', err));
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Facturas Ingresadas</h2>
      {facturas.length === 0 ? (
        <p>No hay facturas registradas.</p>
      ) : (
        facturas.map(factura => (
          <div key={factura._id} style={{ border: '1px solid #ccc', padding: 15, marginBottom: 20 }}>
            <h3>{factura.nombreEmpresa} - {factura.rut}</h3>
            <p><strong>Rol:</strong> {factura.rol}</p>
            <p><strong>Dirección:</strong> {factura.direccion}</p>
            <p><strong>Fecha de compra:</strong> {new Date(factura.fechaCompra).toLocaleDateString()}</p>
            <h4>Productos:</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ borderBottom: '1px solid #ccc' }}>Nombre</th>
                  <th style={{ borderBottom: '1px solid #ccc' }}>Cantidad</th>
                  <th style={{ borderBottom: '1px solid #ccc' }}>Precio Unitario</th>
                  <th style={{ borderBottom: '1px solid #ccc' }}>IVA</th>
                </tr>
              </thead>
              <tbody>
                {factura.productos.map((producto, i) => (
                  <tr key={i}>
                    <td>{producto.nombre}</td>
                    <td>{producto.cantidad}</td>
                    <td>${producto.precioUnitario.toFixed(2)}</td>
                    <td>{producto.iva}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
}
