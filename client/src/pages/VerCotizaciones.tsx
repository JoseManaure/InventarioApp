import {
  User,
  MapPin,
  CalendarDays,
  CreditCard,
  DollarSign,
  MoreVertical
} from 'lucide-react';

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { generarGuiaPDF } from '../utils/pdf';

interface Producto {
  itemId: string | {
    _id: string;
    nombre: string;
  };

  nombre: string;
  cantidad: number;
  precio: number;
  total: number;
}

interface Cliente {
  _id: string;
  nombre: string;
  rut?: string;
  direccion?: string;
  comuna?: string;
  ciudad?: string;
  telefono?: string;
  email?: string;
  giro?: string;
}
interface Cotizacion {
  total: number;
  _id: string;
  cliente: Cliente | null;
  direccion: string;
  fechaHoy: string;
  fechaEntrega: string;
  metodoPago: string;
  tipo: 'cotizacion' | 'nota';
  pdfUrl?: string;
  numero?: number;
  productos?: Producto[];
  yaConvertida?: boolean;
  tipoDocumento?: string;
}


interface Cotizacion {
  total: number;
  _id: string;
  cliente: Cliente | null;

}
export default function VerCotizaciones() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [menuAbierto, setMenuAbierto] = useState<string | null>(null);
  const navigate = useNavigate();

  // =========================
  // Cargar cotizaciones
  // =========================
  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await api.get('/cotizaciones');
        const soloCotizaciones = res.data.filter(
          (c: Cotizacion) => c.tipo === 'cotizacion'
        );
        setCotizaciones(soloCotizaciones);
      } catch (err) {
        console.error('Error al cargar cotizaciones', err);
      }
    };

    cargar();
  }, []);

  // =========================
  // Cerrar menú al hacer click fuera
  // =========================
  useEffect(() => {
    const cerrar = () => setMenuAbierto(null);
    window.addEventListener('click', cerrar);
    return () => window.removeEventListener('click', cerrar);
  }, []);

  // =========================
  // Convertir a nota
  // =========================
  const convertirCotizacion = async (cotizacion: Cotizacion) => {
    try {
      const confirmar = window.confirm('¿Convertir esta cotización en nota?');
      if (!confirmar) return;

      const productosActualizados = cotizacion.productos?.map((p) => {
        let itemIdFinal = null;

        if (p.itemId && typeof p.itemId === 'object') {
          itemIdFinal = (p.itemId as any)._id;
        } else if (typeof p.itemId === 'string') {
          itemIdFinal = p.itemId;
        }

        return {
          itemId: itemIdFinal,
          nombre: p.nombre,
          cantidad: Number(p.cantidad || 0),
          precio: Number(p.precio || 0),
          total: Number(p.cantidad || 0) * Number(p.precio || 0),
        };
      });

      const res = await api.post(
        `/cotizaciones/${cotizacion._id}/convertir-a-nota`,
        { productos: productosActualizados }
      );

      const nuevaNota = res.data;

      const pdfBlob = generarGuiaPDF(
        nuevaNota.cliente?.nombre || "",
        nuevaNota.productos,
        {
          tipo: 'nota',
          direccion: nuevaNota.direccion,
          fechaEntrega: nuevaNota.fechaEntrega,
          metodoPago: nuevaNota.metodoPago,
          tipoDocumento: nuevaNota.tipoDocumento || 'nota',
        }
      );

      const formData = new FormData();
      const file = new File(
        [pdfBlob],
        `nota-${nuevaNota.numero}.pdf`,
        { type: 'application/pdf' }
      );

      formData.append('file', file);
      formData.append('cotizacionId', nuevaNota._id);

      await api.post('/cotizaciones/upload-pdf', formData);

      alert('✅ Convertida a nota correctamente');
      navigate('/notas');
    } catch (error) {
      console.error(error);
      alert('❌ Error al convertir');
    }
  };

  // =========================
  // Eliminar
  // =========================
  const eliminarCotizacion = async (id: string) => {
    try {
      const confirmar = window.confirm('¿Eliminar cotización?');
      if (!confirmar) return;

      await api.delete(`/cotizaciones/${id}`);

      setCotizaciones((prev) => prev.filter((c) => c._id !== id));
    } catch (error) {
      console.error(error);
      alert('Error al eliminar');
    }
  };

  // =========================
  // UI
  // =========================
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6">
        Cotizaciones
      </h2>

      <div className="border rounded-xl shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">
                Estado
              </th>
              <th className="px-4 py-3 text-left">
                <div className="flex items-center gap-2">
                  <User size={14} /> Cliente
                </div>
              </th>
              <th className="px-4 py-3 text-left">
                <MapPin size={14} /> Dirección
              </th>
              <th className="px-4 py-3 text-left">
                <CalendarDays size={14} /> Entrega
              </th>
              <th className="px-4 py-3 text-left">
                <CreditCard size={14} /> Pago
              </th>
              <th className="px-4 py-3 text-left">
                <DollarSign size={14} /> Total
              </th>
              <th className="px-4 py-3 text-right"></th>
            </tr>
          </thead>

          <tbody>
            {cotizaciones.map((cot) => (
              <tr
                key={cot._id}
                className="border-t hover:bg-gray-50 transition"
              >
                {/* ESTADO */}
                <td className="px-4 py-3">
                  {cot.yaConvertida ? (
                    <span
                      className="
              inline-flex
              items-center
              px-2.5
              py-1
              rounded-full
              text-xs
              font-medium
              bg-green-100
              text-green-700
            "
                    >
                      Convertida
                    </span>
                  ) : (
                    <span
                      className="
              inline-flex
              items-center
              px-2.5
              py-1
              rounded-full
              text-xs
              font-medium
              bg-amber-100
              text-amber-700
            "
                    >
                      Pendiente
                    </span>
                  )}
                </td>

                {/* CLIENTE */}
                <td className="px-4 py-3">
                  {cot.cliente?.nombre || "Sin cliente"}
                </td>

                {/* DIRECCION */}
                <td className="px-4 py-3">
                  {cot.direccion}
                </td>

                {/* FECHA */}
                <td className="px-4 py-3">
                  {cot.fechaEntrega}
                </td>

                {/* PAGO */}
                <td className="px-4 py-3">
                  {cot.metodoPago}
                </td>

                {/* TOTAL */}
                <td className="px-4 py-3 font-medium">
                  $
                  {(
                    cot.productos?.reduce(
                      (acc, p) => acc + p.precio * p.cantidad,
                      0
                    ) || 0
                  ).toLocaleString('es-CL')}
                </td>

                {/* MENU */}
                <td className="px-4 py-3 text-right relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();

                      setMenuAbierto(
                        menuAbierto === cot._id
                          ? null
                          : cot._id
                      );
                    }}
                    className="
            p-2
            rounded-md
            hover:bg-gray-100
            transition
          "
                  >
                    <MoreVertical size={18} />
                  </button>

                  {menuAbierto === cot._id && (
                    <div
                      className="
              absolute
              right-4
              mt-2
              w-52
              bg-white
              border
              rounded-xl
              shadow-xl
              overflow-hidden
              z-50
            "
                    >
                      {cot.pdfUrl && (
                        <a
                          href={`http://localhost:5001${cot.pdfUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="
                  block
                  px-4
                  py-3
                  hover:bg-gray-50
                "
                        >
                          📄 Ver PDF
                        </a>
                      )}

                      <button
                        onClick={() =>
                          navigate(`/cotizaciones/${cot._id}`)
                        }
                        className="
                w-full
                text-left
                px-4
                py-3
                hover:bg-gray-50
              "
                      >
                        ✏️ Editar
                      </button>

                      {!cot.yaConvertida && (
                        <button
                          onClick={() =>
                            convertirCotizacion(cot)
                          }
                          className="
                  w-full
                  text-left
                  px-4
                  py-3
                  hover:bg-gray-50
                "
                        >
                          🔄 Convertir a Nota
                        </button>
                      )}

                      <button
                        onClick={() =>
                          eliminarCotizacion(cot._id)
                        }
                        className="
                w-full
                text-left
                px-4
                py-3
                text-red-600
                hover:bg-red-50
              "
                      >
                        🗑 Eliminar
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}