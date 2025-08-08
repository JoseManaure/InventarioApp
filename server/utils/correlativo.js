// utils/correlativo.js
const Cotizacion = require('../models/Cotizacion');

async function obtenerNuevoCorrelativoSeguro(tipo) {
  const base = tipo === 'cotizacion' ? 10000 : 20000;
  let intento = 0;
  let numero;

  while (intento < 10) {
    const ultima = await Cotizacion.findOne({ tipo }).sort({ numero: -1 });
    numero = ultima ? ultima.numero + 1 : base;

    const yaExiste = await Cotizacion.findOne({ tipo, numero });
    if (!yaExiste) return numero;

    intento++;
  }

  throw new Error('No se pudo generar número único después de 10 intentos');
}

// 👇 Esta línea es crucial
module.exports = { obtenerNuevoCorrelativoSeguro };
