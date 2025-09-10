// models/Factura.js
const mongoose = require('mongoose');

const ProductoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  cantidad: { type: Number, required: true },
  precioUnitario: { type: Number, required: true },
   costo: { type: Number, default: 0 }
});

const FacturaSchema = new mongoose.Schema({
  empresa: { type: String, required: true },
  rut: { type: String, required: true },
  rol: { type: String },
  direccion: { type: String },
  productos: { type: [ProductoSchema], default: [] },
  numeroDocumento: { type: String, required: true },
  tipoDocumento: { type: String, enum: ['factura', 'boleta', 'guia'], required: true },
  fechaCreacion: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Factura', FacturaSchema);
