// routes/quotes.js
const express = require('express');
const router = express.Router();
const Quote = require('../models/Quote');
const Item = require('../models/Item');
const verifyToken = require('../middleware/auth');

router.post('/', verifyToken, async (req, res) => {
  try {
    const { cliente, fechaPedido, fechaEntrega, metodoPago, items } = req.body;

    // Descontar del inventario
    for (const { item, cantidad } of items) {
      const dbItem = await Item.findById(item);
      if (!dbItem || dbItem.cantidad < cantidad) {
        return res.status(400).json({ error: 'Stock insuficiente' });
      }
      dbItem.cantidad -= cantidad;
      await dbItem.save();
    }

    const quote = new Quote({
      cliente,
      fechaPedido,
      fechaEntrega,
      metodoPago,
      items,
      creadoPor: req.user,
    });

    await quote.save();
    res.status(201).json(quote);
  } catch (err) {
    res.status(500).json({ error: 'Error al guardar la cotización', details: err.message });
  }
});

module.exports = router;
