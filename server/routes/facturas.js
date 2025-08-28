// server/routes/facturas.js
const express = require('express');
const Factura = require('../models/Factura');
const router = express.Router();

// GET todas las facturas
router.get('/', async (req, res) => {
  try {
    const facturas = await Factura.find();
    res.json(facturas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST nueva factura
router.post('/', async (req, res) => {
  try {
    const factura = new Factura(req.body);
    await factura.save();
    res.status(201).json(factura);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// Crear factura
router.post('/', async (req, res) => {
  try {
    const nueva = new Factura(req.body);
    const guardada = await nueva.save();
    res.status(201).json(guardada);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se pudo crear la factura' });
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
