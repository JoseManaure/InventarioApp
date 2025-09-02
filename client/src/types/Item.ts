// src/types/Item.ts
export interface Item {
  _id: string;
  codigo:string;
  nombre: string;
  cantidad: number;
  precio:number;
  fecha: string;
  costo: number;
  modificadoPor: {
    name: string;
    email: string;
  };
  comprometidos?: Comprometido[];
}


export interface Comprometido {
  cantidad: number;
  hasta: string; // o Date si prefieres, pero debe ser string si viene del backend como texto
  cotizacionId?: string;
}