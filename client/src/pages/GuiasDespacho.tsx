import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/api";
import { Plus, Trash2, FileText } from "lucide-react";

interface ProductoGuia {
  _id: string;
  itemId?: { _id: string; nombre: string }; // Puede ser undefined
  nombre: string;
  cantidad: number;
  precio: number;
  entregado?: number;
}

interface GuiaDespacho {
  _id: string;
  numero: number;
  fecha: string;
  estado: string;
  productos: ProductoGuia[];
  pdfPath?: string;
}

interface Nota {
  _id: string;
  productos: ProductoGuia[];
}

export default function GuiasDespacho() {
  const { notaId } = useParams<{ notaId: string }>();
  const [nota, setNota] = useState<Nota | null>(null);
  const [guias, setGuias] = useState<GuiaDespacho[]>([]);
  const [nuevaGuia, setNuevaGuia] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const cargarDatos = useCallback(async () => {
    if (!notaId) return;
    setLoading(true);
    try {
      const resNota = await api.get(`/cotizaciones/${notaId}`);
      const notaData: Nota = resNota.data;

      const resGuias = await api.get(`/guias/nota/${notaId}`);
      const guiasData: GuiaDespacho[] = resGuias.data || [];

      const productosConEntregado = (notaData.productos || []).map((p) => {
        const entregado = guiasData.reduce((acc, g) => {
          const prod = g.productos.find(
            (gp) => gp.itemId?._id === p.itemId?._id
          );
          return acc + (prod?.cantidad || 0);
        }, 0);
        return { ...p, entregado };
      });

      setNota({ _id: notaData._id, productos: productosConEntregado });
      setGuias(guiasData);
      setNuevaGuia({});
    } catch (err) {
      console.error("Error cargando nota o guías", err);
    } finally {
      setLoading(false);
    }
  }, [notaId]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const handleCantidadChange = (itemId: string, value: number) => {
    setNuevaGuia((prev) => ({ ...prev, [itemId]: value }));
  };

  const crearGuia = async () => {
    if (!nota) return;

    const productosAGuardar = nota.productos
      .filter((p) => (nuevaGuia[p.itemId?._id || p._id] || 0) > 0)
      .map((p) => {
        const key = p.itemId?._id || p._id;
        const maxDespachable = p.cantidad - (p.entregado || 0);
        const cantidad = Math.min(nuevaGuia[key] || 0, maxDespachable);
        return {
          itemId: key,
          nombre: p.nombre,
          cantidad,
          precio: p.precio,
        };
      });

    if (productosAGuardar.length === 0) {
      alert("Selecciona al menos un producto con cantidad válida");
      return;
    }

    try {
      const res = await api.post("/guias", {
        notaId,
        productos: productosAGuardar,
      });

      alert("✅ Guía creada correctamente");
      const nuevaGuiaCreada: GuiaDespacho = res.data;

      if (nota) {
        const productosActualizados = nota.productos.map((p) => {
          const key = p.itemId?._id || p._id;
          const entregadoEnEstaGuia =
            nuevaGuiaCreada.productos.find((np) => np.itemId?._id === key)
              ?.cantidad || 0;
          return { ...p, entregado: (p.entregado || 0) + entregadoEnEstaGuia };
        });
        setNota({ ...nota, productos: productosActualizados });
      }

      setGuias((prev) => [...prev, nuevaGuiaCreada]);
      setNuevaGuia({});
    } catch (err) {
      console.error("Error creando guía", err);
      alert("❌ Error al crear guía");
    }
  };

  const eliminarGuia = async (guiaId: string) => {
    if (!window.confirm("¿Seguro quieres eliminar esta guía?")) return;
    try {
      await api.delete(`/guias/${guiaId}`);
      alert("✅ Guía eliminada");
      cargarDatos();
    } catch (err) {
      console.error(err);
      alert("❌ Error al eliminar guía");
    }
  };

  if (loading) return <p className="p-4">Cargando guías...</p>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Guías de despacho</h1>
        <Link
          to={`/notas`}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
        >
          ← Volver a notas
        </Link>
      </div>

      {nota && (
        <>
          {/* Resumen de Despacho */}
          <div className="p-4 border rounded-lg shadow bg-white">
            <h2 className="text-xl font-semibold mb-4">Resumen de Despacho</h2>
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 border">Producto</th>
                    <th className="p-2 border text-center">Vendido</th>
                    <th className="p-2 border text-center">Despachado</th>
                    <th className="p-2 border text-center">Pendiente</th>
                  </tr>
                </thead>
                <tbody>
                  {nota.productos.map((p) => {
                    const pendiente = p.cantidad - (p.entregado || 0);
                    const key = p.itemId?._id || p._id;
                    return (
                      <tr key={key} className="hover:bg-gray-50">
                        <td className="p-2 border">{p.nombre}</td>
                        <td className="p-2 border text-center">{p.cantidad}</td>
                        <td className="p-2 border text-center">{p.entregado || 0}</td>
                        <td
                          className={`p-2 border text-center font-semibold ${
                            pendiente === 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {pendiente}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {nota.productos.every((p) => p.cantidad - (p.entregado || 0) === 0) && (
              <p className="mt-2 text-green-700 font-bold">
                Todos los productos han sido despachados ✅
              </p>
            )}
          </div>

          {/* Crear nueva guía */}
          <div className="p-4 border rounded-lg shadow bg-white">
            <h2 className="text-xl font-semibold mb-4">Crear nueva guía</h2>
            <div className="space-y-2">
              {nota.productos.map((p) => {
                const key = p.itemId?._id || p._id;
                const maxDespachable = p.cantidad - (p.entregado || 0);
                return (
                  <div
                    key={key}
                    className="flex flex-wrap items-center gap-2 p-2 border rounded hover:bg-gray-50"
                  >
                    <span className="flex-1 font-medium">{p.nombre}</span>
                    <span className="text-gray-600">Vendidos: {p.cantidad}</span>
                    <span className="text-gray-600">Despachados: {p.entregado || 0}</span>
                    <input
                      type="number"
                      min={0}
                      max={maxDespachable}
                      value={nuevaGuia[key] || 0}
                      onChange={(e) =>
                        handleCantidadChange(key, Number(e.target.value))
                      }
                      className="border rounded px-2 w-20"
                    />
                    <span className="text-gray-600">Disponibles: {maxDespachable}</span>
                  </div>
                );
              })}
            </div>
            <button
              onClick={crearGuia}
              className="mt-4 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
            >
              <Plus className="w-4 h-4" /> Crear Guía
            </button>
          </div>
        </>
      )}

      {/* Guías existentes */}
      <h2 className="text-xl font-semibold">Guías existentes</h2>
      <div className="space-y-4">
        {guias.length === 0 && <p>No hay guías creadas para esta nota aún.</p>}
        {guias.map((g) => (
          <div
            key={g._id}
            className="p-4 border rounded-lg shadow hover:shadow-md transition bg-white space-y-2"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Guía N° {g.numero}</h3>
              <span
                className={`px-2 py-1 rounded text-sm font-medium ${
                  g.estado === "completada"
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {g.estado}
              </span>
            </div>
            <p className="text-gray-600 text-sm">
              Fecha: {new Date(g.fecha).toLocaleDateString()}
            </p>

            <div className="overflow-x-auto mt-2">
              <table className="w-full table-auto border-collapse">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 border">Producto</th>
                    <th className="p-2 border text-center">Cantidad</th>
                    <th className="p-2 border text-right">Precio</th>
                    <th className="p-2 border text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {g.productos.map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50">
                      <td className="p-2 border">{p.itemId?.nombre || p.nombre}</td>
                      <td className="p-2 border text-center">{p.cantidad}</td>
                      <td className="p-2 border text-right">
                        ${p.precio.toLocaleString()}
                      </td>
                      <td className="p-2 border text-right">
                        ${(p.precio * p.cantidad).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2 mt-2">
              {g.pdfPath && (
                <a
                  href={g.pdfPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded transition"
                >
                  <FileText className="w-4 h-4" /> Ver PDF
                </a>
              )}
              <button
                onClick={() => eliminarGuia(g._id)}
                className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition"
              >
                <Trash2 className="w-4 h-4" /> Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
