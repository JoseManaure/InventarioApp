const express = require('express');
const router = express.Router();
const Factura = require('../models/Factura');
const Item = require('../models/Item');

// POST: Crear factura y agregar al inventario
router.post('/', async (req, res) => {
  try {
    const { nombreEmpresa, rut, rol, direccion, fechaCompra, productos,  numeroDocumento, tipoDocumento} = req.body;

    const nuevaFactura = new Factura({ nombreEmpresa, rut, rol, direccion, fechaCompra, productos,  numeroDocumento,   // ✅ nuevo
  tipoDocumento});
    await nuevaFactura.save();

    // Agregar productos al inventario
    for (const producto of productos) {
      const itemExistente = await Item.findOne({ nombre: producto.nombre });

      if (itemExistente) {
        itemExistente.cantidad += producto.cantidad;
        await itemExistente.save();
      } else {
        await Item.create({
          nombre: producto.nombre,
          cantidad: producto.cantidad,
          precio: producto.precioUnitario,
          iva: producto.iva
        });
      }
    }

    res.status(201).json({ mensaje: 'Factura registrada y productos actualizados' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al registrar la factura' });
  }
});


// Obtener todas las facturas
router.get('/', async (req, res) => {
  try {
    const facturas = await Factura.find();
    res.json(facturas);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener facturas' });
  }
});

module.exports = router;
