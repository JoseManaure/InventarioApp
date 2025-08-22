import React from 'react';

interface Props {
  disableTipo?: boolean;
  cliente: string;
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

export default function FormularioCliente(props: Props) {
  const {
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
    disableTipo = false,
    formaPago, setFormaPago,
    nota, setNota,
  } = props;

  return (
    <div className="space-y-4">
      {/* Datos principales */}
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Cliente"
          value={cliente}
          onChange={e => setCliente(e.target.value)}
          className="input input-bordered w-48"
        />

        
        {/* Dirección del cliente (detallada) */}
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
          placeholder="Fecha Entrega"
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

  {/* NUEVOS CAMPOS */}
  <div className="w-full md:w-1/2">
    <label className="block text-sm font-medium text-gray-700">Forma de Pago</label>
    <textarea
      value={formaPago}
      onChange={e => setFormaPago && setFormaPago(e.target.value)}
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
      rows={2}
    />
  </div>

  <div className="w-full md:w-1/2">
    <label className="block text-sm font-medium text-gray-700">Nota</label>
    <textarea
      value={nota}
      onChange={e => setNota && setNota(e.target.value)}
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
      rows={2}
    />
  </div>

  {/* Dirección general (para notas de venta) */}
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
