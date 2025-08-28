import { useEffect, useState, useRef, useMemo } from 'react';
import api from '../api/api';
import type { Item } from '../types/Item';
import Fuse from 'fuse.js';

interface ResultadoConstrumart {
  nombre: string;
  precio: number;
  link: string;
}

export default function InventarioVista() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'nombre' | 'cantidad' | 'precio'>('nombre');
  const [ascending, setAscending] = useState(true);

  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const limit = 20;

  const [preciosCM, setPreciosCM] = useState<Record<string, ResultadoConstrumart[]>>({});
  const [cargandoCM, setCargandoCM] = useState<Record<string, boolean>>({});

  const loaderRef = useRef<HTMLDivElement>(null);

  // Función para traer items del backend
  const fetchItems = async (reset = false) => {
    if (page > pages) return;

    setLoading(true);
    try {
      const res = await api.get('/items', {
        params: { search: '', page, limit } // search backend vacío, filtro con Fuse
      });

      const nuevosItems = Array.isArray(res.data.items) ? res.data.items : [];
      setItems(prev => reset ? nuevosItems : [...prev, ...nuevosItems]);
      setPages(res.data.pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch inicial o cuando cambia search
  useEffect(() => {
    setPage(1);
    fetchItems(true); // resetear items
  }, [search]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !loading && page < pages) {
          setPage(prev => prev + 1);
        }
      },
      { root: null, rootMargin: '100px', threshold: 0.1 }
    );

    if (loaderRef.current) observer.observe(loaderRef.current);

    return () => {
      if (loaderRef.current) observer.unobserve(loaderRef.current);
    };
  }, [loaderRef, loading, page, pages]);

  // Traer nueva página
  useEffect(() => {
    if (page > 1) fetchItems();
  }, [page]);

  const handleSort = (field: 'nombre' | 'cantidad' | 'precio') => {
    if (sortBy === field) setAscending(!ascending);
    else { setSortBy(field); setAscending(true); }
  };

  const primeraPalabra = (texto: string) => texto.split(' ')[0].toLowerCase();

  // Fuse memoizado
  const fuse = useMemo(() => {
    return new Fuse(Array.isArray(items) ? items : [], { keys: ['nombre'], threshold: 0.4 });
  }, [items]);

  // Filtrado + orden
  const filteredItems = useMemo(() => {
    let result = Array.isArray(items) ? items : [];

    if (search.trim() !== '') {
      result = fuse.search(search).map(r => r.item);
    }

    result = [...result].sort((a, b) => {
      const valA = a[sortBy];
      const valB = b[sortBy];
      if (typeof valA === 'number' && typeof valB === 'number') return ascending ? valA - valB : valB - valA;
      if (typeof valA === 'string' && typeof valB === 'string') return ascending ? valA.localeCompare(valB) : valB.localeCompare(valA);
      return 0;
    });

    return result;
  }, [items, search, sortBy, ascending, fuse]);

  // Scraping Construmart intacto
  const matchProductos = (nombreLocal: string, productosCM: ResultadoConstrumart[]) => {
    const fuseCM = new Fuse(productosCM, { keys: ['nombre'], threshold: 0.4 });
    const resultados = fuseCM.search(nombreLocal).map(r => r.item);
    return resultados.slice(0, 3);
  };

  const compararPrecioConstrumart = async (item: Item) => {
    setCargandoCM(prev => ({ ...prev, [item._id]: true }));
    try {
      const nombreBuscar = primeraPalabra(item.nombre);
      const res = await api.get(`/comparar-precios/${encodeURIComponent(nombreBuscar)}`);
      const productosCM: ResultadoConstrumart[] = res.data.productos;
      const filtrados = matchProductos(nombreBuscar, productosCM);
      setPreciosCM(prev => ({ ...prev, [item._id]: filtrados }));
    } catch (err) {
      console.error(err);
      alert('Error al obtener precios de Construmart');
    }
    setCargandoCM(prev => ({ ...prev, [item._id]: false }));
  };

  const formatPrice = (num: number) => `$${num.toLocaleString('es-CL')}`;

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

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300 shadow-md rounded-lg">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="py-3 px-4 text-left cursor-pointer" onClick={() => handleSort('nombre')}>Código</th>
              <th className="py-3 px-4 text-left">Detalle Producto</th>
              <th className="py-3 px-4 text-center cursor-pointer" onClick={() => handleSort('cantidad')}>Stock</th>
              <th className="py-3 px-4 text-center">Reservados</th>
              <th className="py-3 px-4 text-center">Disponibles</th>
              <th className="py-3 px-4 text-center cursor-pointer" onClick={() => handleSort('precio')}>Precio Local</th>
              <th className="py-3 px-4 text-center">Acción</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map(item => {
              const totalComprometidos = item.comprometidos?.reduce((acc, c) => acc + c.cantidad, 0) || 0;
              const precioLocal = Number(item.precio);
              const resultados = preciosCM[item._id];

              return (
                <>
                  <tr key={item._id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-4">{item.codigo}</td>
                    <td className="py-3 px-4">{item.nombre}</td>
                    <td className="py-3 px-4 text-center">{item.cantidad}</td>
                    <td className="py-3 px-4 text-center">
                      {totalComprometidos > 0 ? <span className="text-red-600 font-semibold">{totalComprometidos}</span> : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="py-3 px-4 text-center">{item.cantidad - totalComprometidos}</td>
                    <td className="py-3 px-4 text-center">{formatPrice(precioLocal)}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => compararPrecioConstrumart(item)}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-2 rounded"
                      >
                        {cargandoCM[item._id] ? 'Buscando...' : 'Comparar'}
                      </button>
                    </td>
                  </tr>

                  {resultados && resultados.length > 0 && (
                    <tr key={item._id + '-cm'}>
                      <td colSpan={7} className="bg-gray-50 p-2">
                        <strong>Precios Construmart (Top 3):</strong>
                        <ul className="mt-1 space-y-1">
                          {resultados.map((r, i) => {
                            const esMasBarato = r.precio < precioLocal;
                            const diferencia = precioLocal - r.precio;
                            return (
                              <li key={i} className="flex justify-between items-center">
                                <a href={r.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                                  {r.nombre}
                                </a>
                                <span className={`${esMasBarato ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}`}>
                                  {formatPrice(r.precio)} {esMasBarato
                                    ? ` 🔻 Más barato en CM (ahorras ${formatPrice(Math.abs(diferencia))})`
                                    : ` ✅ Tu precio es mejor (ahorras ${formatPrice(Math.abs(diferencia))})`}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}

            {filteredItems.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="text-center py-6 text-gray-500">
                  No se encontraron productos, agrégalos con facturas de compra.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div ref={loaderRef} className="py-4 text-center">
          {loading && <span className="text-gray-600">Cargando más productos...</span>}
          {!loading && page >= pages && <span className="text-gray-400">No hay más productos</span>}
        </div>
      </div>
    </div>
  );
}
