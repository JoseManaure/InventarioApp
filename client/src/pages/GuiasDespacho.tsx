import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/api";
import { Plus, Trash2, FileText } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// --- Fix iconos Leaflet ---
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadowUrl from "leaflet/dist/images/marker-shadow.png";

const defaultIcon = L.icon({
  iconUrl,
  shadowUrl: iconShadowUrl,
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

// --- Interfaces ---
interface ProductoGuia {
  _id: string;
  itemId?: { _id: string; nombre: string };
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
  direccion?: string; 
  clientPos?: [number, number];
}

interface Nota {
  _id: string;
  productos: ProductoGuia[];
  direccion?: string; 
}

// --- Geocodificación ---
async function obtenerCoordenadas(direccion: string): Promise<[number, number] | null> {
  try {
    const encoded = encodeURIComponent(direccion);
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`);
    const data = await res.json();
    if (data && data.length > 0) return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    return null;
  } catch (err) {
    console.error("Error geocodificando la dirección:", err);
    return null;
  }
}

// --- Ruta real OSRM (solo calles normales) ---
async function obtenerRutaOSRM(origen: [number, number], destino: [number, number]): Promise<[number, number][]> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${origen[1]},${origen[0]};${destino[1]},${destino[0]}?overview=full&geometries=geojson&steps=true`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.routes || data.routes.length === 0) return [origen, destino];

    const pasos = data.routes[0].legs[0].steps;
    // Filtrar pasos por autopista
    const rutaCalles = pasos.flatMap((s: any) => {
      if (s.maneuver && s.maneuver.type === "motorway") return [];
      return s.geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
    });

    if (rutaCalles.length === 0)
      return data.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]]);

    return rutaCalles;
  } catch (err) {
    console.error("Error obteniendo ruta:", err);
    return [origen, destino];
  }
}

// --- Componente ---
export default function GuiasDespacho() {
  const { notaId } = useParams<{ notaId: string }>();
  const [nota, setNota] = useState<Nota | null>(null);
  const [guias, setGuias] = useState<GuiaDespacho[]>([]);
  const [nuevaGuia, setNuevaGuia] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const [modalGuia, setModalGuia] = useState<GuiaDespacho | null>(null);
  const [deliveryPos, setDeliveryPos] = useState<[number, number] | null>(null);
  const [route, setRoute] = useState<[number, number][]>([]);
  const [routeIndex, setRouteIndex] = useState(0);
  const [orderStatus, setOrderStatus] = useState<"En camino" | "Entregado" | null>(null);
  const [eta, setEta] = useState<number>(0);

  const [deliveryStart, setDeliveryStart] = useState<[number, number]>([-33.45, -70.65]);

  // --- Ubicación real ---
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setDeliveryStart([pos.coords.latitude, pos.coords.longitude]),
        () => console.warn("No se pudo obtener ubicación, se usará valor por defecto")
      );
    }
  }, []);

  // --- Cargar datos ---
  const cargarDatos = useCallback(async () => {
    if (!notaId) return;
    setLoading(true);
    try {
      const resNota = await api.get(`/cotizaciones/${notaId}`);
      const notaData: Nota = resNota.data;

      const resGuias = await api.get(`/guias/nota/${notaId}`);
      const guiasData: GuiaDespacho[] = (resGuias.data || []).map(g => ({
        ...g,
        direccion: notaData.direccion,
      }));

      const productosConEntregado = (notaData.productos || []).map((p) => {
        const entregado = guiasData.reduce((acc, g) => {
          const prod = g.productos.find((gp) => gp.itemId?._id === p.itemId?._id);
          return acc + (prod?.cantidad || 0);
        }, 0);
        return { ...p, entregado };
      });

      setNota({ _id: notaData._id, productos: productosConEntregado, direccion: notaData.direccion });
      setGuias(guiasData);
      setNuevaGuia({});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [notaId]);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  // --- Crear guía ---
  const handleCantidadChange = (itemId: string, value: number) => setNuevaGuia((prev) => ({ ...prev, [itemId]: value }));

  const crearGuia = async () => {
    if (!nota) return;
    const productosAGuardar = nota.productos
      .filter((p) => p.itemId?._id && (nuevaGuia[p.itemId._id] || 0) > 0)
      .map((p) => {
        const key = p.itemId._id;
        const maxDespachable = p.cantidad - (p.entregado || 0);
        const cantidad = Math.min(nuevaGuia[key] || 0, maxDespachable);
        return { itemId: key, nombre: p.nombre, cantidad, precio: p.precio };
      });
    if (!productosAGuardar.length) { alert("Selecciona al menos un producto"); return; }

    try {
      const res = await api.post("/guias", { notaId, productos: productosAGuardar });
      const nuevaGuiaCreada: GuiaDespacho = res.data;

      if (nota) {
        const productosActualizados = nota.productos.map((p) => {
          const key = p.itemId?._id || p._id;
          const entregadoEnEstaGuia = nuevaGuiaCreada.productos.find((np) => np.itemId?._id === key)?.cantidad || 0;
          return { ...p, entregado: (p.entregado || 0) + entregadoEnEstaGuia };
        });
        setNota({ ...nota, productos: productosActualizados });
      }

      setGuias((prev) => [...prev, { ...nuevaGuiaCreada, direccion: nota.direccion }]);
      setNuevaGuia({});
      alert("✅ Guía creada");
    } catch (err) {
      console.error(err);
      alert("❌ Error creando guía");
    }
  };

  const eliminarGuia = async (guiaId: string) => {
    if (!window.confirm("¿Seguro quieres eliminar esta guía?")) return;
    try { await api.delete(`/guias/${guiaId}`); alert("✅ Guía eliminada"); cargarDatos(); }
    catch (err) { console.error(err); alert("❌ Error al eliminar guía"); }
  };

  // --- Abrir modal y ruta real ---
  const openDeliveryMap = async (guia: GuiaDespacho) => {
    let clientPos: [number, number] = [-33.4489, -70.6693];
    if (guia.direccion) {
      const coords = await obtenerCoordenadas(guia.direccion);
      if (coords) clientPos = coords;
    }
    const rutaReal = await obtenerRutaOSRM(deliveryStart, clientPos);

    setModalGuia({ ...guia, clientPos });
    setDeliveryPos(deliveryStart);
    setRoute(rutaReal);
    setRouteIndex(0);
    setOrderStatus("En camino");
    setEta(rutaReal.length);
  };

  // --- Movimiento delivery ---
  useEffect(() => {
    if (!deliveryPos || !route.length || orderStatus !== "En camino") return;
    const interval = setInterval(() => {
      if (routeIndex >= route.length) {
        clearInterval(interval);
        setOrderStatus("Entregado");
        setEta(0);

        if (modalGuia?._id) {
          // ✅ PATCH correcto para marcar entrega
          api.patch(`/guias/${modalGuia._id}`, { estado: "completada" })
            .then(() => { cargarDatos(); alert(`✅ Guía N°${modalGuia.numero} entregada`); })
            .catch(err => { console.error(err); alert("❌ No se pudo marcar como entregada"); });
        }
        return;
      }

      const [lat, lng] = deliveryPos;
      const [targetLat, targetLng] = route[routeIndex];
      const step = 0.0007;
      const arrived = Math.abs(lat - targetLat) < step && Math.abs(lng - targetLng) < step;

      if (arrived) setRouteIndex(i => i + 1);
      else {
        const newLat = lat + (targetLat - lat) * step * 50;
        const newLng = lng + (targetLng - lng) * step * 50;
        setDeliveryPos([newLat, newLng]);
        const remaining = Math.sqrt((targetLat - newLat) ** 2 + (targetLng - newLng) ** 2);
        setEta(Math.max(Math.round(remaining / step / 60), 1));
      }
    }, 500);

    return () => clearInterval(interval);
  }, [deliveryPos, route, routeIndex, orderStatus, modalGuia, cargarDatos]);

  const marcarEntregaManual = () => {
    if (!modalGuia?._id) return;
    api.patch(`/guias/${modalGuia._id}`, { estado: "completada" })
      .then(() => { setOrderStatus("Entregado"); cargarDatos(); alert(`✅ Guía N°${modalGuia.numero} entregada`); })
      .catch(err => { console.error(err); alert("❌ No se pudo marcar como entregada"); });
  };

  if (loading) return <p className="p-4">Cargando guías...</p>;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Guías de despacho</h1>
        <Link to={`/notas`} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition">← Volver</Link>
      </div>

      {/* Resumen nota */}
      {nota && (
        <div className="p-4 border rounded shadow bg-white">
          <h2 className="text-xl font-semibold mb-4">Resumen</h2>
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
                    <td className={`p-2 border text-center font-semibold ${pendiente === 0 ? "text-green-600" : "text-red-600"}`}>{pendiente}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Crear guía */}
      {nota && (
        <div className="p-4 border rounded shadow bg-white">
          <h2 className="text-xl font-semibold mb-4">Crear nueva guía</h2>
          <div className="space-y-2">
            {nota.productos.map((p) => {
              const key = p.itemId?._id || p._id;
              const maxDespachable = p.cantidad - (p.entregado || 0);
              return (
                <div key={key} className="flex flex-wrap items-center gap-2 p-2 border rounded hover:bg-gray-50">
                  <span className="flex-1 font-medium">{p.nombre}</span>
                  <span className="text-gray-600">Vendidos: {p.cantidad}</span>
                  <span className="text-gray-600">Despachados: {p.entregado || 0}</span>
                  <input type="number" min={0} max={maxDespachable} value={nuevaGuia[key] || 0} onChange={(e) => handleCantidadChange(key, Number(e.target.value))} className="border rounded px-2 w-20" />
                  <span className="text-gray-600">Disponibles: {maxDespachable}</span>
                </div>
              );
            })}
          </div>
          <button onClick={crearGuia} className="mt-4 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"><Plus className="w-4 h-4" /> Crear Guía</button>
        </div>
      )}

      {/* Guías existentes */}
      <h2 className="text-xl font-semibold">Guías existentes</h2>
      <div className="space-y-4">
        {guias.length === 0 && <p>No hay guías creadas.</p>}
        {guias.map((g) => (
          <div key={g._id} className="p-4 border rounded shadow hover:shadow-md transition bg-white space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Guía N° {g.numero}</h3>
              <span className={`px-2 py-1 rounded text-sm font-medium ${g.estado === "completada" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>{g.estado}</span>
            </div>
            <p className="text-gray-600 text-sm">Dirección entrega: {g.direccion || "No disponible"}</p>
            <p className="text-gray-600 text-sm">Fecha: {new Date(g.fecha).toLocaleDateString()}</p>

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
                      <td className="p-2 border text-right">${p.precio.toLocaleString()}</td>
                      <td className="p-2 border text-right">${(p.precio * p.cantidad).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2 mt-2">
              {g.pdfPath && (
                <a href={g.pdfPath} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded transition">
                  <FileText className="w-4 h-4" /> Ver PDF
                </a>
              )}
              <button onClick={() => eliminarGuia(g._id)} className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition">
                <Trash2 className="w-4 h-4" /> Eliminar
              </button>
              <button onClick={() => openDeliveryMap(g)} className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded">
                🛵 Enviar / Ver ruta
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Delivery */}
      {modalGuia && deliveryPos && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-start z-50">
          <div className="bg-white mt-20 p-4 rounded shadow-lg max-w-4xl w-full">
            <h2 className="text-xl font-bold mb-2">🚴 En camino: Guía N° {modalGuia.numero}</h2>
            <p>ETA: {eta} min</p>
            <div style={{ height: "400px", width: "100%" }}>
              <MapContainer center={deliveryPos} zoom={14} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {modalGuia.clientPos && (
                  <Marker position={modalGuia.clientPos}>
                    <Popup>📍 Cliente: {modalGuia.direccion || "No disponible"}</Popup>
                  </Marker>
                )}
                <Marker position={deliveryPos}><Popup>🚴 Delivery</Popup></Marker>
                <Polyline positions={route} color="blue" />
              </MapContainer>
            </div>
            <div className="flex gap-2 mt-2">
              <button onClick={marcarEntregaManual} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Marcar como entregada</button>
              <button onClick={() => setModalGuia(null)} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
