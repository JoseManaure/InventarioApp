const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  cantidad: {
    type: Number,
    default: 0,
    min: 0
  },
  precio: {
    type: Number,
    default: 0,
    min: 0
  },
  costo: {
    type: Number,
    default: 0,
    min: 0
  },
  fecha: Date,
  codigo: String, // no pongas unique aquí, lo pondremos abajo con .index()
  unidad: {
    type: String,
    enum: [
      "unidad",
      "m3",
      "mts",
      "lts",
      "tonelada",
      "metro_lineal"
    ],
    default: 'unidad'
  },
  empresa: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Empresa",
    required: true,
    index: true
  },
  modificadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  modificadoEn: { type: Date, default: Date.now },

  comprometidos: [
    {
      cantidad: Number,
      hasta: Date,
      cotizacionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cotizacion'
      }
    }
  ]
});

// ✅ Este es el único índice: sparse + único
itemSchema.index(
  { empresa: 1, codigo: 1 },
  { unique: true, sparse: true }
);
itemSchema.index({ nombre: 'text', codigo: 'text' });

module.exports = mongoose.model('Item', itemSchema);
