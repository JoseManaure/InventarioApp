// server/routes/facturas.js
const express = require('express');
const Factura = require('../models/Factura');
const Item = require("../models/Item");
const router = express.Router();




// Crear factura y actualizar items correctamente
router.post("/", async (req, res) => {
  try {
    const nueva = new Factura(req.body);
    const guardada = await nueva.save();

    for (const producto of guardada.productos) {
      let item;
      if (producto.codigo) {
        item = await Item.findOne({ codigo: producto.codigo });
      }
      if (!item) {
        item = await Item.findOne({ nombre: producto.nombre });
      }

      if (item) {
  item.cantidad = (item.cantidad || 0) + producto.cantidad;
  item.precio = producto.precioUnitario;
  item.costo = producto.costo; // 👈 agregar esta línea
  item.fecha = new Date();
  if (producto.codigo) item.codigo = producto.codigo;
  await item.save();
} else {
  const nuevoItem = new Item({
    nombre: producto.nombre,
    cantidad: producto.cantidad,
    precio: producto.precioUnitario,
    costo: producto.costo || 0, // 👈 agregar costo aquí también
    fecha: new Date(),
    codigo: producto.codigo,
  });
  await nuevoItem.save();
}

    }

    res.status(201).json(guardada);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "No se pudo crear la factura" });
  }
});




// Obtener facturas con filtro por mes
router.get('/', async (req, res) => {
  try {
    const { mes, pagina = 1, limite = 10 } = req.query;

    const query = {};
    if (mes) {
      // mes = '2025-08'
      const inicio = new Date(`${mes}-01T00:00:00.000Z`);
      const fin = new Date(inicio);
      fin.setMonth(fin.getMonth() + 1);
      query.fechaCreacion = { $gte: inicio, $lt: fin };
    }

    const skip = (Number(pagina) - 1) * Number(limite);
    const total = await Factura.countDocuments(query);
    const facturas = await Factura.find(query).sort({ fechaCreacion: -1 }).skip(skip).limit(Number(limite));

    res.json({ facturas, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se pudo obtener facturas' });
  }
});

module.exports = router;
