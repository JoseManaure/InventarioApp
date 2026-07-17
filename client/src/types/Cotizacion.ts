export interface Producto {
  _id?: string;

  itemId?:
  | string
  | {
    _id?: string;
    nombre?: string;
    costo?: number;
  };

  nombre: string;

  codigo?: string;

  cantidad: number;

  precio: number;

  costo?: number;

  total?: number;

  unidad?: string;

  despachado?: number;
}

export interface Cliente {
  _id: string;

  nombre: string;

  rut?: string;

  telefono?: string;

  email?: string;
}

export interface ClienteSnapshot {
  nombre: string;

  rut?: string;

  direccion?: string;

  comuna?: string;

  ciudad?: string;

  telefono?: string;

  email?: string;

  giro?: string;

  atencion?: string;
}

export interface Cotizacion {
  _id: string;

  cliente: string | Cliente | null;

  clienteSnapshot?: ClienteSnapshot;

  // 👇 Este viene calculado desde el backend
  nombreCliente: string;

  direccion: string;

  metodoPago: "transferencia" | "efectivo" | "debito";

  fechaEntrega: string;

  productos: Producto[];

  pdfUrl?: string;

  anulada?: string;

  cotizacionOriginalId?: string;

  recibidoPor?: string;

  tipo?: string;

  rutCliente?: string;

  telefonoCliente?: string;

  emailCliente?: string;
}