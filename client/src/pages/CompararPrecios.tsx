import { useState } from 'react';
import api from '../api/api';

interface CompararPreciosProps {
  nombreProducto: string;
  precioLocal: number;
}

interface ResultadoConstrumart {
  nombre: string;
  precio: string;
  url: string;
}

export default function CompararPrecios({ nombreProducto, precioLocal }: CompararPreciosProps) {
  const [resultados, setResultados] = useState<ResultadoConstrumart[] | null>(null);
  const [cargando, setCargando] = useState(false);

  const buscarPrecios = async () => {
    setCargando(true);
    try {
      const res = await api.get(`/comparar-precios/${encodeURIComponent(nombreProducto)}`);
      setResultados(res.data);
    } catch (err) {
      console.error(err);
      alert('Error al obtener precios de Construmart');
    }
    setCargando(false);
  };

  const parsearPrecio = (str: string) => {
    return Number(str.replace(/[^0-9]/g, '')) || 0;
  };

  return (
    <div className="mt-2">
      <button
        onClick={buscarPrecios}
        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-2 rounded"
      >
        {cargando ? 'Buscando...' : 'Comparar precios'}
      </button>

      {resultados && resultados.length > 0 && (
        <div className="mt-2 p-2 border rounded bg-gray-50">
          <strong>Precios Construmart:</strong>
          <ul className="mt-1 space-y-1">
            {resultados.map((r, i) => {
              const precioCM = parsearPrecio(r.precio);
              const ahorro = precioLocal < precioCM;
              return (
                <li key={i} className="flex justify-between items-center">
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                    {r.nombre}
                  </a>
                  <span className={`${ahorro ? 'text-green-600 font-bold' : ''}`}>
                    {r.precio} {ahorro ? '✅ Más barato!' : ''}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
