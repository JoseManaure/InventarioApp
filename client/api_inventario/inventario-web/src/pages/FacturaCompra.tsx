// src/pages/FacturaCompra.tsx
import { useState, useEffect } from "react";
import api from "../api/api";

interface ProductoFactura {
  nombre: string;
  cantidad: number;
  precioUnitario: number;
}

interface ItemCatalogo {
  _id: string;
  nombre: string;
  precio: number;
}

export default function FacturaCompra() {
  const [numero, setNumero] = useState("");
  const [proveedor, setProveedor] = useState("");
  const [fechaCreacion, setFechaCreacion] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [productos, setProductos] = useState<ProductoFactura[]>([
    { nombre: "", cantidad: 0, precioUnitario: 0 },
  ]);

  const [catalogo, setCatalogo] = useState<ItemCatalogo[]>([]);
  const [guardando, setGuardando] = useState(false);

  // 🔹 Traer catálogo de productos
  useEffect(() => {
    const fetchCatalogo = async () => {
      try {
        const res = await api.get("/items", { params: { limit: 1000 } }); // traemos todos
        setCatalogo(res.data.items);
      } catch (err) {
        console.error("Error cargando catálogo", err);
      }
    };
    fetchCatalogo();
  }, []);

  const actualizarProducto = (
    index: number,
    campo: keyof ProductoFactura,
    valor: string | number
  ) => {
    const copia = [...productos];
    (copia[index] as any)[campo] = valor;

    // Si selecciona nombre desde catálogo → traer precio sugerido
    if (campo === "nombre") {
      const item = catalogo.find((c) => c.nombre === valor);
      if (item) {
        copia[index].precioUnitario = item.precio;
      }
    }

    setProductos(copia);
  };

  const agregarFila = () => {
    setProductos([
      ...productos,
      { nombre: "", cantidad: 0, precioUnitario: 0 },
    ]);
  };

  const guardarFactura = async () => {
    setGuardando(true);
    try {
      const payload = {
        numero,
        proveedor,
        fechaCreacion,
        productos,
      };
      await api.post("/facturas", payload);
      alert("✅ Factura guardada con éxito");
      // reset
      setNumero("");
      setProveedor("");
      setProductos([{ nombre: "", cantidad: 0, precioUnitario: 0 }]);
    } catch (err) {
      console.error(err);
      alert("❌ Error guardando factura");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">📥 Recepción de Factura</h2>

      <div className="mb-2">
        <label className="block">Número de Factura</label>
        <input
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
          className="border p-1 w-full"
        />
      </div>

      <div className="mb-2">
        <label className="block">Proveedor</label>
        <input
          value={proveedor}
          onChange={(e) => setProveedor(e.target.value)}
          className="border p-1 w-full"
        />
      </div>

      <div className="mb-2">
        <label className="block">Fecha</label>
        <input
          type="date"
          value={fechaCreacion}
          onChange={(e) => setFechaCreacion(e.target.value)}
          className="border p-1"
        />
      </div>

      <h3 className="font-semibold mt-4 mb-2">Productos</h3>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-1">Producto</th>
            <th className="border p-1">Cantidad</th>
            <th className="border p-1">Precio Unitario</th>
          </tr>
        </thead>
        <tbody>
          {productos.map((p, i) => (
            <tr key={i}>
              <td className="border p-1">
                <select
                  value={p.nombre}
                  onChange={(e) =>
                    actualizarProducto(i, "nombre", e.target.value)
                  }
                  className="border p-1 w-full"
                >
                  <option value="">-- Seleccione --</option>
                  {catalogo.map((c) => (
                    <option key={c._id} value={c.nombre}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </td>
              <td className="border p-1">
                <input
                  type="number"
                  value={p.cantidad}
                  onChange={(e) =>
                    actualizarProducto(i, "cantidad", Number(e.target.value))
                  }
                  className="border p-1 w-full"
                />
              </td>
              <td className="border p-1">
                <input
                  type="number"
                  value={p.precioUnitario}
                  onChange={(e) =>
                    actualizarProducto(
                      i,
                      "precioUnitario",
                      Number(e.target.value)
                    )
                  }
                  className="border p-1 w-full"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        onClick={agregarFila}
        className="mt-2 px-3 py-1 bg-blue-500 text-white rounded"
      >
        ➕ Agregar Producto
      </button>

      <div className="mt-4">
        <button
          disabled={guardando}
          onClick={guardarFactura}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          {guardando ? "Guardando..." : "💾 Guardar Factura"}
        </button>
      </div>
    </div>
  );
}
