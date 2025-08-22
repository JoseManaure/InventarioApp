// src/pages/NotasDeVenta.tsx
import { useEffect, useState, useMemo } from "react";
import api from "../api/api";

interface Producto {
  nombre: string;
  cantidad: number;
  precio: number;
}

interface NotaDeVenta {
  _id: string;
  cliente: string;
  direccion: string;
  fechaEntrega: string; // formato YYYY-MM-DD
  metodoPago: string;
  productos: Producto[];
  pdfUrl?: string;
  anulada?: string;
  cotizacionOriginalId?: string;
  tipo?: string;
}

export default function NotasDeVenta() {
  const [notas, setNotas] = useState<NotaDeVenta[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressVisible, setProgressVisible] = useState(false); // para animación fade out
  const [mesSeleccionado, setMesSeleccionado] = useState<string>(() => {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;
  });
  const [pagina, setPagina] = useState(1);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const notasPorPagina = 5;

  useEffect(() => {
    cargarNotas();
  }, []);

  const cargarNotas = async () => {
    setLoading(true);
    setProgress(0);
    setProgressVisible(true);
    try {
      const res = await api.get("/cotizaciones");
      const todasNotas = res.data.filter((c: NotaDeVenta) => c.tipo === "nota");

      const procesadas: NotaDeVenta[] = [];
      const total = todasNotas.length;

      for (let i = 0; i < total; i++) {
        procesadas.push(todasNotas[i]);
        setProgress(Math.round(((i + 1) / total) * 100));
        await new Promise((r) => setTimeout(r, 50));
      }

      setNotas(procesadas);
    } catch (err) {
      console.error("Error al cargar notas de venta", err);
    } finally {
      setLoading(false);
      // Fade out de la barra
      setTimeout(() => setProgressVisible(false), 500);
      setTimeout(() => setProgress(0), 800); // reiniciamos progreso
    }
  };

  const anularNota = async (id: string) => {
    if (!window.confirm("¿Seguro que quieres anular esta nota?")) return;
    try {
      await api.put(`/cotizaciones/${id}/anular`);
      alert("Nota anulada correctamente");
      cargarNotas();
    } catch (err) {
      console.error(err);
      alert("Error al anular la nota");
    }
  };

  const notasFiltradas = useMemo(() => {
    return notas.filter((nota) => {
      if (!mesSeleccionado) return true;
      const mesNota = nota.fechaEntrega?.slice(0, 7);
      return mesNota === mesSeleccionado;
    });
  }, [notas, mesSeleccionado]);

  const indexInicio = (pagina - 1) * notasPorPagina;
  const indexFin = indexInicio + notasPorPagina;
  const notasPaginadas = notasFiltradas.slice(indexInicio, indexFin);

  const totales = notasFiltradas.reduce(
    (acc, nota) => {
      if (!nota.anulada) {
        const neto = Math.round(
          nota.productos?.reduce(
            (a, p) => a + (Number(p.cantidad) || 0) * (Number(p.precio) || 0),
            0
          ) || 0
        );
        const iva = Math.round(neto * 0.19);
        const total = neto + iva;
        acc.neto += neto;
        acc.iva += iva;
        acc.total += total;
      }
      return acc;
    },
    { neto: 0, iva: 0, total: 0 }
  );

  const totalPaginas = Math.ceil(notasFiltradas.length / notasPorPagina);

  const formatearFecha = (fecha: string) => {
    if (!fecha) return "";
    const [year, month, day] = fecha.split("-");
    return `${day}-${month}-${year}`;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen flex flex-col">
      <h2 className="text-3xl font-semibold mb-6 text-gray-800">Notas de Venta</h2>

      {/* Filtro por mes */}
      <div className="mb-4">
        <label className="mr-2 font-medium text-gray-700">Filtrar por mes:</label>
        <input
          type="month"
          value={mesSeleccionado}
          onChange={(e) => {
            setMesSeleccionado(e.target.value);
            setPagina(1);
          }}
          className="border rounded px-3 py-1"
        />
      </div>

      {/* Barra de progreso */}
      {progressVisible && (
        <div className="w-full h-2 bg-gray-300 rounded mb-4 overflow-hidden transition-opacity duration-500"
             style={{ opacity: progressVisible ? 1 : 0 }}>
          <div
            className="h-2 bg-blue-600 rounded transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Tabla */}
      <div className="flex-1 shadow-md rounded-lg relative overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-100 border-b border-gray-300">
            <tr>
              <th className="p-3 text-gray-700 font-medium uppercase text-sm">Cliente</th>
              <th className="p-3 text-gray-700 font-medium uppercase text-sm">Dirección</th>
              <th className="p-3 text-gray-700 font-medium uppercase text-sm">Fecha Entrega</th>
              <th className="p-3 text-gray-700 font-medium uppercase text-sm">Método Pago</th>
              <th className="p-3 text-gray-700 font-medium uppercase text-sm">Neto</th>
              <th className="p-3 text-gray-700 font-medium uppercase text-sm">IVA</th>
              <th className="p-3 text-gray-700 font-medium uppercase text-sm">Total</th>
              <th className="p-3 text-gray-700 font-medium uppercase text-sm">PDF</th>
              <th className="p-3 text-gray-700 font-medium uppercase text-sm">Acción</th>
            </tr>
          </thead>
          <tbody>
            {notasPaginadas.map((nota) => {
              const neto = Math.round(
                nota.productos?.reduce(
                  (acc, p) => acc + (Number(p.cantidad) || 0) * (Number(p.precio) || 0),
                  0
                ) || 0
              );
              const iva = Math.round(neto * 0.19);
              const total = neto + iva;

              return (
                <tr
                  key={nota._id}
                  className={`${nota.anulada ? "bg-red-50" : "bg-white"} border-b border-gray-200`}
                >
                  <td className="p-3 text-gray-800">{nota.cliente}</td>
                  <td className="p-3 text-gray-800">{nota.direccion}</td>
                  <td className="p-3 text-gray-800">{formatearFecha(nota.fechaEntrega)}</td>
                  <td className="p-3 text-gray-800">{nota.metodoPago}</td>
                  <td className={`p-3 font-semibold ${nota.anulada ? "text-red-600" : "text-gray-800"}`}>
                    ${neto.toLocaleString("es-CL", { maximumFractionDigits: 0 })}
                  </td>
                  <td className={`p-3 font-semibold ${nota.anulada ? "text-red-600" : "text-gray-800"}`}>
                    ${iva.toLocaleString("es-CL", { maximumFractionDigits: 0 })}
                  </td>
                  <td className={`p-3 font-bold ${nota.anulada ? "text-red-600" : "text-gray-900"}`}>
                    ${total.toLocaleString("es-CL", { maximumFractionDigits: 0 })}
                  </td>
                  <td className="p-3">
                    {nota.pdfUrl ? (
                      <button
                        className="text-blue-600 underline hover:text-blue-800"
                        onClick={() => {
                          setPdfUrl(`http://localhost:3000${nota.pdfUrl}`);
                          setShowPdfModal(true);
                        }}
                      >
                        Abrir PDF
                      </button>
                    ) : (
                      <span className="text-gray-400 text-sm">No disponible</span>
                    )}
                  </td>
                  <td className="p-3">
                    {!nota.anulada ? (
                      <button
                        onClick={() => anularNota(nota._id)}
                        className="px-4 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                      >
                        Anular
                      </button>
                    ) : (
                      <span className="text-red-600 font-semibold">Anulada</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {notasPaginadas.length === 0 && (
              <tr>
                <td colSpan={9} className="p-4 text-center text-gray-500">
                  No hay notas de venta registradas en esta página.
                </td>
              </tr>
            )}
          </tbody>

          <tfoot className="bg-gray-100">
            <tr>
              <td colSpan={4} className="p-3 text-right font-bold text-gray-700">
                Totales (Todos los registros):
              </td>
              <td className="p-3 font-bold text-gray-800">
                ${totales.neto.toLocaleString("es-CL", { maximumFractionDigits: 0 })}
              </td>
              <td className="p-3 font-bold text-gray-800">
                ${totales.iva.toLocaleString("es-CL", { maximumFractionDigits: 0 })}
              </td>
              <td className="p-3 font-bold text-gray-900">
                ${totales.total.toLocaleString("es-CL", { maximumFractionDigits: 0 })}
              </td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex justify-center items-center gap-4 mt-4">
        <button
          disabled={pagina === 1}
          onClick={() => setPagina(pagina - 1)}
          className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
        >
          Anterior
        </button>
        <span className="font-medium">
          Página {pagina} de {totalPaginas || 1}
        </span>
        <button
          disabled={pagina === totalPaginas || totalPaginas === 0}
          onClick={() => setPagina(pagina + 1)}
          className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>

      {/* Modal PDF */}
      {showPdfModal && pdfUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300"
          onClick={() => setShowPdfModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-3/4 h-5/6 relative p-2 transform transition-transform duration-300 ease-out scale-90 opacity-0 animate-modalIn"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowPdfModal(false)}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 transition"
            >
              ✕
            </button>
            <iframe src={pdfUrl} className="w-full h-full rounded" title="PDF Preview" />
          </div>
        </div>
      )}
    </div>
  );
}
