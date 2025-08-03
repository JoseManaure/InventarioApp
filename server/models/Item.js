const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  nombre: String,
  cantidad: Number,
  fecha: Date,
  precio: Number,
  codigo: String, // no pongas unique aquí, lo pondremos abajo con .index()

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
itemSchema.index({ codigo: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Item', itemSchema);
