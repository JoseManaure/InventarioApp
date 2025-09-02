import { useEffect, useState } from 'react';
import api from '../api/api';

export default function QuoteForm() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [items, setItems] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [form, setForm] = useState({
    nombre: '',
    direccion: '',
    fechaEntrega: '',
    metodoPago: 'Transferencia',
  });

  useEffect(() => {
    api.get('/items').then(res => setItems(res.data));
  }, []);

  const addItem = (itemId: string, cantidad: number) => {
    setSelectedItems([...selectedItems, { item: itemId, cantidad }]);
  };

  const handleSubmit = async () => {
    const body = {
      cliente: {
        nombre: form.nombre,
        direccion: form.direccion
      },
      fechaPedido: new Date(),
      fechaEntrega: new Date(form.fechaEntrega),
      metodoPago: form.metodoPago,
      items: selectedItems
    };

    try {
      const res = await api.post('/quotes', body);
      alert('Cotización creada con éxito');
    } catch (error) {
      alert('Error al crear cotización');
    }
  };

  return (
    <div>
      <h2>Nueva Cotización</h2>
      <input placeholder="Nombre del cliente" onChange={e => setForm({ ...form, nombre: e.target.value })} />
      <input placeholder="Dirección" onChange={e => setForm({ ...form, direccion: e.target.value })} />
      <input type="date" onChange={e => setForm({ ...form, fechaEntrega: e.target.value })} />
      <select onChange={e => setForm({ ...form, metodoPago: e.target.value })}>
        <option value="Transferencia">Transferencia</option>
        <option value="Débito">Débito</option>
        <option value="Efectivo">Efectivo</option>
      </select>

      <h3>Seleccionar productos</h3>
      {items.map(item => (
        <div key={item._id}>
          {item.nombre} ({item.cantidad} disponibles)
          <input type="number" placeholder="Cantidad" min="1"
            onChange={e => addItem(item._id, parseInt(e.target.value))} />
        </div>
      ))}

      <button onClick={handleSubmit}>Crear Cotización</button>
    </div>
  );
}
