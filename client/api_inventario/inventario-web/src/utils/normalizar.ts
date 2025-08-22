// src/utils/normalizar.ts
export const extraerPalabrasClave = (texto: string) => {
  return texto
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 2); // solo palabras con 3 o más letras
};

