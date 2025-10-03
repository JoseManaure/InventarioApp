import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/api";
import { Plus, Trash2, FileText } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { io, Socket } from "socket.io-client";

// --- Fix para iconos de Leaflet ---
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
  clientPos?: [number, number];
}

interface Nota {
  _id: string;
  productos: ProductoGuia[];
}

// --- Componente ---
export default function GuiasDespacho() {
  const { notaId } = useParams<{ notaId: string }>();
  const [nota, setNota] = useState<Nota | null>(null);
  const [guias, setGuias] = useState<GuiaDespacho[]>([]);
  const [nuevaGuia, setNuevaGuia] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // --- Modal / Delivery ---
  const [modalGuia, setModalGuia] = useState<GuiaDespacho | null>(null);
  const [deliveryPos, setDeliveryPos] = useState<[number, number] | null>(null);
  const [orderStatus, setOrderStatus] = useState<"En camino" | "Entregado" | null>(null);
  const [eta, setEta] = useState<number>(0);

  const socketRef = useState<Socket | null>(null)[0];
  const deliveryStart: [number, number] = [-33.45, -70.65];

  // --- Cargar datos ---
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
          const prod = g.productos.find((gp) => gp.itemId?._id === p.itemId?._id);
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

  // --- Crear nueva guía ---
  const handleCantidadChange = (itemId: string, value: number) => {
    setNuevaGuia((prev) => ({ ...prev, [itemId]: value }));
  };

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

    if (productosAGuardar.length === 0) {
      alert("Selecciona al menos un producto con cantidad válida");
      return;
    }

    try {
      const res = await api.post("/guias", { notaId, productos: productosAGuardar });
      alert("✅ Guía creada correctamente");
      const nuevaGuiaCreada: GuiaDespacho = res.data;

      // Actualizar entregado en la nota
      if (nota) {
        const productosActualizados = nota.productos.map((p) => {
          const key = p.itemId?._id || p._id;
          const entregadoEnEstaGuia = nuevaGuiaCreada.productos.find(
            (np) => np.itemId?._id === key
          )?.cantidad || 0;
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

  // --- Abrir modal delivery y conectar WebSocket ---
  const openDeliveryMap = (guia: GuiaDespacho) => {
    const clientPos: [number, number] = [-33.4489, -70.6693]; // coordenadas del cliente
    setModalGuia({ ...guia, clientPos });
    setDeliveryPos(deliveryStart);
    setOrderStatus("En camino");
    setEta(5);

    const socket = io(process.env.REACT_APP_API_URL || "http://localhost:3000");
    socket.emit("joinGuia", guia._id);

    socket.on("locationUpdate", (data: any) => {
      if (data.lat && data.lng) setDeliveryPos([data.lat, data.lng]);
      if (data.estado) setOrderStatus(data.estado);
    });

    socketRef?.disconnect();
    socketRef && (socketRef as any) = socket; // guardar referencia para desconectar
  };

  // --- Cleanup WebSocket al cerrar modal ---
  useEffect(() => {
    return () => {
      socketRef?.disconnect();
    };
  }, [socketRef]);

  if (loading) return <p className="p-4">Cargando guías...</p>;

  return (
    <div className="p-6 space-y-6">
      {/* Header, resumen, crear guía y lista de guías... igual que tu código anterior */}

      {/* --- Modal Delivery --- */}
      {modalGuia && deliveryPos && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-start z-50">
          <div className="bg-white mt-20 p-4 rounded shadow-lg max-w-4xl w-full">
            <h2 className="text-xl font-bold mb-2">🚴 En camino: Guía N° {modalGuia.numero}</h2>
            <p>Estado: {orderStatus}</p>
            <div style={{ height: "400px", width: "100%" }}>
              <MapContainer center={deliveryPos} zoom={14} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={modalGuia.clientPos!}>
                  <Popup>📍 Cliente</Popup>
                </Marker>
                <Marker position={deliveryPos}>
                  <Popup>🚴 Delivery</Popup>
                </Marker>
                <Polyline positions={[deliveryPos, modalGuia.clientPos!]} color="blue" />
              </MapContainer>
            </div>
            <button onClick={() => setModalGuia(null)} className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
