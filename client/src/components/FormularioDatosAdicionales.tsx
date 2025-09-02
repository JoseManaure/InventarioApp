// src/components/FormularioDatosAdicionales.tsx
import React from 'react';

interface Props {
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
  
  // Agrega estas nuevas props:
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
}

export default function FormularioDatosAdicionales({
  giroCliente, setGiroCliente,
  direccionCliente, setDireccionCliente,
  comunaCliente, setComunaCliente,
  ciudadCliente, setCiudadCliente,
  atencion, setAtencion,
  emailCliente, setEmailCliente,
  telefonoCliente, setTelefonoCliente
}: Props) {
  return (
    <div className="mt-6 p-4 border rounded-lg shadow bg-gray-50">
      <h2 className="text-lg font-semibold mb-4 text-gray-700">📋 Datos adicionales del cliente</h2>
      <div className="grid md:grid-cols-3 gap-4">
        <input
          value={giroCliente}
          onChange={(e) => setGiroCliente(e.target.value)}
          placeholder="Giro"
          className="border p-2 rounded"
        />
        <input
          value={direccionCliente}
          onChange={(e) => setDireccionCliente(e.target.value)}
          placeholder="Dirección"
          className="border p-2 rounded"
        />
        <input
          value={comunaCliente}
          onChange={(e) => setComunaCliente(e.target.value)}
          placeholder="Comuna"
          className="border p-2 rounded"
        />
        <input
          value={ciudadCliente}
          onChange={(e) => setCiudadCliente(e.target.value)}
          placeholder="Ciudad"
          className="border p-2 rounded"
        />
        <input
          value={atencion}
          onChange={(e) => setAtencion(e.target.value)}
          placeholder="Atención (Sr/Sra)"
          className="border p-2 rounded"
        />
        <input
          type="email"
          value={emailCliente}
          onChange={(e) => setEmailCliente(e.target.value)}
          placeholder="Correo electrónico"
          className="border p-2 rounded"
        />
        <input
          value={telefonoCliente}
          onChange={(e) => setTelefonoCliente(e.target.value)}
          placeholder="Celular"
          className="border p-2 rounded"
        />
      </div>
    </div>
  );
}
