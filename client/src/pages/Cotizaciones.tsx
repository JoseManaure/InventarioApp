import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { generarGuiaPDF } from '../utils/pdf';
import api from '../api/api';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";

import BuscadorProductos from '../components/BuscadorProductos';
import FormularioCliente from '../components/FormularioCliente';
import { useCotizacion } from '../hooks/useCotizacion';

export default function Cotizaciones() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    cliente, setCliente,
    clienteId,
    setClienteId,
    rutCliente, setRutCliente,
    direccion, setDireccion,
    fechaEntrega, setFechaEntrega,
    metodoPago, setMetodoPago,
    tipo, setTipo,
    selectedItems,
    agregarItem,
    handleCantidadChange,
    handlePrecioChange,
    eliminarProducto,
    calcularResumen,
    giroCliente, setGiroCliente,
    direccionCliente, setDireccionCliente,
    comunaCliente, setComunaCliente,
    ciudadCliente, setCiudadCliente,
    atencion, setAtencion,
    emailCliente, setEmailCliente,
    telefonoCliente, setTelefonoCliente,
    formaPago, setFormaPago,
    nota, setNota
  } = useCotizacion(id);

  const [busqueda, setBusqueda] = useState('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showModalCliente, setShowModalCliente] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [correlativo, setCorrelativo] = useState<number | null>(null);
  const resumen = calcularResumen
    ? calcularResumen()
    : { seleccionados: [], subtotal: 0, iva: 0, total: 0 };
  const { seleccionados, subtotal, iva, total } = resumen;

  // Funciones para crear/actualizar cotización
  const fetchCrearCotizacion = async (data: any) => {
    const res = await api.post('/cotizaciones', data);
    return res.data;
  };

  const fetchActualizarCotizacion = async (id: string, data: any) => {
    const res = await api.put(`/cotizaciones/${id}`, data);
    return res.data;
  };

  const guardarBorrador = async () => {
    try {
      await fetchCrearCotizacion({ estado: 'borrador' });
      alert('✅ Borrador guardado');
      navigate("/ver-borradores");
    } catch {
      alert('❌ Error al guardar borrador');
    }
  };

  const enviarCotizacion = async () => {
    if (enviando) return;
    setEnviando(true);

    try {
      console.log("FRONTEND FORMA PAGO:", formaPago);
      console.log("FRONTEND NOTA:", nota);
      const data = {
        cliente,
        clienteId,

        direccion,
        rutCliente,
        giroCliente,
        direccionCliente,
        comunaCliente,
        ciudadCliente,
        atencion,
        emailCliente,
        telefonoCliente,

        formaPago,
        nota,

        fechaHoy: new Date().toLocaleDateString(),
        fechaEntrega,
        metodoPago,
        tipo,

        productos: seleccionados.map(p => ({
          itemId: p.id.toString(),
          cantidad: p.cantidad,
          unidad: p.unidad,
          nombre: p.nombre,
          precio: p.precio,
          total: p.total
        }))
      };

      let res;
      if (id) res = await fetchActualizarCotizacion(id, data);
      else res = await fetchCrearCotizacion(data);

      setCorrelativo(res.cotizacion.numero);

      const pdfBlob = generarGuiaPDF(cliente, seleccionados, {
        fechaEntrega,
        metodoPago,
        tipoDocumento: tipo,
        numeroDocumento: res.cotizacion.numero,
        rutCliente,
        giroCliente,
        direccionCliente,
        comunaCliente,
        ciudadCliente,
        atencion,
        emailCliente,
        telefonoCliente,
        tipo,
        direccion,
        formaPago,
        nota
      });

      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      setShowPdfModal(true);

      const fd = new FormData();
      fd.append(
        'file',
        new File(
          [pdfBlob],
          `cotizacion-${res.cotizacion.numero}.pdf`,
          { type: 'application/pdf' }
        )
      );
      fd.append('cotizacionId', res.cotizacion._id);
      const uploadRes = await api.post(
        '/cotizaciones/upload-pdf',
        fd,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setPdfUrl(
        `${import.meta.env.VITE_API_URL}${uploadRes.data.pdfUrl}`
      );

      alert('✅ Cotización creada/actualizada');
    } catch (err) {
      console.error(err);
      alert('❌ Error al crear/actualizar');
    }

    setEnviando(false);
  };

  const enviarWhatsapp = () => {
    if (!telefonoCliente) {
      alert("⚠️ El cliente no tiene número de teléfono");
      return;
    }

    const numero = telefonoCliente.replace(/\s+/g, "");

    const linkPDF = pdfUrl || "PDF no disponible";

    const mensaje = `Hola ${cliente}, te envío la ${tipo === "nota" ? "nota de venta" : "cotización"
      } N°${correlativo ?? "pendiente"}.
  
  Total: $${total.toLocaleString("es-CL")}
  Forma de pago: ${metodoPago}
  Fecha de entrega: ${fechaEntrega || "Por confirmar"}
  
  Puedes descargar el documento aquí:
  ${linkPDF}
  
  ¡Gracias por tu preferencia!`;

    const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;

    window.open(url, "_blank");
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-200 p-1">

      <div className="
        h-full
        flex
        flex-col
        bg-white
        border
        border-slate-400
        rounded-md
        shadow-lg
        overflow-hidden
      ">

        {/* HEADER */}
        <div className="
          border-b
          border-slate-300
          px-4
          py-2
          flex
          items-start
          justify-between
        ">

          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-800">
              ARIDOS SERGIO SILVA
            </h1>

            <p className="text-[11px] text-slate-500 leading-4">
              Venta de áridos y materiales
            </p>

            <p className="text-[11px] text-slate-500 leading-4">
              Santiago, Chile
            </p>
          </div>

          <div className="
            border-2
            border-red-500
            rounded-md
            px-4
            py-2
            text-center
            min-w-[180px]
          ">

            <p className="text-red-600 font-bold text-sm">
              R.U.T: 5.586.794-1
            </p>

            <h2 className="text-lg font-bold text-red-600 leading-5 mt-1">
              {tipo === "nota"
                ? "NOTA DE VENTA"
                : "COTIZACIÓN"}
            </h2>

            <p className="text-xs mt-1">
              N°
              <span className="font-bold ml-1">
                {correlativo || "----"}
              </span>
            </p>

          </div>

        </div>

        {/* CLIENTE */}
        <div className="
          border-b
          border-slate-300
          px-4
          py-2
        ">

          <div className="
            flex
            items-center
            justify-between
            mb-2
          ">

            <h3 className="text-sm font-bold text-slate-700">
              CLIENTE
            </h3>

            <button
              onClick={() => setShowModalCliente(true)}
              className="
                bg-blue-600
                hover:bg-blue-700
                text-white
                px-3
                py-1
                rounded-md
                text-xs
              "
            >
              Editar
            </button>

          </div>

          <div className="
            grid
            grid-cols-6
            gap-x-3
            gap-y-1
            text-[11px]
          ">

            <div>
              <span className="font-semibold text-slate-500">
                Cliente
              </span>

              <p className="truncate">
                {cliente || "-"}
              </p>
            </div>

            <div>
              <span className="font-semibold text-slate-500">
                RUT
              </span>

              <p>{rutCliente || "-"}</p>
            </div>

            <div>
              <span className="font-semibold text-slate-500">
                Entrega
              </span>

              <p>{fechaEntrega || "-"}</p>
            </div>

            <div>
              <span className="font-semibold text-slate-500">
                Dirección
              </span>

              <p className="truncate">
                {direccionCliente || direccion || "-"}
              </p>
            </div>

            <div>
              <span className="font-semibold text-slate-500">
                Pago
              </span>

              <p>{metodoPago || "-"}</p>
            </div>

            <div>
              <span className="font-semibold text-slate-500">
                Atención
              </span>

              <p>{atencion || "-"}</p>
            </div>

          </div>

        </div>

        {/* BUSCADOR */}
        <div className="
          border-b
          border-slate-300
          px-3
          py-1
          bg-slate-50
        ">

          <BuscadorProductos
            busqueda={busqueda}
            setBusqueda={setBusqueda}
            onAgregar={agregarItem}
            tipo={tipo}
          />

        </div>

        {/* TABLA */}
        <div className="flex-1 overflow-auto min-h-0">

          <table className="
            w-full
            text-xs
            border-collapse
          ">

            <thead className="
              bg-slate-100
              sticky
              top-0
              z-10
            ">

              <tr>

                <th className="px-2 py-2 text-center border-b w-[90px]">
                  Cant.
                </th>

                <th className="px-2 py-2 text-left border-b">
                  Detalle
                </th>

                <th className="px-2 py-2 text-center border-b w-[80px]">
                  Und
                </th>

                <th className="px-2 py-2 text-right border-b w-[120px]">
                  Precio
                </th>

                <th className="px-2 py-2 text-right border-b w-[130px]">
                  Total
                </th>

                <th className="px-2 py-2 border-b w-[50px]"></th>

              </tr>

            </thead>

            <tbody>

              {seleccionados.length > 0 ? (
                seleccionados.map((p) => (

                  <tr
                    key={p.id}
                    className="border-b hover:bg-slate-50"
                  >

                    {/* CANTIDAD */}
                    <td className="px-2 py-1 text-center">

                      <input
                        type="number"
                        step="0.01"
                        value={p.cantidad}
                        onChange={(e) =>
                          handleCantidadChange(
                            p.id,
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="
                          w-16
                          border
                          rounded
                          px-1
                          py-[2px]
                          text-center
                        "
                      />

                    </td>

                    {/* DETALLE */}
                    <td className="px-2 py-1">
                      {p.nombre}
                    </td>

                    {/* UNIDAD */}
                    <td className="px-2 py-1 text-center">
                      {p.unidad || "UN"}
                    </td>

                    {/* PRECIO */}
                    <td className="px-2 py-1 text-right">

                      <input
                        type="number"
                        step="0.01"
                        value={p.precio}
                        onChange={(e) =>
                          handlePrecioChange(
                            p.id,
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="
                          w-24
                          border
                          rounded
                          px-1
                          py-[2px]
                          text-right
                        "
                      />

                    </td>

                    {/* TOTAL */}
                    <td className="
                      px-2
                      py-1
                      text-right
                      font-semibold
                    ">
                      $
                      {(p.total || 0).toLocaleString("es-CL")}
                    </td>

                    {/* DELETE */}
                    <td className="text-center">

                      <button
                        onClick={() => eliminarProducto(p.id)}
                        className="
                          text-red-500
                          hover:text-red-700
                          text-sm
                        "
                      >
                        ✕
                      </button>

                    </td>

                  </tr>

                ))
              ) : (

                <tr>

                  <td
                    colSpan={6}
                    className="
                      text-center
                      py-8
                      text-slate-400
                      italic
                    "
                  >
                    No hay productos agregados
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

        {/* FOOTER */}
        <div className="
          border-t
          border-slate-300
          bg-slate-50
          px-4
          py-2
        ">

          <div className="
            flex
            items-end
            justify-between
          ">

            {/* BOTONES */}
            <div className="flex gap-2">

              <button
                onClick={guardarBorrador}
                className="
                  bg-slate-700
                  hover:bg-slate-800
                  text-white
                  px-3
                  py-1.5
                  rounded-md
                  text-xs
                "
              >
                Guardar
              </button>

              <button
                onClick={enviarCotizacion}
                disabled={enviando}
                className="
                  bg-blue-600
                  hover:bg-blue-700
                  text-white
                  px-3
                  py-1.5
                  rounded-md
                  text-xs
                "
              >
                {enviando
                  ? "Generando..."
                  : "Generar"}
              </button>

              <button
                onClick={enviarWhatsapp}
                className="
                  bg-green-600
                  hover:bg-green-700
                  text-white
                  px-3
                  py-1.5
                  rounded-md
                  text-xs
                "
              >
                WhatsApp
              </button>

            </div>

            {/* TOTALES */}
            <div className="w-[240px] text-xs">

              <div className="flex justify-between">
                <span>Subtotal</span>

                <span>
                  ${subtotal.toLocaleString("es-CL")}
                </span>
              </div>

              <div className="flex justify-between">
                <span>IVA</span>

                <span>
                  ${iva.toLocaleString("es-CL")}
                </span>
              </div>

              <div className="
                flex
                justify-between
                border-t
                mt-1
                pt-1
                text-lg
                font-bold
              ">

                <span>TOTAL</span>

                <span className="text-blue-600">
                  ${total.toLocaleString("es-CL")}
                </span>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* MODAL CLIENTE */}
      <Dialog
        open={showModalCliente}
        onOpenChange={setShowModalCliente}
      >

        <DialogContent className="max-w-2xl">

          <DialogHeader>
            <DialogTitle>
              {cliente
                ? "Editar Cliente"
                : "Nuevo Cliente"}
            </DialogTitle>
          </DialogHeader>

          <FormularioCliente
            cliente={cliente}
            setCliente={setCliente}
            clienteId={clienteId}
            setClienteId={setClienteId}
            rutCliente={rutCliente}
            setRutCliente={setRutCliente}
            fechaEntrega={fechaEntrega}
            setFechaEntrega={setFechaEntrega}
            disableTipo={!!id}
            metodoPago={metodoPago}
            setMetodoPago={setMetodoPago}
            tipo={tipo}
            setTipo={setTipo}
            giroCliente={giroCliente}
            setGiroCliente={setGiroCliente}
            direccionCliente={direccionCliente}
            setDireccionCliente={setDireccionCliente}
            comunaCliente={comunaCliente}
            setComunaCliente={setComunaCliente}
            ciudadCliente={ciudadCliente}
            setCiudadCliente={setCiudadCliente}
            atencion={atencion}
            setAtencion={setAtencion}
            emailCliente={emailCliente}
            setEmailCliente={setEmailCliente}
            telefonoCliente={telefonoCliente}
            setTelefonoCliente={setTelefonoCliente}
            direccion={direccion}
            setDireccion={setDireccion}
            formaPago={formaPago}
            setFormaPago={setFormaPago}
            nota={nota}
            setNota={setNota}
          />

        </DialogContent>

      </Dialog>

    </div>
  );
}
