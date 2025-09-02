// src/models/GuiaDespacho.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const GuiaProductoSchema = new Schema({
  itemId: { type: Schema.Types.ObjectId, ref: "Item", required: true },
  nombre: { type: String, required: true },
  cantidad: { type: Number, required: true },
  precio: { type: Number, required: true },
});

const GuiaDespachoSchema = new Schema({
  notaId: { type: Schema.Types.ObjectId, ref: "NotaVenta", required: true },
  fecha: { type: Date, default: Date.now },
  productos: [GuiaProductoSchema],
  estado: { type: String, enum: ["pendiente", "completada"], default: "pendiente" },
  pdfPath: { type: String }, // ✅ aquí se guarda la ruta del PDF generado
  numero: { type: Number, required: true },
});

module.exports = mongoose.model("GuiaDespacho", GuiaDespachoSchema);
