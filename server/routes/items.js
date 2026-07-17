const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const verifyToken = require('../middleware/verifyToken');
const requireAdmin =
  require('../middleware/requireAdmin.js');
// Crear o actualizar item

router.post(
  '/',
  verifyToken,
  requireAdmin,
  async (req, res) => {
    const { nombre, cantidad, precio, fecha, comprometidos, codigo, costo } = req.body;

    try {
      if (req.body.modo === 'catalogo') {
        req.body.cantidad = 0; // siempre stock inicial en 0
      }
      let existente;

      if (codigo) {
        existente = await Item.findOne({
          empresa: req.user.empresa,
          codigo
        });
      }
      if (!existente) {
        existente = await Item.findOne({
          empresa: req.user.empresa,
          nombre
        });
      }



      let mensaje = '';

      if (existente) {
        existente.cantidad += cantidad;
        existente.precio = precio;
        existente.fecha = new Date(fecha);
        existente.modificadoPor = req.user.id;
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
          modificadoPor: req.user.id,
          comprometidos,
          codigo,
          empresa: req.user.empresa
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

    const filtros = {
      empresa: req.user.empresa
    };

    if (search) {
      const regex = new RegExp(search, 'i');

      filtros.$or = [
        { nombre: regex },
        { codigo: regex }
      ];
    }

    const safeLimit = Math.min(Number(limit) || 20, 100);
    const safePage = Math.max(Number(page) || 1, 1);
    const skip = (safePage - 1) * safeLimit;
    console.log("Empresa del usuario:", req.user.empresa);
    console.log("Filtros:", filtros);

    const totalEmpresa = await Item.countDocuments({
      empresa: req.user.empresa
    });

    const totalGeneral = await Item.countDocuments({});

    console.log("Items empresa:", totalEmpresa);
    console.log("Items total:", totalGeneral);
    const [items, total] = await Promise.all([
      Item.find(filtros)
        .select('nombre precio codigo costo cantidad comprometidos')
        .populate('modificadoPor', 'name email')
        .skip(skip)
        .limit(safeLimit)
        .sort({ nombre: 1 }),

      Item.countDocuments(filtros)
    ]);

    res.json({
      items,
      total,
      page: safePage,
      pages: Math.ceil(total / safeLimit)
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: 'Error al obtener los productos'
    });
  }
});




// Buscar por nombre o código (para autocompletar)
router.get('/buscar', verifyToken, async (req, res) => {
  try {

    const { q } = req.query;

    const filtros = {
      empresa: req.user.empresa
    };

    if (q) {
      filtros.$or = [
        {
          nombre: {
            $regex: q,
            $options: 'i'
          }
        },
        {
          codigo: {
            $regex: q,
            $options: 'i'
          }
        }
      ];
    }

    const items = await Item.find(filtros)
      .limit(20);

    res.json(items);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Error buscando items'
    });
  }
});

module.exports = router;
