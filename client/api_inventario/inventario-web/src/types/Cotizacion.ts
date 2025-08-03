// src/types/Cotizacion.ts
export interface Cotizacion {
  cliente: string;
  direccion: string;
  metodoPago: 'transferencia' | 'efectivo' | 'debito';
  fechaEntrega: string;
  productos: { id: string; cantidad: number }[];
}
