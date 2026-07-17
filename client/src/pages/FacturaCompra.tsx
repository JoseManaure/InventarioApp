// src/pages/FacturaCompra.tsx
import { useState, useEffect, useMemo } from "react";
import api from "../api/api";

interface ProductoFactura {
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  codigo: string;
  costo?: number;
}

interface ItemCatalogo {
  _id: string;
  nombre: string;
  precio: number;
  codigo: string;
  costo?: number;
}

interface Proveedor {
  _id: string;
  nombre: string;
  rut: string;
  direccion: string;
  telefono: string;
  email: string;
  contacto: string;
  observaciones: string;
}

export default function FacturaCompra() {
  const [proveedor, setProveedor] = useState("");
  const [proveedorId, setProveedorId] = useState("");

  const [rut, setRut] = useState("");
  const [direccion, setDireccion] = useState("");

  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [contacto, setContacto] = useState("");

  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState("factura");

  const [productos, setProductos] = useState<ProductoFactura[]>([
    { nombre: "", cantidad: 0, precioUnitario: 0, codigo: "", costo: 0 },
  ]);

  const [catalogo, setCatalogo] = useState<ItemCatalogo[]>([]);
  const [sugerencias, setSugerencias] = useState<ItemCatalogo[]>([]);
  const [buscandoIndex, setBuscandoIndex] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);


  interface Proveedor {
    _id: string;
    nombre: string;
    rut: string;
    direccion: string;
    telefono: string;
    email: string;
    contacto: string;
    observaciones: string;
  }
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [mostrarProveedores, setMostrarProveedores] = useState(false);
  // 🔹 Calcular totales con useMemo (una sola pasada)
  const { subtotal, iva, total } = useMemo(() => {
    let subtotalCalc = 0;
    let ivaCalc = 0;

    for (const p of productos) {
      const totalProducto = p.cantidad * p.precioUnitario;
      subtotalCalc += totalProducto;
      ivaCalc += totalProducto * 0.19;
    }

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


  const buscarProductos = async (query: string, index: number) => {
    if (!query.trim()) {
      setSugerencias([]);
      return;
    }

    try {
      const res = await api.get(`/items/buscar?q=${query}`);

      setSugerencias(res.data || []);
      setBuscandoIndex(index);

    } catch (err) {
      console.error(err);
    }
  };
  const buscarProveedores = async (query: string) => {

    if (!query.trim()) {
      setProveedores([]);
      return;
    }

    try {

      const res = await api.get("/proveedores", {
        params: {
          search: query
        }
      });

      setProveedores(res.data);

    } catch (error) {

      console.error(error);

    }

  };

  const actualizarProducto = (
    index: number,
    campo: keyof ProductoFactura,
    valor: string | number
  ) => {
    const copia = [...productos];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (copia[index] as any)[campo] = valor;

    // Si selecciona nombre desde catálogo → traer precio y código
    if (campo === "nombre") {
      const item = catalogo.find((c) => c.nombre === valor);
      if (item) {
        copia[index].precioUnitario = item.costo || 0;

        copia[index].codigo = item.codigo;

        copia[index].costo = item.precio || 0;
      } else {
        copia[index].codigo = "";
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (copia[index] as any).costo = 0;
      }
    }

    setProductos(copia);
  };
  const actualizarCodigoProducto = async (index: number, valor: string) => {
    const copia = [...productos];

    copia[index].codigo = valor;

    setProductos(copia);

    if (!valor.trim()) return;

    try {
      const res = await api.get(`/items/buscar?q=${valor}`);

      const item = res.data?.[0];

      if (item) {
        copia[index] = {
          ...copia[index],

          nombre: item.nombre,

          codigo: item.codigo,

          // 👇 costo compra
          precioUnitario: item.costo || 0,

          // 👇 precio venta
          costo: item.precio || 0,
        };

        setProductos([...copia]);
      }

    } catch (err) {
      console.error(err);
    }
  };

  const agregarFila = () => {
    setProductos([
      ...productos,
      { nombre: "", cantidad: 0, precioUnitario: 0, codigo: "", costo: 0 },
    ]);
  };

  const guardarFactura = async () => {
    setGuardando(true);

    for (const p of productos) {
      if (!p.nombre || !p.codigo || p.cantidad <= 0 || p.precioUnitario <= 0) {
        alert(
          "Todos los productos deben tener nombre, código, cantidad y precio mayor a 0"
        );
        setGuardando(false);
        return;
      }
    }

    const productosPayload = productos.map(p => ({
      ...p,
      costo: p.costo ?? 0, // si es null o undefined → 0
    }));

    try {
      const payload = {
        proveedor: proveedorId,

        nombreProveedor: proveedor,

        rut,

        direccion,

        telefono,

        email,

        contacto,

        numeroDocumento,

        tipoDocumento,

        productos: productosPayload
      };
      await api.post("/facturas", payload);
      alert("✅ Factura guardada con éxito");
      console.log("👉 Enviando factura:", payload);
      // reset
      setProveedor("");
      setProveedorId("");
      setRut("");
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

      <div className="max-w-7xl mx-auto p-6">

        {/* HEADER */}
        <div className="mb-8">

          <h1 className="
          text-3xl font-bold tracking-tight
        ">
            Recepción de Factura
          </h1>

          <p className="
          text-gray-500 mt-2
        ">
            Gestiona compras, productos y recepción de mercadería.
          </p>

        </div>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* LEFT */}
          <div className="lg:col-span-2 space-y-6">

            {/* EMPRESA */}
            <div className="
            bg-white dark:bg-gray-950
  
            border border-gray-200 dark:border-gray-800
  
            rounded-3xl
  
            p-6
  
            shadow-sm
          ">

              <h2 className="
              text-lg font-semibold mb-6
            ">
                Datos proveedor
              </h2>

              <div className="
              grid md:grid-cols-2 gap-4
            ">

                <div className="relative">

                  <input
                    value={proveedor}
                    onChange={(e) => {

                      setProveedor(e.target.value);

                      setProveedorId("");

                      buscarProveedores(e.target.value);

                      setMostrarProveedores(true);

                    }}
                    placeholder="Proveedor"
                    className="
    w-full
    h-12
    px-4
    rounded-2xl
    border border-gray-200
    dark:border-gray-700
    bg-white dark:bg-gray-900
    outline-none
    focus:ring-2
    focus:ring-amber-400
  "
                  />

                  {
                    mostrarProveedores &&
                    proveedores.length > 0 && (

                      <div className="
      absolute
      z-50
      w-full
      mt-2
      bg-white
      rounded-2xl
      shadow-xl
      border
    ">

                        {
                          proveedores.map((p) => (
                            <button
                              key={p._id}
                              type="button"
                              className="
        w-full
        text-left
        px-4
        py-3
        hover:bg-gray-100
      "
                              onClick={() => {

                                setProveedorId(p._id);
                                setProveedor(p.nombre);
                                setRut(p.rut);
                                setDireccion(p.direccion);
                                setMostrarProveedores(false);

                              }}
                            >

                              <div className="font-medium">
                                {p.nombre}
                              </div>

                              <div className="text-sm text-gray-500">
                                {p.rut}
                              </div>

                            </button>
                          ))
                        }

                      </div>

                    )
                  }

                </div>

                <input
                  value={rut}
                  onChange={(e) => setRut(e.target.value)}
                  placeholder="RUT"
                  className="
                  h-12 px-4 rounded-2xl
                  border border-gray-200 dark:border-gray-700
                  bg-white dark:bg-gray-900
                  outline-none
                  focus:ring-2 focus:ring-amber-400
                "
                />


                <input
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Dirección"
                  className="
                  h-12 px-4 rounded-2xl
                  border border-gray-200 dark:border-gray-700
                  bg-white dark:bg-gray-900
                  outline-none
                  focus:ring-2 focus:ring-amber-400
                "
                />

                <input
                  value={numeroDocumento}
                  onChange={(e) => setNumeroDocumento(e.target.value)}
                  placeholder="Número documento"
                  className="
                  h-12 px-4 rounded-2xl
                  border border-gray-200 dark:border-gray-700
                  bg-white dark:bg-gray-900
                  outline-none
                  focus:ring-2 focus:ring-amber-400
                "
                />

                <select
                  value={tipoDocumento}
                  onChange={(e) => setTipoDocumento(e.target.value)}
                  className="
                  h-12 px-4 rounded-2xl
                  border border-gray-200 dark:border-gray-700
                  bg-white dark:bg-gray-900
                  outline-none
                  focus:ring-2 focus:ring-amber-400
                "
                >
                  <option value="factura">
                    Factura
                  </option>

                  <option value="boleta">
                    Boleta
                  </option>

                  <option value="guia">
                    Guía
                  </option>

                </select>

              </div>

            </div>

            {/* PRODUCTOS */}
            <div className="
            bg-white dark:bg-gray-950
  
            border border-gray-200 dark:border-gray-800
  
            rounded-3xl
  
            p-6
  
            shadow-sm
          ">

              <div className="
              flex items-center justify-between mb-6
            ">

                <div>

                  <h2 className="
                  text-lg font-semibold
                ">
                    Productos
                  </h2>

                  <p className="
                  text-sm text-gray-500 mt-1
                ">
                    Agrega productos a la factura
                  </p>

                </div>

                <button
                  onClick={agregarFila}
                  className="
                  px-4 h-11
  
                  rounded-2xl
  
                  bg-slate-900
                  hover:bg-slate-800
  
                  text-white
  
                  text-sm font-medium
  
                  transition-all
                "
                >
                  + Agregar
                </button>

              </div>

              <div className="space-y-4">

                {productos.map((p, i) => (

                  <div
                    key={i}
                    className="
                    border border-gray-200
                    dark:border-gray-800
  
                    rounded-3xl
  
                    p-5
  
                    bg-gray-50/60
                    dark:bg-gray-900/50
                  "
                  >

                    <div className="
                    grid md:grid-cols-5 gap-4
                  ">

                      {/* PRODUCTO */}
                      <div className="md:col-span-2 relative">

                        <input
                          type="text"
                          value={p.nombre}
                          onChange={(e) => {
                            actualizarProducto(i, "nombre", e.target.value);
                            buscarProductos(e.target.value, i);
                          }}
                          placeholder="Buscar producto..."
                          className="
                          w-full h-12 px-4
  
                          rounded-2xl
  
                          border border-gray-200
                          dark:border-gray-700
  
                          bg-white dark:bg-gray-900
  
                          outline-none
  
                          focus:ring-2
                          focus:ring-amber-400
                        "
                        />

                        {buscandoIndex === i &&
                          sugerencias.length > 0 && (

                            <div className="
                          absolute z-50 mt-2
  
                          w-full
  
                          rounded-2xl
  
                          border border-gray-200
                          dark:border-gray-700
  
                          bg-white dark:bg-gray-900
  
                          shadow-2xl
  
                          overflow-hidden
                        ">

                              {sugerencias.map((item) => (

                                <button
                                  key={item._id}
                                  type="button"
                                  onClick={() => {

                                    const copia = [...productos];

                                    copia[i] = {
                                      ...copia[i],

                                      nombre: item.nombre,

                                      codigo: item.codigo,

                                      // costo compra histórico
                                      precioUnitario: item.costo || 0,

                                      // precio venta actual
                                      costo: item.precio || 0,
                                    };

                                    setProductos(copia);

                                    setSugerencias([]);
                                    setBuscandoIndex(null);
                                  }}

                                  className="
                                w-full text-left
  
                                px-4 py-3
  
                                hover:bg-gray-100
                                dark:hover:bg-gray-800
  
                                transition-colors
                              "
                                >

                                  <div className="font-medium">
                                    {item.nombre}
                                  </div>

                                  <div className="
                                text-xs text-gray-500 mt-1
                              ">
                                    {item.codigo}
                                  </div>

                                </button>

                              ))}

                            </div>

                          )}

                      </div>

                      {/* CODIGO */}
                      <input
                        type="text"
                        value={p.codigo}
                        onChange={(e) =>
                          actualizarCodigoProducto(i, e.target.value)
                        }
                        placeholder="Código"
                        className="
                        h-12 px-4 rounded-2xl
                        border border-gray-200 dark:border-gray-700
                        bg-white dark:bg-gray-900
                        outline-none
                        focus:ring-2 focus:ring-amber-400
                      "
                      />

                      {/* CANTIDAD */}
                      <input
                        type="number"
                        value={p.cantidad}
                        onChange={(e) =>
                          actualizarProducto(
                            i,
                            "cantidad",
                            Number(e.target.value)
                          )
                        }
                        placeholder="Cantidad"
                        className="
                        h-12 px-4 rounded-2xl
                        border border-gray-200 dark:border-gray-700
                        bg-white dark:bg-gray-900
                        outline-none
                        focus:ring-2 focus:ring-amber-400
                      "
                      />

                      {/* PRECIO */}
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
                        placeholder="Costo compra"
                        className="
                        h-12 px-4 rounded-2xl
                        border border-gray-200 dark:border-gray-700
                        bg-white dark:bg-gray-900
                        outline-none
                        focus:ring-2 focus:ring-amber-400
                      "
                      />
                      <div className="text-sm text-gray-500">
                        Precio venta actual:
                        <strong>
                          {" "}
                          ${Number(p.costo || 0).toLocaleString()}
                        </strong>
                      </div>
                    </div>

                  </div>

                ))}

              </div>

            </div>

          </div>

          {/* RIGHT */}
          <div>

            <div className="
            sticky top-24
  
            bg-white dark:bg-gray-950
  
            border border-gray-200 dark:border-gray-800
  
            rounded-3xl
  
            p-6
  
            shadow-sm
          ">

              <h2 className="
              text-lg font-semibold mb-6
            ">
                Resumen
              </h2>

              <div className="space-y-4">

                <div className="
                flex items-center justify-between
                text-sm
              ">
                  <span className="text-gray-500">
                    Subtotal
                  </span>

                  <span className="font-medium">
                    ${subtotal.toLocaleString()}
                  </span>
                </div>

                <div className="
                flex items-center justify-between
                text-sm
              ">
                  <span className="text-gray-500">
                    IVA
                  </span>

                  <span className="font-medium">
                    ${iva.toLocaleString()}
                  </span>
                </div>

                <div className="
                border-t border-gray-200
                dark:border-gray-800
                pt-4
              ">

                  <div className="
                  flex items-center justify-between
                ">

                    <span className="
                    text-lg font-semibold
                  ">
                      Total
                    </span>

                    <span className="
                    text-2xl font-bold
                  ">
                      ${total.toLocaleString()}
                    </span>

                  </div>

                </div>

              </div>

              <button
                disabled={guardando}
                onClick={guardarFactura}
                className="
                mt-8
  
                w-full h-12
  
                rounded-2xl
  
                bg-amber-400
                hover:bg-amber-300
  
                text-slate-900
  
                font-semibold
  
                transition-all
              "
              >

                {guardando
                  ? "Guardando..."
                  : "Guardar factura"
                }

              </button>

            </div>

          </div>

        </div>
      </div>
    </div>

  );
}
