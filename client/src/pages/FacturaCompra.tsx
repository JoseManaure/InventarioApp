// src/pages/FacturaCompra.tsx
import { useState, useEffect, useMemo } from "react";
import api from "../api/api";

interface ProductoFactura {
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  codigo: string;
}

interface ItemCatalogo {
  _id: string;
  nombre: string;
  precio: number;
  codigo: string;
}

export default function FacturaCompra() {
  const [empresa, setEmpresa] = useState("");
  const [rut, setRut] = useState("");
  const [rol, setRol] = useState("");
  const [direccion, setDireccion] = useState("");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState("factura");

  const [productos, setProductos] = useState<ProductoFactura[]>([
    { nombre: "", cantidad: 0, precioUnitario: 0, codigo: "" },
  ]);

  const [catalogo, setCatalogo] = useState<ItemCatalogo[]>([]);
  const [guardando, setGuardando] = useState(false);

  // 🔹 Calcular totales con useMemo
  const { subtotal, iva, total } = useMemo(() => {
    const subtotalCalc = productos.reduce(
      (acc, p) => acc + p.cantidad * p.precioUnitario,
      0
    );
    const ivaCalc = subtotalCalc * 0.19;
    return {
      subtotal: subtotalCalc,
      iva: ivaCalc,
      total: subtotalCalc + ivaCalc,
    };
  }, [productos]);

  // 🔹 Traer catálogo de productos
  useEffect(() => {
    const fetchCatalogo = async () => {
      try {
        const res = await api.get("/items", { params: { limit: 1000 } });
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

    // Actualizamos campo
    (copia[index] as any)[campo] = valor;

    // Si selecciona nombre desde catálogo → traer precio sugerido y código
    if (campo === "nombre") {
      const item = catalogo.find((c) => c.nombre === valor);
      if (item) {
        copia[index].precioUnitario = item.precio;
        copia[index].codigo = item.codigo;
      } else {
        // Si no encuentra item, limpiar código
        copia[index].codigo = "";
      }
    }

    setProductos(copia);
  };

  const actualizarCodigoProducto = (index: number, valor: string) => {
    const copia = [...productos];
    copia[index].codigo = valor;

    // Si el código coincide con un item del catálogo, traer nombre y precio
    const item = catalogo.find((c) => c.codigo === valor);
    if (item) {
      copia[index].nombre = item.nombre;
      copia[index].precioUnitario = item.precio;
    }

    setProductos(copia);
  };

  const agregarFila = () => {
    setProductos([
      ...productos,
      { nombre: "", cantidad: 0, precioUnitario: 0, codigo: "" },
    ]);
  };

  const calcularTotalProducto = (p: ProductoFactura) => {
    return p.cantidad * p.precioUnitario;
  };

  const calcularIVAProducto = (p: ProductoFactura) => {
    return calcularTotalProducto(p) * 0.19;
  };

  const guardarFactura = async () => {
    setGuardando(true);

    // Validación básica
    for (const p of productos) {
      if (!p.nombre || !p.codigo || p.cantidad <= 0 || p.precioUnitario <= 0) {
        alert("Todos los productos deben tener nombre, código, cantidad y precio mayor a 0");
        setGuardando(false);
        return;
      }
    }

    try {
      const payload = {
        empresa,
        rut,
        rol,
        direccion,
        numeroDocumento,
        tipoDocumento,
        productos,
      };
      await api.post("/facturas", payload);
      alert("✅ Factura guardada con éxito");

      // reset
      setEmpresa("");
      setRut("");
      setRol("");
      setDireccion("");
      setNumeroDocumento("");
      setTipoDocumento("factura");
      setProductos([{ nombre: "", cantidad: 0, precioUnitario: 0, codigo: "" }]);
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

      {/* Datos Empresa */}
      <div className="mb-2">
        <label className="block">Empresa</label>
        <input
          value={empresa}
          onChange={(e) => setEmpresa(e.target.value)}
          className="border p-1 w-full"
        />
      </div>

      <div className="mb-2">
        <label className="block">RUT</label>
        <input
          value={rut}
          onChange={(e) => setRut(e.target.value)}
          className="border p-1 w-full"
        />
      </div>

      <div className="mb-2">
        <label className="block">Rol</label>
        <input
          value={rol}
          onChange={(e) => setRol(e.target.value)}
          className="border p-1 w-full"
        />
      </div>

      <div className="mb-2">
        <label className="block">Dirección</label>
        <input
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
          className="border p-1 w-full"
        />
      </div>

      {/* Documento */}
      <div className="mb-2">
        <label className="block">Número de Documento</label>
        <input
          value={numeroDocumento}
          onChange={(e) => setNumeroDocumento(e.target.value)}
          className="border p-1 w-full"
        />
      </div>

      <div className="mb-2">
        <label className="block">Tipo de Documento</label>
        <select
          value={tipoDocumento}
          onChange={(e) => setTipoDocumento(e.target.value)}
          className="border p-1 w-full"
        >
          <option value="factura">Factura</option>
          <option value="boleta">Boleta</option>
          <option value="guia">Guía</option>
        </select>
      </div>

      {/* Productos */}
      <h3 className="font-semibold mt-4 mb-2">Productos</h3>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-1">Producto</th>
            <th className="border p-1">Cantidad</th>
            <th className="border p-1">Precio Unitario</th>
            <th className="border p-1">Código</th>
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
              <td className="border p-1">
                <input
                  type="text"
                  value={p.codigo}
                  onChange={(e) => actualizarCodigoProducto(i, e.target.value)}
                  className="border p-1 w-full"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        onClick={agregarFila}
        className="mt-2 px-3 py
        -1 bg-blue-500 text-white rounded"
      >
        ➕ Agregar Producto
      </button>

      {/* Resumen */}
      <div className="mt-6 border-t pt-4">
        <div className="flex justify-between">
          <span className="font-semibold">Subtotal:</span>
          <span>${subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">IVA (19%):</span>
          <span>${iva.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-lg font-bold mt-2">
          <span>Total:</span>
          <span>${total.toLocaleString()}</span>
        </div>
      </div>

      {/* Guardar */}
      <div className="mt-6">
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
