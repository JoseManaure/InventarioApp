// models/Quote.js
const mongoose = require('mongoose');

const QuoteSchema = new mongoose.Schema({
  cliente: {
    nombre: String,
    direccion: String,
  },
  fechaPedido: Date,
  fechaEntrega: Date,
  metodoPago: {
    type: String,
    enum: ['Transferencia', 'Débito', 'Efectivo'],
  },
  items: [
    {
      item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
      cantidad: Number,
    }
  ],
  creadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

module.exports = mongoose.model('Quote', QuoteSchema);
