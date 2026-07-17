// models/Factura.js
const mongoose = require('mongoose');

const ProductoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },

  codigo: { type: String },

  unidad: {
    type: String,
    enum: ['unidad', 'm3', 'tonelada', 'metro_lineal'],
    default: 'unidad'
  },

  cantidad: { type: Number, required: true },

  // costo compra real
  precioUnitario: { type: Number, required: true },

  // precio venta
  costo: { type: Number, default: 0 }
});

const FacturaSchema = new mongoose.Schema({
  empresa: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Empresa",
    required: true,
    index: true
  },
  proveedor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Proveedor",
    required: true
  },
  productos: { type: [ProductoSchema], default: [] },
  numeroDocumento: { type: String, required: true },
  tipoDocumento: { type: String, enum: ['factura', 'boleta', 'guia'], required: true },
  fechaCreacion: { type: Date, default: Date.now },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
});

module.exports = mongoose.model('Factura', FacturaSchema);
