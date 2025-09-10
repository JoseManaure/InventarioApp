const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const verifyToken = require('../middleware/auth');

// Crear o actualizar item
router.post('/', verifyToken, async (req, res) => {
  const { nombre, cantidad, precio, fecha, comprometidos, codigo, costo } = req.body;

  try {
      if (req.body.modo === 'catalogo') {
    req.body.cantidad = 0; // siempre stock inicial en 0
    }
    let existente;

    if (codigo) {
      existente = await Item.findOne({ codigo });
    }
    if (!existente) {
      existente = await Item.findOne({ nombre });
    }

    

    let mensaje = '';

    if (existente) {
      existente.cantidad += cantidad;
      existente.precio = precio;
      existente.fecha = new Date(fecha);
      existente.modificadoPor = req.user;
      existente.costo = costo ?? existente.costo;
      if (codigo) existente.codigo = codigo;
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
        codigo
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

// Obtener inventario con search + paginación
router.get('/', verifyToken, async (req, res) => {
  try {
    const { search = '', page = 1, limit = 20 } = req.query;

    const filtros = {};
    if (search) {
      const regex = new RegExp(search, 'i'); 
      filtros.$or = [{ nombre: regex }, { codigo: regex }];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      Item.find(filtros)
        .select('nombre precio codigo costo cantidad')
        .populate('modificadoPor', 'name email')
        .skip(skip)
        .limit(Number(limit))
        .sort({ nombre: 1 }),
      Item.countDocuments(filtros)
    ]);

    res.json({ items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener los productos' });
  }
});


// Función para escapar caracteres especiales en regex
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

// Buscar por nombre o código (para autocompletar)
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
