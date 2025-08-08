// src/models/Correlativo.js
const mongoose = require('mongoose');

const correlativoSchema = new mongoose.Schema({
  tipo: {
    type: String,
    required: true,
    enum: ['cotizacion', 'nota'],
    unique: true,
  },
  ultimoNumero: {
    type: Number,
    required: true,
    default: 0,
  },
});

module.exports = mongoose.model('Correlativo', correlativoSchema);
