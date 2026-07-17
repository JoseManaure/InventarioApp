import React, { useEffect, useState } from "react";
import api from "../api/api";

interface Props {
  disableTipo?: boolean;
  cliente: string;
  clienteId: string;
  setClienteId: React.Dispatch<React.SetStateAction<string>>;
  setCliente: React.Dispatch<React.SetStateAction<string>>;
  rutCliente: string;
  setRutCliente: React.Dispatch<React.SetStateAction<string>>;
  direccion: string;
  setDireccion: React.Dispatch<React.SetStateAction<string>>;
  fechaEntrega: string;
  setFechaEntrega: React.Dispatch<React.SetStateAction<string>>;
  metodoPago: string;
  setMetodoPago: React.Dispatch<React.SetStateAction<string>>;
  tipo: 'cotizacion' | 'nota';
  setTipo: React.Dispatch<React.SetStateAction<'cotizacion' | 'nota'>>;
  giroCliente: string;
  setGiroCliente: React.Dispatch<React.SetStateAction<string>>;
  direccionCliente: string;
  setDireccionCliente: React.Dispatch<React.SetStateAction<string>>;
  comunaCliente: string;
  setComunaCliente: React.Dispatch<React.SetStateAction<string>>;
  ciudadCliente: string;
  setCiudadCliente: React.Dispatch<React.SetStateAction<string>>;
  atencion: string;
  setAtencion: React.Dispatch<React.SetStateAction<string>>;
  emailCliente: string;
  setEmailCliente: React.Dispatch<React.SetStateAction<string>>;
  telefonoCliente: string;
  setTelefonoCliente: React.Dispatch<React.SetStateAction<string>>;
  formaPago?: string;
  setFormaPago?: React.Dispatch<React.SetStateAction<string>>;
  nota?: string;
  setNota?: React.Dispatch<React.SetStateAction<string>>;
}

export default function FormularioCliente({
  disableTipo = false,
  cliente, setCliente,
  rutCliente, setRutCliente,
  direccion, setDireccion,
  fechaEntrega, setFechaEntrega,
  metodoPago, setMetodoPago,
  tipo, setTipo,
  giroCliente, setGiroCliente,
  direccionCliente, setDireccionCliente,
  comunaCliente, setComunaCliente,
  ciudadCliente, setCiudadCliente,
  atencion, setAtencion,
  emailCliente, setEmailCliente,
  telefonoCliente, setTelefonoCliente,
  clienteId,
  setClienteId,
  formaPago, setFormaPago,
  nota, setNota
}: Props) {

  const [clientes, setClientes] = useState<any[]>([]);
  const [mostrarLista, setMostrarLista] = useState(false);

  useEffect(() => {
    if (cliente.trim().length < 2) {
      setClientes([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const res = await api.get(`/clientes?search=${cliente}`);
        setClientes(res.data);
        setMostrarLista(true);
      } catch (err) {
        console.error(err);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [cliente]);
  return (
    <div className="space-y-4">
      {/* Datos principales */}
      <div className="flex flex-wrap gap-2">
        <div className="relative w-48">

          <input
            type="text"
            placeholder="Cliente"
            value={cliente}
            onChange={(e) => {
              setCliente(e.target.value);
              setMostrarLista(true);
            }}
            className="input input-bordered w-full"
          />

          {mostrarLista && clientes.length > 0 && (
            <div className="absolute left-0 top-full mt-1 z-50 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto">

              {clientes.map((c) => (
                <div
                  key={c._id}
                  onClick={() => {

                    setClienteId(c._id);

                    setCliente(c.nombre);

                    setRutCliente(c.rut || "");

                    setDireccionCliente(c.direccion || "");

                    setComunaCliente(c.comuna || "");

                    setCiudadCliente(c.ciudad || "");

                    setGiroCliente(c.giro || "");

                    setTelefonoCliente(c.telefono || "");

                    setEmailCliente(c.email || "");

                    setAtencion(c.contacto || "");

                    setMostrarLista(false);

                  }}
                  className="px-3 py-2 cursor-pointer hover:bg-blue-100"
                >
                  <div className="font-medium">{c.nombre}</div>

                  <div className="text-xs text-gray-500">
                    {c.rut}
                  </div>
                </div>
              ))}

            </div>
          )}

        </div>

        <input
          type="text"
          placeholder="Dirección Cliente"
          value={direccionCliente}
          onChange={e => setDireccionCliente(e.target.value)}
          className="input input-bordered w-60"
        />

        <input
          type="text"
          placeholder="Comuna"
          value={comunaCliente}
          onChange={e => setComunaCliente(e.target.value)}
          className="input input-bordered w-40"
        />

        <input
          type="text"
          placeholder="Ciudad"
          value={ciudadCliente}
          onChange={e => setCiudadCliente(e.target.value)}
          className="input input-bordered w-40"
        />

        <input
          type="date"
          value={fechaEntrega ? new Date(fechaEntrega).toISOString().split('T')[0] : ''}
          onChange={e => setFechaEntrega(e.target.value)}
          className="input input-bordered w-48"
        />

        <select
          value={metodoPago}
          onChange={e => setMetodoPago(e.target.value)}
          className="input input-bordered w-48"
        >
          <option value="efectivo">Efectivo</option>
          <option value="debito">Débito</option>
          <option value="transferencia">Transferencia</option>
        </select>

        <select
          disabled={disableTipo}
          value={tipo}
          onChange={e => setTipo(e.target.value as 'cotizacion' | 'nota')}
          className="input input-bordered w-48"
        >
          <option value="cotizacion">Cotización</option>
          <option value="nota">Nota de Venta</option>
        </select>

        <input
          type="text"
          placeholder="Celular"
          value={telefonoCliente}
          onChange={e => setTelefonoCliente(e.target.value)}
          className="input input-bordered w-36"
        />
      </div>

      {/* Datos adicionales */}
      <h2 className="text-sm font-semibold text-gray-600">Datos Adicionales del Cliente</h2>
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="RUT"
          value={rutCliente}
          onChange={e => setRutCliente(e.target.value)}
          className="input input-bordered w-36"
        />

        <input
          type="text"
          placeholder="Giro"
          value={giroCliente}
          onChange={e => setGiroCliente(e.target.value)}
          className="input input-bordered w-48"
        />

        <input
          type="text"
          placeholder="Atención"
          value={atencion}
          onChange={e => setAtencion(e.target.value)}
          className="input input-bordered w-48"
        />

        <textarea
          placeholder="Forma de Pago"
          value={formaPago}
          onChange={e => setFormaPago && setFormaPago(e.target.value)}
          className="input input-bordered w-full md:w-1/2"
          rows={2}
        />

        <textarea
          placeholder="Nota"
          value={nota}
          onChange={e => setNota && setNota(e.target.value)}
          className="input input-bordered w-full md:w-1/2"
          rows={2}
        />

        <input
          type="text"
          placeholder="Dirección (para documento)"
          value={direccion}
          onChange={e => setDireccion(e.target.value)}
          className="input input-bordered w-60"
        />

        <input
          type="email"
          placeholder="Correo"
          value={emailCliente}
          onChange={e => setEmailCliente(e.target.value)}
          className="input input-bordered w-60"
        />
      </div>
    </div>
  );
}
