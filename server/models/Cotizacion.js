// src/models/Cotizacion.js
const mongoose = require('mongoose');

const CotizacionSchema = new mongoose.Schema(
  {
    cliente: { type: String, trim: true },
    direccion: { type: String, trim: true },
    fechaHoy: { type: String },
    fechaEntrega: { type: String },
    metodoPago: { type: String, trim: true },
    rutCliente: { type: String, trim: true },
    giroCliente: { type: String, trim: true },
    direccionCliente: { type: String, trim: true },
    comunaCliente: { type: String, trim: true },
    ciudadCliente: { type: String, trim: true },
    atencion: { type: String, trim: true },
    emailCliente: { type: String, trim: true },
    telefonoCliente: { type: String, trim: true },

    tipo: {
      type: String,
      enum: ['cotizacion', 'nota'],
      required: true,
    },

    formaPago: {
      type: String,
      default: '65% Al inicio y 35% al momento de la entrega.',
    },

    nota: {
      type: String,
      default: 'Esta cotización es aceptada después de cancelado el 65%.',
    },

    productos: [
      {
        itemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Item',
        },
        nombre: { type: String, trim: true },
        cantidad: { type: Number, default: 0 },
        precio: { type: Number, default: 0 },
        total: { type: Number, required: true },
      },
    ],

    anulada: { type: Date, default: null },

    estado: {
      type: String,
      enum: ['borrador', 'finalizada', 'cancelada'],
      default: 'finalizada',
    },

    pdfUrl: { type: String, trim: true },
    total: { type: Number, required: true },

    numero: { type: Number }, // 👈 quitamos unique para evitar conflictos
    numeroDocumento: { type: String, trim: true },
    tipoDocumento: { type: String, trim: true },

    cotizacionOriginalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cotizacion',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ✅ Si más adelante quieres numeración única, puedes activar un índice así:
// CotizacionSchema.index({ numero: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Cotizacion', CotizacionSchema);
