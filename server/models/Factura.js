// models/Factura.js
const mongoose = require('mongoose');

const productoFacturaSchema = new mongoose.Schema({
  nombre: String,
  cantidad: Number,
  precioUnitario: Number,
  iva: Number,
});

const facturaSchema = new mongoose.Schema({
  empresa: String,
  rut: String,
  rol: String,
  direccion: String,
  fecha: {
    type: Date,
    default: Date.now,
  },
  productos: [productoFacturaSchema],
  total: Number,
});

module.exports = mongoose.model('Factura', facturaSchema);
