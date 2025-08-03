// utils/generarNumero.js
const Cotizacion = require('../models/Cotizacion');

async function obtenerProximoNumero() {
  const ultima = await Cotizacion.findOne().sort({ numero: -1 }).limit(1);;
  return ultima ? ultima.numero + 1 : 10001;
}

module.exports = obtenerProximoNumero;
