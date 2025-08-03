// src/pages/FacturaCompra.tsx
import { useState } from 'react';
import api from '../api/api';

export default function FacturaCompra() {
  const [empresa, setEmpresa] = useState('');
  const [rut, setRUT] = useState('');
  const [rol, setRol] = useState('');
  const [direccion, setDireccion] = useState('');
  const [productos, setProductos] = useState([{ nombre: '', cantidad: 0, precioUnitario: 0 }]);
const [numeroDocumento, setNumeroDocumento] = useState('');
const [tipoDocumento, setTipoDocumento] = useState<'factura' | 'boleta' | 'guia'>('factura');

  const agregarProducto = () => {
    setProductos([...productos, { nombre: '', cantidad: 0, precioUnitario: 0 }]);
  };

  const actualizarProducto = (index: number, field: string, value: string | number) => {
    const nuevos = [...productos];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (nuevos[index] as any)[field] = field === 'cantidad' || field === 'precioUnitario' ? parseFloat(value as string) : value;
    setProductos(nuevos);
  };

  const enviarFactura = async () => {
    try {
      await api.post('/facturas', {
        empresa,
        rut,
        rol,
        direccion,
        productos,
        numeroDocumento,  
        tipoDocumento      
      });
      alert('Factura registrada correctamente');
      setEmpresa('');
      setRUT('');
      setRol('');
      setDireccion('');
      setProductos([{ nombre: '', cantidad: 0, precioUnitario: 0 }]);
    } catch (error) {
      alert('Error al registrar factura');
      console.error(error);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Recepcion de Productos</h2>
      <input placeholder="Nombre de la empresa" value={empresa} onChange={e => setEmpresa(e.target.value)} /><br />
      <input placeholder="RUT" value={rut} onChange={e => setRUT(e.target.value)} /><br />
      <input placeholder="Orden de Compra" value={rol} onChange={e => setRol(e.target.value)} /><br />
      <input placeholder="Dirección" value={direccion} onChange={e => setDireccion(e.target.value)} /><br />
{/* Número de Documento */}
<div>
  <label className="block font-semibold">Número de Documento:</label>
  <input
    type="text"
    className="w-full border p-2 rounded mt-1"
    placeholder="Ej: 12345678"
    value={numeroDocumento}
    onChange={(e) => setNumeroDocumento(e.target.value)}
  />
</div>

{/* Tipo de Documento */}
<div className="mt-4">
  <label className="block font-semibold">Tipo de Documento:</label>
  <select
    className="w-full border p-2 rounded mt-1"
    value={tipoDocumento}
    onChange={(e) => setTipoDocumento(e.target.value as 'factura' | 'boleta' | 'guia')}
  >
    <option value="factura">Factura</option>
    <option value="boleta">Boleta</option>
    <option value="guia">Guía de despacho</option>
  </select>
</div>

      <h3>Productos:</h3>
      {productos.map((p, i) => (
        
        <div key={i} style={{ marginBottom: 10 }}>
          <input
            placeholder="Descripcion"
            value={p.nombre}
            onChange={e => actualizarProducto(i, 'nombre', e.target.value)}
          />
          <input
            type="number"
            placeholder="Cantidad"
            value={p.cantidad}
            onChange={e => actualizarProducto(i, 'cantidad', e.target.value)}
          />
          <input
            type="number"
            placeholder="Costo Producto"
            value={p.precioUnitario}
            onChange={e => actualizarProducto(i, 'precioUnitario', e.target.value)}
          />
        </div>
      ))}
      <button onClick={agregarProducto}>+ Agregar otro producto</button><br /><br />
      <button onClick={enviarFactura}>Guardar Factura</button>
    </div>
  );
}
