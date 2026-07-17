// src/models/Cotizacion.js
const mongoose = require('mongoose');
console.log("✅ CARGANDO MODELO COTIZACION");
const CotizacionSchema = new mongoose.Schema(
  {
    cliente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cliente"
    },
    clienteSnapshot: {
      nombre: {
        type: String,
        default: ""
      },
      rut: {
        type: String,
        default: ""
      },
      direccion: {
        type: String,
        default: ""
      },
      comuna: {
        type: String,
        default: ""
      },
      ciudad: {
        type: String,
        default: ""
      },
      telefono: {
        type: String,
        default: ""
      },
      email: {
        type: String,
        default: ""
      },
      giro: {
        type: String,
        default: ""
      },
      atencion: {
        type: String,
        default: ""
      }
    },
    direccion: { type: String, trim: true },
    fechaHoy: { type: String },
    fechaEntrega: { type: String },
    metodoPago: { type: String, trim: true },
    recibidoPor: {
      type: String,
      default: ''
    },
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
    empresa: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Empresa",
      required: true,
      index: true
    },
    formaPago: {
      type: String,
      default: '65% Al inicio y 35% al momento de la entrega.',
    },

    nota: {
      type: String,
      default: 'Esta cotización es aceptada después de cancelado el 65%.',
    },
    yaConvertida: {
      type: Boolean,
      default: false
    },

    fechaConversion: {
      type: Date,
      default: null
    },

    notaGeneradaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cotizacion',
      default: null
    },

    productos: [
      {
        itemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Item'
        },

        codigo: String,

        unidad: {
          type: String,
          enum: ['unidad', 'm3', 'tonelada', 'metro_lineal'],
          default: 'unidad'
        },

        nombre: String,
        cantidad: Number,
        precio: Number,
        costo: Number,
        total: Number
      }
    ],

    anulada: { type: Date, default: null },

    estado: {
      type: String,
      enum: ['borrador', 'finalizada', 'cancelada'],
      default: 'finalizada',
    },

    pdfUrl: { type: String, trim: true },
    subtotal: {
      type: Number,
      default: 0
    },

    iva: {
      type: Number,
      default: 0
    },
    total: { type: Number, required: true },

    numero: { type: Number }, // 👈 quitamos unique para evitar conflictos
    numeroDocumento: { type: String, trim: true },
    tipoDocumento: { type: String, trim: true },

    cotizacionOriginalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cotizacion',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
  },
  {
    timestamps: true,
  }
);

CotizacionSchema.index({
  empresa: 1,
  tipo: 1,
  estado: 1,
  anulada: 1
});

console.log("====== CAMPOS DEL SCHEMA ======");
console.log(Object.keys(CotizacionSchema.paths));
console.log("===============================");

module.exports = mongoose.model("Cotizacion", CotizacionSchema);

module.exports = mongoose.model('Cotizacion', CotizacionSchema);
