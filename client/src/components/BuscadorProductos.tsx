import { useEffect, useState } from 'react';
import api from '../api/api';
import type { Item } from '../types/Item';

interface Props {
  busqueda: string;
  setBusqueda: (val: string) => void;
  onAgregar: (item: Item) => void;
}

export default function BuscadorProductos({ busqueda, setBusqueda, onAgregar }: Props) {
  const [resultados, setResultados] = useState<Item[]>([]);
  const [cargando, setCargando] = useState(false);
  const [consultado, setConsultado] = useState(false);

  useEffect(() => {
    const termino = busqueda.trim();
    if (!termino) {
      setResultados([]);
      setConsultado(false);
      return;
    }

    setCargando(true);

    const delay = setTimeout(async () => {
      try {
        const res = await api.get(`/items/buscar?q=${encodeURIComponent(termino)}`);
        setResultados(Array.isArray(res.data) ? res.data : []);
        setConsultado(true);
      } catch (err) {
        console.error('Error al buscar productos:', err);
        setResultados([]);
        setConsultado(true);
      } finally {
        setCargando(false);
      }
    }, 300); // debounce

    return () => clearTimeout(delay);
  }, [busqueda]);

  return (
    <div className="relative w-full">
      <input
        type="text"
        placeholder="🔍 Buscar por nombre o código"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        aria-label="Buscar por nombre o código"
      />

      {busqueda && (
        <ul className="absolute z-50 bg-white mt-1 border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto w-full">
          {cargando ? (
            <li className="px-4 py-2 text-gray-500 italic">Buscando...</li>
          ) : resultados.length > 0 ? (
            resultados.map((item) => (
              <li
                key={item._id}
                className={`px-4 py-2 hover:bg-blue-100 cursor-pointer rounded-md transition-all ${
                  item.cantidad === 0 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-800'
                }`}
                onClick={() => {
                  if (item.cantidad === 0) return;
                  onAgregar(item);
                  setBusqueda('');
                }}
              >
                <div className="flex justify-between">
                  <span>
                    {item.nombre} {item.codigo ? `(SKU: ${item.codigo})` : ''}
                  </span>
                  <span className="font-semibold">
                    ${item.precio.toLocaleString('es-CL')} ({item.cantidad} disponible)
                  </span>
                </div>
              </li>
            ))
          ) : consultado ? (
            <li className="px-4 py-2 text-gray-500 italic">No se encontraron resultados</li>
          ) : null}
        </ul>
      )}
    </div>
  );
}
