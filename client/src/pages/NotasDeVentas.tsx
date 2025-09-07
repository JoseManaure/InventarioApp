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
    <div className="bg-white shadow-md rounded-xl p-4 flex items-center justify-between mb-4">
      <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
        <FileText className="w-6 h-6" />
        Notas de Venta
      </h2>

      {/* Filtro integrado en header */}
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
      </div>
    </div>

    {/* Tabla */}
    <div className="flex-1 shadow-sm rounded-lg relative overflow-x-auto bg-white">
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-100 border-b border-gray-300 text-sm">
          <tr>
            <th className="p-3 font-medium text-gray-700">Cliente</th>
            <th className="p-3 font-medium text-gray-700">Dirección</th>
            <th className="p-3 font-medium text-gray-700">Fecha Entrega</th>
            <th className="p-3 font-medium text-gray-700">Método Pago</th>
            <th className="p-3 font-medium text-gray-700 text-right">Neto</th>
            <th className="p-3 font-medium text-gray-700 text-right">IVA</th>
            <th className="p-3 font-medium text-gray-700 text-right">Total</th>
            <th className="p-3 font-medium text-gray-700 text-center">PDF</th>
            <th className="p-3 font-medium text-gray-700 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {notasPaginadas.length === 0 ? (
            <tr>
              <td colSpan={9} className="p-4 text-center text-gray-500">
                No hay notas de venta registradas en esta página.
              </td>
            </tr>
          ) : (
            notasPaginadas.map((nota) => {
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
                  className={`${
                    estaAnulada ? "bg-red-50" : "bg-white"
                  } border-b hover:bg-gray-50`}
                >
                  <td className="p-3">{nota.cliente}</td>
                  <td className="p-3">{nota.direccion}</td>
                  <td className="p-3">{formatearFecha(nota.fechaEntrega)}</td>
                  <td className="p-3">{nota.metodoPago}</td>
                  <td className="p-3 text-right">${neto.toLocaleString("es-CL")}</td>
                  <td className="p-3 text-right">${iva.toLocaleString("es-CL")}</td>
                  <td className="p-3 text-right font-semibold">${total.toLocaleString("es-CL")}</td>
                  <td className="p-3 text-center">
                    {nota.pdfUrl ? (
                      <button
                        onClick={() => {
                          setPdfUrl(`http://localhost:3000${nota.pdfUrl}`);
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
                          onClick={() => (window.location.href = `/guias/${nota._id}`)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Guías"
                        >
                          <Truck className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-red-600 font-semibold">Anulada</span>
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
            <td className="p-3 text-right font-bold">${totales.neto.toLocaleString("es-CL")}</td>
            <td className="p-3 text-right font-bold">${totales.iva.toLocaleString("es-CL")}</td>
            <td className="p-3 text-right font-bold">${totales.total.toLocaleString("es-CL")}</td>
            <td colSpan={2}></td>
          </tr>
        </tfoot>
      </table>
    </div>

    {/* Paginación */}
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
  </div>
)
}