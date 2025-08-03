export interface NotaDeVenta {
  _id: string;
  cliente: string;
  direccion: string;
  fechaHoy: string;
  fechaEntrega: string;
  metodoPago: string;
  tipo: 'cotizacion' | 'nota';
  productos: {
    itemId: string;
    nombre?: string; // si lo agregaste en el backend
    cantidad: number;
    precio?: number; // si estás guardando el precio
  }[];
  pdfUrl?: string;
}
