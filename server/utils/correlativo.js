const Contador = require('../models/Contador');

/**
 * Obtiene un nuevo correlativo atómico para cualquier tipo de documento
 * @param {string} tipo - Nombre del contador (ej: 'cotizacion', 'nota', 'factura')
 * @returns {Promise<number>}
 */
async function obtenerNuevoCorrelativoSeguro(tipo) {
  const result = await Contador.findOneAndUpdate(
    { nombre: tipo },
    { $inc: { valor: 1 } },
    { new: true, upsert: true }
  );

  return result.valor;
}

module.exports = { obtenerNuevoCorrelativoSeguro };
