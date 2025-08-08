import React, { useEffect, useState } from 'react';
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
    const buscar = async () => {
      const termino = busqueda.trim();
      if (!termino) {
        setResultados([]);
        setConsultado(false);
        return;
      }

      setCargando(true);
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
    };

    const delay = setTimeout(buscar, 300); // debounce
    return () => clearTimeout(delay);
  }, [busqueda]);

  return (
    <div className="overflow-hidden min-w-0">
      <input
        type="text"
        placeholder="🔍 Buscar por nombre o código"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className=" px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        aria-label="Buscar por nombre o código"
      />

      {busqueda && (
  <ul className="absolute z-20 bg-white mt-1 border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-x-hidden overflow-y-auto space-y-2 px-2 py-2">
    {cargando ? (
      <li className="px-4 py-4 text-gray-500 italic">Buscando...</li>
    ) : resultados.length > 0 ? (
      resultados.map((i) => (
        <li
          key={i._id}
          className={`px-4 py-4 hover:bg-blue-100 cursor-pointer rounded-md transition-all ${
            i.cantidad === 0 ? 'text-gray-400' : 'text-gray-800'
          }`}
          onClick={() => {
            onAgregar(i);
            setBusqueda('');
          }}
        >
          <div className="flex justify-between">
            <span>
              {i.nombre} {i.codigo ? `(sku:${i.codigo})` : ''}
            </span>
            <span className="font-semibold">
              ${i.precio.toLocaleString('es-CL')} ({i.cantidad} disponible.)
            </span>
          </div>
        </li>
      ))
    ) : consultado ? (
      <li className="px-4 py-4 text-gray-500 italic">No se encontraron resultados</li>
    ) : null}
  </ul>
)}

    </div>
  );
}
