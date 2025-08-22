import { useState } from "react";
import api from "../api/api"; // 👈 tu cliente axios

type Producto = {
  nombre: string;
  precio: string;
  precioNumero: number;
  url: string;
};

export default function Productos() {
  const [busqueda, setBusqueda] = useState("");
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBuscar = async () => {
    if (!busqueda.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await api.get(`/comparar-precios/${encodeURIComponent(busqueda)}`);
      setProductos(res.data.productos || []);
    } catch (err) {
      console.error(err);
      setError("Error al obtener precios");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Comparador de Precios</h1>

      {/* Input de búsqueda */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar producto (ej: cemento)"
          className="border rounded-lg px-3 py-2 w-80"
        />
        <button
          onClick={handleBuscar}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          disabled={loading}
        >
          {loading ? "Buscando..." : "Buscar"}
        </button>
      </div>

      {/* Errores */}
      {error && <p className="text-red-600">{error}</p>}

      {/* Tabla de resultados */}
      {productos.length > 0 && (
        <table className="w-full border-collapse border border-gray-300 shadow">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 px-3 py-2 text-left">Nombre</th>
              <th className="border border-gray-300 px-3 py-2 text-left">Precio</th>
              <th className="border border-gray-300 px-3 py-2 text-left">Precio (número)</th>
              <th className="border border-gray-300 px-3 py-2 text-left">Link</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-3 py-2">{p.nombre}</td>
                <td className="border border-gray-300 px-3 py-2">{p.precio}</td>
                <td className="border border-gray-300 px-3 py-2">{p.precioNumero}</td>
                <td className="border border-gray-300 px-3 py-2">
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    Ver producto
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Si no hay resultados */}
      {!loading && !error && productos.length === 0 && (
        <p className="text-gray-600">No hay resultados todavía.</p>
      )}
    </div>
  );
}
