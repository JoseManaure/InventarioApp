// src/pages/NotasDeVenta.tsx
import { useEffect, useState, useMemo } from "react";
import api from "../api/api";
import {
  FileText, Trash2, CreditCard, Truck, Percent, UserCheck,
  X,
} from "lucide-react";
import GananciaModal from "../components/GananciaModal";
import type {
  Cotizacion,
  Producto
} from "../types/Cotizacion";
import type { NotaDeVenta } from "../types/NotaDeVenta";

export default function NotasDeVenta() {
  const [notas, setNotas] = useState<Cotizacion[]>([]);
  const [, setLoading] = useState(false);
  const [, setProgress] = useState(0);
  const [, setProgressVisible] = useState(false);

  const [mesSeleccionado, setMesSeleccionado] = useState<string>(() => {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;
  });
  const [pagina, setPagina] = useState(1);

  // 👇 cambiamos para usar estados de PDF modal
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const [payingId, setPayingId] = useState<string | null>(null);
  const [, setShowGuiaModal] = useState(false);
  const [guiaNota] = useState<Cotizacion | null>(null);
  const [despachoCantidades] = useState<number[]>([]);

  // 🔥 Ganancia modal
  const [showGananciaModal, setShowGananciaModal] = useState(false);
  const [productosGanancia, setProductosGanancia] = useState<Producto[]>([]);
  // 👤 Modal recibido por
  const [showRecibidoModal, setShowRecibidoModal] = useState(false);

  const [notaSeleccionada, setNotaSeleccionada] =
    useState<Cotizacion | null>(null);

  const [recibidoPor, setRecibidoPor] = useState("");
  const notasPorPagina = 5;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    if (status === "success") {
      alert("✅ Pago realizado con éxito");
    } else if (status === "cancel") {
      alert("❌ Pago cancelado por el cliente");
    }
  }, []);

  useEffect(() => {
    cargarNotas();
  }, []);

  const cargarNotas = async () => {
    setLoading(true);
    setProgress(0);
    setProgressVisible(true);
    try {
      const res = await api.get("/cotizaciones");

      console.log("RESPUESTA API");
      console.log(res.data[0]);

      const todasNotas = res.data.filter(
        (c: Cotizacion) => c.tipo === "nota"
      );
      console.log(todasNotas);
      setNotas(todasNotas);
    } catch (err) {
      console.error("Error al cargar notas de venta", err);
    } finally {
      setLoading(false);
      setProgressVisible(false);
      setProgress(0);
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

  const pagarNota = async (nota: NotaDeVenta) => {
    setPayingId(nota._id);
    try {
      const neto = nota.productos.reduce(
        (a, p) => a + (Number(p.cantidad) || 0) * (Number(p.precio) || 0),
        0
      );

      const res = await api.post("/pagos/create-checkout-session", {
        notaId: nota._id,
        monto: neto,
      });

      const checkoutUrl = res.data.url;
      if (checkoutUrl) {
        window.open(checkoutUrl, "_blank");
        await navigator.clipboard.writeText(checkoutUrl);
        alert("✅ Link copiado al portapapeles, envíalo al cliente.");
        const mensaje = `Hola 👋, aquí está el link para pagar su nota de venta #${nota._id}: ${checkoutUrl}`;
        const waUrl = `https://wa.me/569XXXXXXXX?text=${encodeURIComponent(mensaje)}`;
        window.open(waUrl, "_blank");
      }
    } catch (err) {
      console.error("Error iniciando pago:", err);
      alert("No se pudo iniciar el pago");
    } finally {
      setPayingId(null);
    }
  };

  const marcarPagado = async (notaId: string) => {
    const nombre = prompt("¿A quién se le pagó esta nota?");

    if (!nombre) return;

    try {
      await api.put(`/cotizaciones/${notaId}`, {
        pagadoA: nombre,
        estadoPago: "pagado",
        fechaPago: new Date(),
      });

      alert("✅ Pago registrado");

      cargarNotas();

    } catch (err) {
      console.error(err);
      alert("❌ Error registrando pago");
    }
  };

  // 📲 Enviar WhatsApp con PDF
  const enviarWhatsapp = (nota: NotaDeVenta, pdfUrl: string) => {
    const numero = "569XXXXXXXX"; // ⚠️ reemplazar con número real si lo guardas en DB
    const neto = nota.productos.reduce(
      (a, p) => a + (Number(p.cantidad) || 0) * (Number(p.precio) || 0),
      0
    );
    const iva = Math.round(neto * 0.19);
    const total = neto + iva;

    const mensaje = `Hola ${nota.cliente}, te envío tu nota de venta #${nota._id}.
    
Total: $${total.toLocaleString("es-CL")}
Método de pago: ${nota.metodoPago}
Fecha de entrega: ${nota.fechaEntrega || "Por confirmar"}

Puedes ver el documento aquí: ${pdfUrl}`;

    const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank");
  };

  const notasFiltradas = useMemo(() => {
    return notas.filter((nota) => {
      // ✅ mostrar igual si no tiene fecha
      if (!nota.fechaEntrega) return true;

      if (!mesSeleccionado) return true;

      const mesNota = nota.fechaEntrega.slice(0, 7);

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

  const handlePrint = () => {
    window.print();
  };

  // 👤 Guardar quién recibió pago
  const guardarRecibidoPor = async () => {

    if (!notaSeleccionada) return;

    try {

      await api.put(
        `/cotizaciones/${notaSeleccionada._id}/recibido-por`,
        {
          recibidoPor,
        }
      );

      // ✅ actualizar tabla local
      setNotas((prev) =>
        prev.map((n) =>
          n._id === notaSeleccionada._id
            ? {
              ...n,
              recibidoPor,
            }
            : n
        )
      );

      setShowRecibidoModal(false);

      setNotaSeleccionada(null);

      setRecibidoPor("");

    } catch (err) {

      console.error(err);

      alert("Error actualizando recibidoPor");
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen flex flex-col">
      <div className="bg-white shadow-md rounded-xl p-4 flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <FileText className="w-6 h-6" />
          Notas de Venta
        </h2>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Filtrar por mes:</label>
          <input
            type="month"
            value={mesSeleccionado}
            onChange={(e) => {
              setMesSeleccionado(e.target.value);
              setPagina(1);
            }}
            className="border rounded px-2 py-1 text-sm"
          />

          {/* 🖨 BOTÓN IMPRIMIR */}
          <button
            onClick={handlePrint}
            className="ml-2 bg-gray-800 text-white px-3 py-1 rounded text-sm hover:bg-black"
          >
            🖨 Imprimir
          </button>
        </div>

      </div>

      <div id="print-area" className="flex-1 shadow-sm rounded-lg relative overflow-x-auto bg-white">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-100 border-b border-gray-300 text-sm">
            <tr>
              <th className="p-3">Cliente</th>
              <th className="p-3">Dirección</th>
              <th className="p-3">Fecha Entrega</th>
              <th className="p-3">Método Pago</th>
              <th className="p-3 text-right">Neto</th>
              <th className="p-3 text-right">IVA</th>
              <th className="p-3 text-right">Total</th>
              <th className="p-3 text-center">PDF</th>
              <th className="p-3 text-center">
                Recibido Por
              </th>
              <th className="p-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {notasPaginadas.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-4 text-center text-gray-500">
                  No hay notas de venta registradas en esta página.
                </td>
              </tr>
            ) : (
              notasPaginadas.map((nota) => {
                const neto = Math.round(
                  nota.productos?.reduce(
                    (acc, p) =>
                      acc + (Number(p.cantidad) || 0) * (Number(p.precio) || 0),
                    0
                  ) || 0
                );
                const iva = Math.round(neto * 0.19);
                const total = neto + iva;
                const estaAnulada = Boolean(nota.anulada);

                return (
                  <tr
                    key={nota._id}
                    className={`${estaAnulada ? "bg-red-50" : "bg-white"
                      } border-b hover:bg-gray-50`}
                  >
                    <td className="p-3">
                      {nota.nombreCliente || "Sin cliente"}
                    </td>
                    <td className="p-3">{nota.direccion}</td>
                    <td className="p-3">{formatearFecha(nota.fechaEntrega)}</td>
                    <td className="p-3">
                      <div className="flex flex-col">
                        <span>{nota.metodoPago}</span>


                      </div>
                    </td>
                    <td className="p-3 text-right">
                      ${neto.toLocaleString("es-CL")}
                    </td>
                    <td className="p-3 text-right">
                      ${iva.toLocaleString("es-CL")}
                    </td>
                    <td className="p-3 text-right font-semibold">
                      ${total.toLocaleString("es-CL")}
                    </td>
                    <td className="p-3 text-center">
                      {nota.pdfUrl ? (
                        <button
                          onClick={() => {
                            const url = `${import.meta.env.VITE_API_URL}${nota.pdfUrl}`;

                            setPdfUrl(url);
                            setShowPdfModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Abrir
                        </button>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="p-3 text-center">

                      {nota.recibidoPor ? (

                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">
                          {nota.recibidoPor}
                        </span>

                      ) : (

                        <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs">
                          Pendiente
                        </span>

                      )}

                    </td>
                    <td className="p-3 text-center">
                      {!estaAnulada ? (
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => anularNota(nota._id)}
                            className="text-red-600 hover:text-red-800"
                            title="Anular"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => pagarNota(nota)}
                            disabled={payingId === nota._id}
                            className="text-green-600 hover:text-green-800 disabled:opacity-50"
                            title="Pagar"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              (window.location.href = `/guias/${nota._id}`)
                            }
                            className="text-blue-600 hover:text-blue-800"
                            title="Guías"
                          >
                            <Truck className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {

                              console.log("PRODUCTOS NOTA");
                              console.log(nota.productos);

                              setProductosGanancia(nota.productos || []);
                              setShowGananciaModal(true);
                            }}
                          ></button>
                          <button
                            onClick={() => {
                              setProductosGanancia(nota.productos || []);
                              setShowGananciaModal(true);
                            }}
                            className="text-purple-600 hover:text-purple-800"
                            title="Ganancia"
                          >
                            <Percent className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {

                              setNotaSeleccionada(nota);

                              setRecibidoPor(
                                nota.recibidoPor || ""
                              );

                              setShowRecibidoModal(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-800"
                            title="Recibido por"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-red-600 font-semibold">
                          Anulada
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          <tfoot className="bg-gray-50 text-sm">
            <tr>
              <td colSpan={4} className="p-3 text-right font-semibold">
                Totales:
              </td>
              <td className="p-3 text-right font-bold">
                ${totales.neto.toLocaleString("es-CL")}
              </td>
              <td className="p-3 text-right font-bold">
                ${totales.iva.toLocaleString("es-CL")}
              </td>
              <td className="p-3 text-right font-bold">
                ${totales.total.toLocaleString("es-CL")}
              </td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex justify-center items-center gap-4 mt-4 text-sm">
        <button
          disabled={pagina === 1}
          onClick={() => setPagina(pagina - 1)}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
        >
          Anterior
        </button>
        <span>
          Página {pagina} de {totalPaginas || 1}
        </span>
        <button
          disabled={pagina === totalPaginas || totalPaginas === 0}
          onClick={() => setPagina(pagina + 1)}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>

      {/* 🔥 Ganancia Modal */}
      <GananciaModal
        open={showGananciaModal}
        onClose={() => setShowGananciaModal(false)}
        productos={productosGanancia}
      />

      {/* 📄 PDF Modal */}
      {showPdfModal && pdfUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-3/4 h-5/6 relative flex flex-col">
            <button
              onClick={() => setShowPdfModal(false)}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
            >
              ✕
            </button>

            <iframe
              src={pdfUrl}
              className="w-full flex-grow rounded-b-lg"
              title="PDF Preview"
            />

            <div className="p-4 flex justify-end gap-3 border-t">
              <button
                onClick={() =>
                  enviarWhatsapp(
                    notas.find(
                      (n) => `${import.meta.env.VITE_API_URL}${n.pdfUrl}` === pdfUrl
                    )!,
                    pdfUrl
                  )
                }
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg"
              >
                📲 Enviar por WhatsApp
              </button>

              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg"
              >
                📥 Descargar
              </a>

              <button
                onClick={() => setShowPdfModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg"
              >
                ❌ Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 👤 MODAL RECIBIDO POR */}
      {showRecibidoModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">

          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">

            <button
              onClick={() => setShowRecibidoModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">

              <div className="bg-indigo-100 p-3 rounded-xl">
                <UserCheck className="w-6 h-6 text-indigo-700" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  Registrar Pago
                </h3>

                <p className="text-sm text-gray-500">
                  ¿Quién recibió este pago?
                </p>
              </div>
            </div>

            <input
              type="text"
              value={recibidoPor}
              onChange={(e) =>
                setRecibidoPor(e.target.value)
              }
              placeholder="Ej: José, Caja, Carlos..."
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
            />

            <div className="flex justify-end gap-3 mt-6">

              <button
                onClick={() =>
                  setShowRecibidoModal(false)
                }
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                Cancelar
              </button>

              <button
                onClick={guardarRecibidoPor}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              >
                Guardar
              </button>

            </div>
          </div>
        </div>
      )}
      <style>
        {`
    @media print {
      body * {
        visibility: hidden;
      }

      #print-area, #print-area * {
        visibility: visible;
      }

      #print-area {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
      }

      button {
        display: none !important;
      }

      th, td {
        font-size: 12px;
        padding: 6px;
      }

      h2 {
        font-size: 18px;
      }
    }
  `}
      </style>
    </div>
  );
}
