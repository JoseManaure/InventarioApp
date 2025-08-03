import { useEffect, useState } from 'react';
import api from '../api/api';
import type { Item } from '../types/Item';

export default function InventarioVista() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'nombre' | 'cantidad' | 'precio'>('nombre');
  const [ascending, setAscending] = useState(true);

  useEffect(() => {
    api.get('/items')
      .then(res => setItems(res.data))
      .catch(err => console.error('Error al cargar inventario:', err))
      .finally(() => setLoading(false));
  }, []);

  const filteredItems = items
    .filter(item => item.nombre.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const valA = a[sortBy];
      const valB = b[sortBy];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return ascending ? valA - valB : valB - valA;
      }
      if (typeof valA === 'string' && typeof valB === 'string') {
        return ascending ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return 0;
    });

  const handleSort = (field: 'nombre' | 'cantidad' | 'precio' ) => {
    if (sortBy === field) {
      setAscending(!ascending);
    } else {
      setSortBy(field);
      setAscending(true);
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Productos Actuales</h2>

      <div className="mb-4 flex items-center gap-4">
        <input
          type="text"
          placeholder="Buscar producto..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border rounded p-2 w-full max-w-md"
        />
      </div>

      {loading ? (
        <p className="text-gray-600">Cargando productos...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300 shadow-md rounded-lg">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="py-3 px-4 text-left cursor-pointer" onClick={() => handleSort('nombre')}>Codigo</th>
                <th className="py-3 px-4 text-left cursor-pointer" >Detalle Producto</th>
                <th className="py-3 px-4 text-center cursor-pointer" onClick={() => handleSort('cantidad')}>Stock</th>
                <th className="py-3 px-4 text-center">Reservados</th>
                <th className="py-3 px-4 text-center">Disponibles</th>
                <th className="py-3 px-4 text-center cursor-pointer" onClick={() => handleSort('precio')}>Precio</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => {
                const totalComprometidos = item.comprometidos?.reduce(
                  (acc, c) => acc + c.cantidad,
                  0
                ) || 0;

                return (
                  <tr
                    key={item._id}
                    className="border-t border-gray-200 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4">{item.codigo}</td>
                    <td className="py-3 px-4">{item.nombre}</td>
                    <td className="py-3 px-4 text-center">{item.cantidad}</td>
                   
                    <td className="py-3 px-4 text-center">
                      {totalComprometidos > 0 ? (
                        <span className="text-red-600 font-semibold">
                          {totalComprometidos}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {item.cantidad - totalComprometidos}
                    </td>

                     <td className="py-3 px-4 text-center">
                      ${Number(item.precio).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-gray-500">
                    No se encontraron productos, agregalos con facturas de compra.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
