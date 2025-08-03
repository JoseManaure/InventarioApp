const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema({
  nombre: String,
  cantidad: Number,
  precioUnitario: Number,
  iva: Number,
});

const facturaCompraSchema = new mongoose.Schema({
  empresa: String,
  rut: String,
  rol: String,
  direccion: String,
  fecha: { type: Date, default: Date.now },
  productos: [productoSchema],
  totalConIVA: Number,
});

module.exports = mongoose.model('FacturaCompra', facturaCompraSchema);
