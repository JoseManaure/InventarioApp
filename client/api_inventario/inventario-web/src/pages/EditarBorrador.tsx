import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import { generarGuiaPDF } from "../utils/pdf";


interface Producto {
  id: string;
  nombre?: string;
  itemName?: string;
  cantidad: number;
  precio: number;
}

type ProductoPDF = Producto & { total: number };

export default function EditarBorrador() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [cliente, setCliente] = useState("");
  const [direccion, setDireccion] = useState("");
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [productos, setProductos] = useState<Producto[]>([]);
  const [metodoPago, setMetodoPago] = useState("");
  const [tipoDocumento] = useState("cotizacion");
  const [rutCliente, setRutCliente] = useState("");
  const [giroCliente, setGiroCliente] = useState("");
  const [direccionCliente, setDireccionCliente] = useState("");
  const [comunaCliente, setComunaCliente] = useState("");
  const [ciudadCliente, setCiudadCliente] = useState("");
  const [atencion, setAtencion] = useState("");
  const [emailCliente, setEmailCliente] = useState("");
  const [telefonoCliente, setTelefonoCliente] = useState("");

  useEffect(() => {
    const fetchBorrador = async () => {
      try {
        const res = await api.get(`/cotizaciones/borrador/${id}`);
        const data = res.data;

        setCliente(data.cliente);
        setDireccion(data.direccion);
        setFechaEntrega(data.fechaEntrega);
        setMetodoPago(data.metodoPago);
        setProductos(data.productos);
        setRutCliente(data.rutCliente);
        setGiroCliente(data.giroCliente);
        setDireccionCliente(data.direccionCliente);
        setComunaCliente(data.comunaCliente);
        setCiudadCliente(data.ciudadCliente);
        setAtencion(data.atencion);
        setEmailCliente(data.emailCliente);
        setTelefonoCliente(data.telefonoCliente);
      } catch (err) {
        console.error(err);
        alert("❌ Error al cargar borrador");
      }
    };

    if (id) fetchBorrador();
  }, [id]);

  const actualizarProducto = (
    index: number,
    campo: keyof Producto,
    valor: string | number
  ) => {
    const nuevos = [...productos];
    if (campo === "cantidad" || campo === "precio") {
      nuevos[index][campo] = Number(valor);
    } else {
      // @ts-ignore
      nuevos[index][campo] = valor;
    }
    setProductos(nuevos);
  };

  const eliminarProducto = (index: number) => {
    const nuevos = productos.filter((_, i) => i !== index);
    setProductos(nuevos);
  };

  // Función para generar PDF que adapta Producto[] a ProductoPDF[]
  const generarPDFConTotales = () => {
    const productosPDF: ProductoPDF[] = productos.map((p) => ({
      ...p,
      total: p.cantidad * p.precio,
    }));

    return generarGuiaPDF(cliente, productosPDF, {
      fechaEntrega,
      metodoPago,
      tipoDocumento,
      rutCliente,
      numeroDocumento: "", // Este dato lo llenarás después
      giroCliente,
      direccionCliente,
      comunaCliente,
      ciudadCliente,
      atencion,
      emailCliente,
      telefonoCliente,
      tipo: "cotizacion",
      direccion,
    });
  };

  const guardarComoCotizacion = async () => {
    try {
      if (!id) {
        alert("ID de borrador no encontrado");
        return;
      }

      // Llamamos a la ruta para convertir borrador a cotización
      const res = await api.post(`/cotizaciones/desde-borrador/${id}`);

      // Generamos el PDF con el número asignado en la respuesta
      const pdfBlob = generarPDFConTotales();

      // Subimos el PDF generado
      const fd = new FormData();
      fd.append("file", new File([pdfBlob], "doc.pdf", { type: "application/pdf" }));
      fd.append("cotizacionId", res.data._id);
      await api.post("/cotizaciones/upload-pdf", fd);

      alert("✅ Cotización creada desde borrador");
      navigate("/ver-cotizaciones");
    } catch (err) {
      console.error(err);
      alert("❌ Error al guardar cotización");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Editar borrador</h1>

      {/* Datos generales */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <input
          value={cliente}
          onChange={(e) => setCliente(e.target.value)}
          placeholder="Cliente"
          className="border p-2"
        />
        <input
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
          placeholder="Dirección"
          className="border p-2"
        />
        <input
          value={fechaEntrega}
          onChange={(e) => setFechaEntrega(e.target.value)}
          type="date"
          className="border p-2"
        />
        <input
          value={metodoPago}
          onChange={(e) => setMetodoPago(e.target.value)}
          placeholder="Método de pago"
          className="border p-2"
        />
      </div>

      {/* Tabla de productos */}
      <table className="table-auto w-full border mb-4">
        <thead className="bg-gray-200">
          <tr>
            <th className="border px-2 py-1">Producto</th>
            <th className="border px-2 py-1">Cantidad</th>
            <th className="border px-2 py-1">Precio</th>
            <th className="border px-2 py-1">Subtotal</th>
            <th className="border px-2 py-1">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {productos.map((p, i) => (
            <tr key={i}>
              <td className="border px-2 py-1">{p.nombre || p.itemName}</td>
              <td className="border px-2 py-1">
                <input
                  type="number"
                  value={p.cantidad}
                  onChange={(e) =>
                    actualizarProducto(i, "cantidad", parseInt(e.target.value))
                  }
                  className="border p-1 w-20"
                />
              </td>
              <td className="border px-2 py-1">
                <input
                  type="number"
                  value={p.precio}
                  onChange={(e) =>
                    actualizarProducto(i, "precio", parseFloat(e.target.value))
                  }
                  className="border p-1 w-24"
                />
              </td>
              <td className="border px-2 py-1">
                ${(p.cantidad * p.precio).toLocaleString()}
              </td>
              <td className="border px-2 py-1 text-center">
                <button
                  onClick={() => eliminarProducto(i)}
                  className="bg-red-500 text-white px-2 py-1 rounded"
                >
                  X
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Botón para guardar */}
      <button
        onClick={guardarComoCotizacion}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Guardar como Cotización
      </button>
    </div>
  );
}
