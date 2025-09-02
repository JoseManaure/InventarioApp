// src/utils/normalizar.ts

export interface Dimensiones {
  ancho?: number;
  alto?: number;
  largo?: number;
  unidad?: string; // m | cm | mm
}

export interface ProductoNormalizado {
  palabras: string[];
  dimensiones: Dimensiones;
}

const normalizarTextoBase = (texto: string): string => {
  let t = (texto || "").toLowerCase();

  // decimales coma → punto
  t = t.replace(/(\d),(\d)/g, "$1.$2");

  // quitar comillas
  t = t.replace(/["']/g, "");

  // unificar separadores de medidas
  t = t.replace(/\s*[xX*]\s*/g, "x");

  // metros equivalentes
  t = t.replace(/\b(metros?|mts?|mtr?s?)\b/g, "m");

  // centímetros equivalentes
  t = t.replace(/\b(cm|cms|centimetros?)\b/g, "cm");

  // milímetros equivalentes
  t = t.replace(/\b(mm|mms|milimetros?)\b/g, "mm");

  return t.trim();
};

export const normalizarNombre = (texto: string): ProductoNormalizado => {
  const base = normalizarTextoBase(texto);

  const dimensiones: Dimensiones = {};
  const palabras: string[] = [];

  // Regex para capturar patrones de medidas
  // ejemplos: 2x10x3.2m, 2x4, 3.2m, 200cm, 15mm
  const regexMedidas = /(\d+(?:\.\d+)?)(x(\d+(?:\.\d+)?))?(x(\d+(?:\.\d+)?))?\s*(m|cm|mm)?/g;
  let match: RegExpExecArray | null;

  while ((match = regexMedidas.exec(base)) !== null) {
    const v1 = match[1] ? parseFloat(match[1]) : undefined;
    const v2 = match[3] ? parseFloat(match[3]) : undefined;
    const v3 = match[5] ? parseFloat(match[5]) : undefined;
    const unidad = match[6] || "m";

    if (v1 && v2 && v3) {
      dimensiones.ancho = v1;
      dimensiones.alto = v2;
      dimensiones.largo = v3;
      dimensiones.unidad = unidad;
    } else if (v1 && v2) {
      dimensiones.ancho = v1;
      dimensiones.alto = v2;
      dimensiones.unidad = unidad;
    } else if (v1) {
      dimensiones.largo = v1;
      dimensiones.unidad = unidad;
    }
  }

  // separar palabras que no son medidas
  const tokens = base.split(/\s+/);
  for (const tok of tokens) {
    if (!tok) continue;
    if (/\d/.test(tok)) continue; // descartar los que son solo números/medidas
    palabras.push(tok);
  }

  return { palabras, dimensiones };
};
