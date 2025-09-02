import { useEffect, useState } from 'react';
import api from '../api/api';
import type { Item } from '../types/Item';
import './ItemList.css';

export default function ItemList() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await api.get('/items');
        setItems(res.data);
      } catch (err) {
        console.error('Error al obtener items:', err);
      }
    };
    fetchItems();
  }, []);

  return (
    <div className="item-list-container">
      <h2 className="title">📦 Inventario disponible</h2>
      <table className="item-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Cantidad</th>
            <th>Fecha</th>
            <th>Usuario</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item._id}>
              <td>{item.nombre}</td>
              <td>{item.cantidad}</td>
              <td>{new Date(item.fecha).toLocaleDateString()}</td>
              <td>{item.modificadoPor?.name || 'Desconocido'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
