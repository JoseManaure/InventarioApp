// src/pages/NotasDeVenta.tsx
import { useEffect, useState, useMemo } from "react";
import api from "../api/api";
import { FileText, Trash2, CreditCard, Truck, Printer } from "lucide-react";
import { generarGuiaPDF } from "../utils/pdf"; // <-- tu util PDF personalizado

interface Producto {
  _id: string;   
  nombre: string;
  cantidad: number;
  precio: number;
  despachado?: number;
}

interface NotaDeVenta {
  _id: string;
  cliente: string;
  direccion: string;
  fechaEntrega: string;
  metodoPago: string;
  productos: Producto[];
  pdfUrl?: string;
  anulada?: string;
  cotizacionOriginalId?: string;
  tipo?: string;
}

export default function NotasDeVenta() {
  const [notas, setNotas] = useState<NotaDeVenta[]>([]);
  const [, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressVisible, setProgressVisible] = useState(false);
  const [mesSeleccionado, setMesSeleccionado] = useState<string>(() => {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;
  });
  const [pagina, setPagina] = useState(1);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);

  const [showGuiaModal, setShowGuiaModal] = useState(false);
  const [guiaNota, ] = useState<NotaDeVenta | null>(null);
  const [despachoCantidades, setDespachoCantidades] = useState<number[]>([]);

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
      const todasNotas: NotaDeVenta[] = res.data.filter((c: NotaDeVenta) => c.tipo === "nota");
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
      setTimeout(() => setProgressVisible(false), 500);
      setTimeout(() => setProgress(0), 800);
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

      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      console.error("Error iniciando pago:", err);
      alert("No se pudo iniciar el pago");
    }finally {
    setPayingId(null); // liberar estado
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


   const guardarGuiaDespacho = async () => {
  if (!guiaNota) return;

  try {
    // Preparar productos a despachar con tipos correctos
    const productosADespachar = guiaNota.productos
      .map((p, idx) => ({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        itemId: (p as any).itemId?._id || (p as any)._id, // usar el ID real
        nombre: p.nombre,
        cantidad: despachoCantidades[idx] || 0,
        precio: p.precio,
      }))
      .filter((p) => p.cantidad > 0);

    if (productosADespachar.length === 0) {
      alert("Ingresa al menos una cantidad a despachar");
      return;
    }

    // Crear la guía en backend
    await api.post(`/guias`, {
      notaId: guiaNota._id,
      productos: productosADespachar,
    });

    alert("Guía de despacho creada correctamente");
    setShowGuiaModal(false);
    cargarNotas(); // refresca la lista
  } catch (err) {
    console.error("Error guardando guía de despacho:", err);
    alert("Error al guardar la guía");
  }
};

  const totalGuia = () => {
    if (!guiaNota) return 0;
    return guiaNota.productos.reduce(
      (acc, p, idx) => acc + (despachoCantidades[idx] || 0) * p.precio,
      0
    );
  };

  const imprimirGuia = async () => {
    if (!guiaNota) return;

    try {
      // Generar PDF usando tu util
    const buffer = generarGuiaPDF(
  guiaNota.cliente,
  guiaNota.productos.map((p, idx) => ({
    ...p,
    cantidad: despachoCantidades[idx] || 0,
    total: (despachoCantidades[idx] || 0) * p.precio,
  })),
  {
    tipo: "guia",
    numeroDocumento: guiaNota._id,          // puedes poner el id de la nota o un número correlativo
    direccion: guiaNota.direccion,          // renombrado
    fechaEntrega: guiaNota.fechaEntrega || new Date().toISOString().split("T")[0],
    metodoPago: guiaNota.metodoPago || "efectivo",
    tipoDocumento: "guia",                  // opcional, según tu util
  }
);
      // Crear Blob y abrir en nueva ventana
      const blob = new Blob([buffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (err) {
      console.error("Error generando PDF:", err);
      alert("No se pudo generar la Guía en PDF");
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen flex flex-col">
      <h2 className="text-3xl font-semibold mb-6 text-gray-800 flex items-center gap-2">
        <FileText className="w-7 h-7" />
        Notas de Venta
      </h2>

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
        <div
          className="w-full h-2 bg-gray-300 rounded mb-4 overflow-hidden transition-opacity duration-500"
          style={{ opacity: progressVisible ? 1 : 0 }}
        >
          <div
            className="h-2 bg-blue-600 rounded transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Tabla de notas */}
      <div className="flex-1 shadow-md rounded-lg relative overflow-x-auto bg-white">
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
              <th className="p-3 text-gray-700 font-medium uppercase text-sm">Acciones</th>
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
              const estaAnulada = Boolean(nota.anulada);

              return (
                <tr
                  key={nota._id}
                  className={`${estaAnulada ? "bg-red-50" : "bg-white"} border-b border-gray-200`}
                >
                  <td className="p-3 text-gray-800">{nota.cliente}</td>
                  <td className="p-3 text-gray-800">{nota.direccion}</td>
                  <td className="p-3 text-gray-800">{formatearFecha(nota.fechaEntrega)}</td>
                  <td className="p-3 text-gray-800">{nota.metodoPago}</td>
                  <td className={`p-3 font-semibold ${estaAnulada ? "text-red-600" : "text-gray-800"}`}>
                    ${neto.toLocaleString("es-CL", { maximumFractionDigits: 0 })}
                  </td>
                  <td className={`p-3 font-semibold ${estaAnulada ? "text-red-600" : "text-gray-800"}`}>
                    ${iva.toLocaleString("es-CL", { maximumFractionDigits: 0 })}
                  </td>
                  <td className={`p-3 font-bold ${estaAnulada ? "text-red-600" : "text-gray-900"}`}>
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
                    {!estaAnulada ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => anularNota(nota._id)}
                          className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition flex items-center gap-1"
                          title="Anular"
                        >
                          <Trash2 className="w-4 h-4" />
                          Anular
                        </button>
                        <button
                          onClick={() => pagarNota(nota)}
                          disabled={payingId === nota._id}
                          className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition flex items-center gap-1 disabled:opacity-60"
                          title="Pagar"
                        >
                          <CreditCard className="w-4 h-4" />
                          {payingId === nota._id ? "Procesando..." : "Pagar"}
                        </button>
                      <button
  onClick={() => window.location.href = `/guias/${nota._id}`}
  className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center gap-1"
  title="Ver / Crear Guías"
>
  <Truck className="w-4 h-4" />
  Guías
</button>
                      </div>
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


            {/* Modal Guía de Despacho */}
      {showGuiaModal && guiaNota && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowGuiaModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-2/3 max-h-[80vh] p-4 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Crear Guía de Despacho - {guiaNota.cliente}</h3>
              <button
                onClick={imprimirGuia}
                className="flex items-center gap-2 px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-800"
              >
                <Printer className="w-4 h-4" />
                Imprimir
              </button>
            </div>
            {guiaNota.productos.map((p, idx) => (
              <div key={idx} className="flex items-center gap-2 mb-2">
                <span className="w-1/2">{p.nombre}</span>
                <input
                  type="number"
                  min={0}
                  max={p.cantidad - (p.despachado || 0)}
                  value={despachoCantidades[idx]}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setDespachoCantidades((prev) => {
                      const copy = [...prev];
                      copy[idx] = val;
                      return copy;
                    });
                  }}
                  className="border rounded px-2 py-1 w-24"
                />
                <span>de {p.cantidad - (p.despachado || 0)} disponible</span>
                <span className="ml-auto font-semibold">
                  ${((despachoCantidades[idx] || 0) * p.precio).toLocaleString("es-CL")}
                </span>
              </div>
            ))}
            <div className="flex justify-end gap-2 mt-4 font-bold text-gray-800">
              Total: ${totalGuia().toLocaleString("es-CL")}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowGuiaModal(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={guardarGuiaDespacho}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Guardar Guía
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

