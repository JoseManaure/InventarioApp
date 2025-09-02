// routes/cotizaciones.js
const express = require('express');
const router = express.Router();
const Cotizacion = require('../models/Cotizacion');
const Item = require('../models/Item');
const verifyToken = require('../middleware/auth');
const mongoose = require('mongoose');

// ✅ Función para obtener correlativo seguro
async function obtenerNuevoCorrelativoSeguro(tipo) {
  const ultima = await Cotizacion.findOne({ tipo })
    .sort({ numero: -1 })
    .select("numero");
  return ultima ? ultima.numero + 1 : 1;
}

// =========================
// 📌 Crear o actualizar Cotización / Nota
// =========================
router.post('/', verifyToken, async (req, res) => {
  try {
    const {
      cliente,
      direccion,
      fechaHoy,
      fechaEntrega,
      metodoPago,
      tipo, // cotizacion | nota
      numeroDocumento,
      tipoDocumento, // factura | boleta | guia
      productos,
      _id, // opcional para actualizar borrador
      estado, // 'borrador' | 'finalizada'
      rutCliente,
      giroCliente,
      direccionCliente,
      comunaCliente,
      ciudadCliente,
      atencion,
      emailCliente,
      telefonoCliente,
      formaPago,
      nota,
    } = req.body;

    if (!['cotizacion', 'nota'].includes(tipo)) {
      return res.status(400).json({ error: 'Tipo inválido (cotizacion o nota)' });
    }

    if (!Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ error: 'Debe incluir al menos un producto' });
    }

    // ✅ Normalizar fechaEntrega
    let fechaEntregaObj = fechaEntrega ? new Date(fechaEntrega) : new Date();
    fechaEntregaObj.setHours(0, 0, 0, 0);
    const fechaEntregaValida = fechaEntregaObj.toISOString().split("T")[0];

    // ✅ Validar itemId si es nota
    for (const p of productos) {
      if (tipo === 'nota') {
        const item = await Item.findById(p.itemId);
        if (!item) {
          return res.status(400).json({ error: `Producto no encontrado: ${p.itemId}` });
        }
      }
    }

    // ✅ Normalizar productos
    const productosValidados = productos.map((p) => {
      const cantidad = Number(p.cantidad || 0);
      const precio = Number(p.precio || 0);
      return {
        itemId: p.itemId,
        cantidad,
        nombre: p.nombre, 
        precio,
        total: cantidad * precio,
      };
    });

    const total = productosValidados.reduce((acc, p) => acc + p.total, 0);

    let numeroFinal = null;
    let cotizacion;

    if (_id) {
      // 🔄 Editar existente
      const cotizacionExistente = await Cotizacion.findById(_id);
      numeroFinal = cotizacionExistente?.numero || null;

      if (cotizacionExistente?.estado === 'borrador' && estado !== 'borrador') {
        numeroFinal = await obtenerNuevoCorrelativoSeguro(tipo);
      }

      cotizacion = await Cotizacion.findByIdAndUpdate(
        _id,
        {
          cliente,
          direccion,
          fechaHoy,
          fechaEntrega: fechaEntregaValida,
          metodoPago,
          tipo,
          numero: numeroFinal,
          productos: productosValidados,
          total,
          numeroDocumento,
          tipoDocumento,
          estado: estado || 'finalizada',
          rutCliente,
          giroCliente,
          direccionCliente,
          comunaCliente,
          ciudadCliente,
          atencion,
          emailCliente,
          telefonoCliente,
          formaPago: formaPago ?? '',
          nota: nota ?? '',
        },
        { new: true }
      );
    } else {
      // 🆕 Crear nueva
      if (estado !== 'borrador') {
        numeroFinal = await obtenerNuevoCorrelativoSeguro(tipo);
      }

      cotizacion = await Cotizacion.create({
        cliente,
        direccion,
        fechaHoy,
        fechaEntrega: fechaEntregaValida,
        metodoPago,
        tipo,
        numero: numeroFinal,
        productos: productosValidados,
        total,
        numeroDocumento,
        tipoDocumento,
        estado: estado || 'finalizada',
        rutCliente,
        giroCliente,
        direccionCliente,
        comunaCliente,
        ciudadCliente,
        atencion,
        emailCliente,
        telefonoCliente,
        formaPago: formaPago ?? '',
        nota: nota ?? '',
      });
    }

    // 📦 Comprometer stock si es nota
    if (tipo === 'nota' && estado !== 'borrador') {
      for (const p of productosValidados) {
        const item = await Item.findById(p.itemId);
        if (item) {
          item.comprometidos.push({
            cantidad: p.cantidad,
            hasta: fechaEntregaObj,
            cotizacionId: cotizacion._id,
          });
          await item.save();
        }
      }
    }

    res.status(201).json(cotizacion);
  } catch (error) {
    console.error('Error al crear o actualizar cotización:', error);
    res.status(500).json({ error: 'Error al crear o actualizar cotización' });
  }
});

// =========================
// 📌 Obtener todas (con populate)
// =========================
router.get('/', verifyToken, async (req, res) => {
  try {
    const cotizaciones = await Cotizacion.find()
      .populate("productos.itemId", "nombre")
      .sort({ createdAt: -1 });
    res.json(cotizaciones);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener cotizaciones' });
  }
});


// ✅ Declaración global para esta ruta
const estadosValidos = ['borrador', 'finalizada', 'cancelada'];

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    let resultado;

    // 🔹 Si el parámetro es un estado válido
    if (estadosValidos.includes(id)) {
      resultado = await Cotizacion.find({ estado: id })
        .populate("productos.itemId")
        .lean();

      // Asignar siempre nombre de producto
      resultado = resultado.map((cotizacion) => ({
        ...cotizacion,
        productos: cotizacion.productos.map((p) => ({
          ...p,
          nombre: p.itemId?.nombre || p.nombre,
        })),
      }));

      return res.json(resultado);
    }

    // 🔹 Si es un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID no válido" });
    }

    const cotizacion = await Cotizacion.findById(id)
      .populate("productos.itemId")
      .lean();

    if (!cotizacion) {
      return res.status(404).json({ error: "Cotización no encontrada" });
    }

    // Siempre asignamos nombre (del item o respaldo)
    cotizacion.productos = cotizacion.productos.map((p) => ({
      ...p,
      nombre: p.itemId?.nombre || p.nombre,
    }));

    res.json(cotizacion);
  } catch (err) {
    console.error("Error obteniendo cotización:", err);
    res.status(500).json({ error: "Error obteniendo cotización" });
  }
});


// =========================
// 📌 Convertir a Nota
// =========================
router.post('/:id/convertir-a-nota', verifyToken, async (req, res) => {
  try {
    const cotizacion = await Cotizacion.findById(req.params.id);
    if (!cotizacion) return res.status(404).json({ error: "Cotización no encontrada" });

    const numeroFinal = await obtenerNuevoCorrelativoSeguro('nota');

    const nuevaNota = await Cotizacion.create({
      ...cotizacion.toObject(),
      _id: undefined,
      tipo: 'nota',
      numero: numeroFinal,
      cotizacionOriginalId: cotizacion._id,
      estado: 'finalizada',
    });

    // 📦 Comprometer stock
    for (const p of nuevaNota.productos) {
      const item = await Item.findById(p.itemId);
      if (item) {
        item.comprometidos.push({
          nombre: p.nombre,
          cantidad: p.cantidad,
          hasta: new Date(nuevaNota.fechaEntrega),
          cotizacionId: nuevaNota._id,
        });
        await item.save();
      }
    }

    res.status(201).json(nuevaNota);
  } catch (error) {
    console.error("Error al convertir a nota:", error);
    res.status(500).json({ error: "Error al convertir a nota" });
  }
});

// =========================
// 📌 Actualizar (PUT)
// =========================
// PUT actualizar cotización
// PUT actualizar cotización
// PUT actualizar cotización
// server/routes/cotizaciones.js
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const productos = (req.body.productos || []).map(p => ({
      itemId: typeof p.itemId === 'string' ? p.itemId : p.itemId._id?.toString(),
      nombre: p.nombre,
      cantidad: Number(p.cantidad),
      precio: Number(p.precio),
      total: Number(p.total)
    }));

    const updated = await Cotizacion.findByIdAndUpdate(
      req.params.id,
      { ...req.body, productos },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    console.error('Error al actualizar cotización:', err);
    res.status(500).json({ error: 'Error al actualizar cotización', detalles: err });
  }
});

router.put('/:id/anular', verifyToken, async (req, res) => {
  try {
    const cotizacion = await Cotizacion.findByIdAndUpdate(
      req.params.id,
      { anulada: true },
      { new: true }
    );
    if (!cotizacion) return res.status(404).json({ error: 'No encontrada' });
    res.json({ ok: true, cotizacion });
  } catch (err) {
    res.status(500).json({ error: 'Error al anular la cotización' });
  }
});



module.exports = router;

