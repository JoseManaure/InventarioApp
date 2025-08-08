const mongoose = require('mongoose');

const CotizacionSchema = new mongoose.Schema({
  cliente: String,
  direccion: String,
  fechaHoy: String,
  fechaEntrega: String,
  metodoPago: String,
  rutCliente: String,
giroCliente: String,
direccionCliente: String,
comunaCliente: String,
ciudadCliente: String,
atencion: String,
emailCliente: String,
telefonoCliente: String,

  tipo: {
    type: String,
    enum: ['cotizacion', 'nota'],
    required: true
  },

  productos: [
    {
      itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item'
      },
      nombre: String,
      cantidad: Number,
      precio: Number,
      total: { type: Number, required: true }
    }
  ],
  anulada: { type: Boolean, default: false },
  estado: {
    type: String,
    enum: ['borrador', 'finalizada','cancelada'],
    default: 'finalizada',
  },

  pdfUrl: String,
  total: { type: Number, required: true },

  numero: Number, // ✅ Sin "unique" aquí
  numeroDocumento: String,
  tipoDocumento: String,

  cotizacionOriginalId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Cotizacion',
  default: null,
      },
},
{
  timestamps: true
});

// ✅ Único índice, sparse y único en campo `numero`
CotizacionSchema.index({ numero: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Cotizacion', CotizacionSchema);
