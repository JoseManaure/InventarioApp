import { useEffect, useState } from 'react';
import api from '../api/api';

interface Comparado {
  nombre: string;
  precio: number;
}

interface Comparacion {
  nombre: string;
  precioLocal: number;
  comparaciones?: Comparado[]; // Opcional por seguridad
}

export default function ComparadorPrecios() {
  const [datos, setDatos] = useState<Comparacion[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.get('/comparar-precios/todos')
      .then(res => setDatos(res.data))
      .catch(err => console.error('❌ Error:', err))
      .finally(() => setCargando(false));
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">📊 Comparador de Precios</h1>

      {cargando ? (
        <p className="text-gray-600">Cargando comparaciones...</p>
      ) : (
        <table className="w-full table-auto border border-gray-200 shadow-sm">
          <thead className="bg-gray-100 text-gray-700 text-sm">
            <tr>
              <th className="p-2 text-left">Producto</th>
              <th className="p-2 text-right">Precio Local</th>
              <th className="p-2 text-left">Producto Construmart</th>
              <th className="p-2 text-right">Precio Construmart</th>
              <th className="p-2 text-right">Diferencia</th>
            </tr>
          </thead>
          <tbody>
            {datos.map((item, idx) => {
              const comparaciones = Array.isArray(item.comparaciones) ? item.comparaciones : [];

              if (comparaciones.length === 0) {
                return (
                  <tr key={idx} className="border-t text-sm hover:bg-gray-50">
                    <td className="p-2">{item.nombre}</td>
                    <td className="p-2 text-right">${item.precioLocal.toLocaleString()}</td>
                    <td className="p-2 text-gray-500" colSpan={3}>No encontrado en Construmart</td>
                  </tr>
                );
              }

              return comparaciones.slice(0, 3).map((comparado, subIdx) => {
                const diferencia = item.precioLocal - comparado.precio;
                return (
                  <tr key={`${idx}-${subIdx}`} className="border-t text-sm hover:bg-gray-50">
                    {subIdx === 0 && (
                      <>
                        <td className="p-2" rowSpan={Math.min(3, comparaciones.length)}>{item.nombre}</td>
                        <td className="p-2 text-right" rowSpan={Math.min(3, comparaciones.length)}>${item.precioLocal.toLocaleString()}</td>
                      </>
                    )}
                    <td className="p-2">{comparado.nombre}</td>
                    <td className="p-2 text-right">${comparado.precio.toLocaleString()}</td>
                    <td className={`p-2 text-right font-semibold ${diferencia > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ${diferencia.toLocaleString()}
                    </td>
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
