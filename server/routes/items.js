const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const verifyToken = require('../middleware/auth');

// Crear o actualizar item
router.post('/', verifyToken, async (req, res) => {
  const { nombre, cantidad, precio, fecha, comprometidos, codigo, costo } = req.body;

  try {
    let existente;

    // Si se proporciona un código, buscar por código
    if (codigo) {
      existente = await Item.findOne({ codigo });
    }

    // Si no se encontró por código, buscar por nombre (compatibilidad con tu sistema actual)
    if (!existente) {
      existente = await Item.findOne({ nombre });
    }

    let mensaje = '';

    if (existente) {
      existente.cantidad += cantidad;
      existente.precio = precio;
      existente.fecha = new Date(fecha);
      existente.modificadoPor = req.user;
      if (codigo) existente.codigo = codigo; // actualiza código si viene nuevo
      await existente.save();
      mensaje = '📝 Actualizado';
      return res.status(200).json({ ...existente.toObject(), _mensaje: mensaje });
    } else {
      const nuevoItem = new Item({
        nombre,
        cantidad,
        precio,
        fecha: new Date(fecha),
        costo,
        modificadoPor: req.user,
        comprometidos,
        codigo // nuevo campo opcional
      });

      await nuevoItem.save();
      mensaje = '📦 Creado';
      return res.status(201).json({ ...nuevoItem.toObject(), _mensaje: mensaje });
    }
  } catch (err) {
    console.error('❌ Error al crear o actualizar item:', err);
    return res.status(500).json({ error: 'Error al crear o actualizar item' });
  }
});

// Obtener todo el inventario (con token)
router.get('/', verifyToken, async (req, res) => {
  try {
    const items = await Item.find().populate('modificadoPor', 'name email');
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener los productos' });
  }
});

// Función para escapar caracteres especiales en regex
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

// Buscar por nombre o código
router.get('/buscar', verifyToken, async (req, res) => {
  const q = req.query.q?.toString().toLowerCase() || '';
  const safeQ = escapeRegex(q);

  try {
    const items = await Item.find({
      $or: [
        { nombre: new RegExp(safeQ, 'i') },
        { codigo: new RegExp(safeQ, 'i') }
      ]
    }).limit(5);
    res.json(items);
  } catch (err) {
    console.error('Error en búsqueda:', err);
    res.status(500).json({ error: 'Error en búsqueda' });
  }
});

module.exports = router;
