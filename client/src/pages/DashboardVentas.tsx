// src/pages/DashboardVentasFijo.tsx
import { useEffect, useState } from "react";
import api from "../api/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

interface Producto {
  nombre: string;
  cantidad: number;
  precio: number;
}

interface NotaDeVenta {
  _id: string;
  cliente: string;
  fechaEntrega: string; // formato YYYY-MM-DD
  productos: Producto[];
  tipo: string;
  anulada?: string;
}

export default function DashboardVentasFijo() {
  const [notas, setNotas] = useState<NotaDeVenta[]>([]);
  const [loading, setLoading] = useState(false);

  const [mesFiltro, setMesFiltro] = useState<string>("");
  const [clienteFiltro, setClienteFiltro] = useState<string>("");
  const [productoFiltro, setProductoFiltro] = useState<string>("");

  const [clientesDisponibles, setClientesDisponibles] = useState<string[]>([]);
  const [productosDisponibles, setProductosDisponibles] = useState<string[]>([]);

  const [ventasMensuales, setVentasMensuales] = useState<{mes:string,total:number}[]>([]);
  const [productosTop, setProductosTop] = useState<{nombre:string,total:number}[]>([]);

  const [totalesDashboard, setTotalesDashboard] = useState<{neto:number,iva:number,total:number,nNotas:number}>({
    neto:0, iva:0, total:0, nNotas:0
  });

  useEffect(() => {
    cargarNotas();
  }, []);

  useEffect(() => {
    calcularDashboard();
  }, [notas, mesFiltro, clienteFiltro, productoFiltro]);

  const cargarNotas = async () => {
    setLoading(true);
    try {
      const res = await api.get("/cotizaciones");
      const notasFiltradas: NotaDeVenta[] = res.data.filter((c: NotaDeVenta) => c.tipo === "nota");
      setNotas(notasFiltradas);

      // clientes únicos
      const clientesSet = new Set<string>();
      notasFiltradas.forEach((n: NotaDeVenta) => clientesSet.add(n.cliente));
      setClientesDisponibles(Array.from(clientesSet));

      // productos únicos
      const productosSet = new Set<string>();
      notasFiltradas.forEach((n: NotaDeVenta) =>
        n.productos.forEach((p: Producto) => productosSet.add(p.nombre))
      );
      setProductosDisponibles(Array.from(productosSet));

    } catch (err) {
      console.error("Error al cargar notas de venta", err);
    } finally {
      setLoading(false);
    }
  };

  const notasFiltradas = notas.filter((nota: NotaDeVenta) => {
    if (mesFiltro && nota.fechaEntrega.slice(0,7)!==mesFiltro) return false;
    if (clienteFiltro && nota.cliente!==clienteFiltro) return false;
    if (productoFiltro && !nota.productos.some((p: Producto)=>p.nombre===productoFiltro)) return false;
    return true;
  });

  const calcularDashboard = () => {
    // Totales
    let neto = 0, iva=0, total=0;
    notasFiltradas.forEach((nota: NotaDeVenta)=>{
      if(!nota.anulada){
        const totalNota = nota.productos.reduce((acc,p)=>acc + Number(p.cantidad)*Number(p.precio),0);
        const ivaNota = Math.round(totalNota*0.19);
        neto += totalNota;
        iva += ivaNota;
        total += totalNota+ivaNota;
      }
    });
    setTotalesDashboard({
      neto, iva, total, nNotas:notasFiltradas.length
    });

    // Ventas por mes
    const ventasPorMes:Record<string,number>={};
    notasFiltradas.forEach((nota: NotaDeVenta)=>{
      const mes = nota.fechaEntrega.slice(0,7);
      const totalNota = nota.productos.reduce((acc,p)=>acc + Number(p.cantidad)*Number(p.precio),0);
      ventasPorMes[mes] = (ventasPorMes[mes]||0)+totalNota;
    });
    setVentasMensuales(Object.entries(ventasPorMes).map(([mes,total])=>({mes,total})));

    // Top productos
    const productosMap:Record<string,number>={};
    notasFiltradas.forEach((nota: NotaDeVenta)=>{
      nota.productos.forEach((p: Producto)=>{
        productosMap[p.nombre] = (productosMap[p.nombre]||0)+ Number(p.cantidad)*Number(p.precio);
      });
    });
    const top = Object.entries(productosMap)
      .map(([nombre,total])=>({nombre,total}))
      .sort((a,b)=>b.total - a.total)
      .slice(0,5);
    setProductosTop(top);
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen flex flex-col gap-6">
      <h2 className="text-3xl font-semibold text-gray-800">Dashboard de Ventas</h2>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg font-semibold mb-2">Ventas por Mes</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ventasMensuales}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(value:number)=>value.toLocaleString("es-CL")} />
              <Bar dataKey="total" fill="#4f46e5" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg font-semibold mb-2">Top 5 Productos</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={productosTop} dataKey="total" nameKey="nombre" outerRadius={80} label={(entry)=>entry.nombre}>
                {productosTop.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={["#10b981","#3b82f6","#f59e0b","#ef4444","#8b5cf6"][index % 5]} />
                ))}
              </Pie>
              <Tooltip formatter={(value:number)=>value.toLocaleString("es-CL")} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 flex-wrap">
        <div>
          <label className="mr-2 font-medium text-gray-700">Mes:</label>
          <input type="month" value={mesFiltro} onChange={e=>setMesFiltro(e.target.value)} className="border rounded px-2 py-1"/>
        </div>
        <div>
          <label className="mr-2 font-medium text-gray-700">Cliente:</label>
          <select value={clienteFiltro} onChange={e=>setClienteFiltro(e.target.value)} className="border rounded px-2 py-1">
            <option value="">Todos</option>
            {clientesDisponibles.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="mr-2 font-medium text-gray-700">Producto:</label>
          <select value={productoFiltro} onChange={e=>setProductoFiltro(e.target.value)} className="border rounded px-2 py-1">
            <option value="">Todos</option>
            {productosDisponibles.map(p=><option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* Tabla de notas */}
      {loading ? (
        <p>Cargando notas de venta...</p>
      ) : (
        <div className="relative overflow-x-auto">
          <table className="w-full text-left border-collapse table-auto">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr>
                <th className="p-3 border-b">Cliente</th>
                <th className="p-3 border-b">Fecha Entrega</th>
                <th className="p-3 border-b">Productos</th>
                <th className="p-3 border-b">Neto</th>
                <th className="p-3 border-b">IVA</th>
                <th className="p-3 border-b">Total</th>
                <th className="p-3 border-b">Estado</th>
              </tr>
            </thead>
            <tbody>
              {notasFiltradas.map((nota: NotaDeVenta)=>{
                const neto = nota.productos.reduce((acc,p)=>acc + Number(p.cantidad)*Number(p.precio),0);
                const iva = Math.round(neto*0.19);
                const total = neto + iva;
                return (
                  <tr key={nota._id} className={`${nota.anulada?"bg-red-50":"bg-white"}`}>
                    <td className="p-2 border-b">{nota.cliente}</td>
                    <td className="p-2 border-b">{nota.fechaEntrega}</td>
                    <td className="p-2 border-b">{nota.productos.map(p=>`${p.nombre}(${p.cantidad})`).join(", ")}</td>
                    <td className="p-2 border-b">${neto.toLocaleString("es-CL")}</td>
                    <td className="p-2 border-b">${iva.toLocaleString("es-CL")}</td>
                    <td className="p-2 border-b">${total.toLocaleString("es-CL")}</td>
                    <td className="p-2 border-b">{nota.anulada?"Anulada":"Activa"}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot className="bg-gray-100 sticky bottom-0 z-10">
              <tr>
                <td colSpan={3} className="p-3 font-bold text-right">Totales:</td>
                <td className="p-3 font-bold">${totalesDashboard.neto.toLocaleString("es-CL")}</td>
                <td className="p-3 font-bold">${totalesDashboard.iva.toLocaleString("es-CL")}</td>
                <td className="p-3 font-bold">${totalesDashboard.total.toLocaleString("es-CL")}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
