const multer = require('multer');
const path = require('path');
const fs = require('fs');
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const Cotizacion = require('../models/Cotizacion');
const Item = require('../models/Item');
const obtenerProximoNumero = require('../utils/generarNumero');

// Config multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// Subir PDF
router.post('/upload-pdf', upload.single('file'), async (req, res) => {
  try {
    const { cotizacionId } = req.body;
    const filePath = `/uploads/${req.file.filename}`;
    await Cotizacion.findByIdAndUpdate(cotizacionId, { pdfUrl: filePath });
    res.json({ message: 'PDF guardado', pdfUrl: filePath });
  } catch (err) {
    console.error('Error al subir PDF:', err);
    res.status(500).json({ error: 'Error al subir el PDF' });
  }
});

// Listar notas
router.get('/notas', async (req, res) => {
  try {
    const notas = await Cotizacion.find({ tipo: 'nota' });
    res.json(notas);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Listar todos (finalizadas y borradores)
router.get('/', async (req, res) => {
  try {
    const cotizaciones = await Cotizacion.find();
    res.json(cotizaciones);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener cotizaciones' });
  }
});


// Obtener cotización por ID (borrador o finalizada)
router.get('/:id', async (req, res) => {
  try {
    const cotizacion = await Cotizacion.findById(req.params.id);
    if (!cotizacion) return res.status(404).json({ message: 'Cotización no encontrada' });
    res.json(cotizacion);
  } catch (err) {
    console.error('Error al obtener cotización:', err);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Listar borradores
router.get('/borradores', async (req, res) => {
  try {
    const borradores = await Cotizacion.find({ estado: 'borrador' }).sort({ updatedAt: -1 });
    res.json(borradores);
  } catch (err) {
    res.status(500).json({ error: 'Error al listar borradores' });
  }
});

// Obtener cotización finalizada por ID
router.get('/finalizada/:id', async (req, res) => {
  try {
    const cotizacion = await Cotizacion.findOne({ _id: req.params.id, estado: 'finalizada' });
    if (!cotizacion) return res.status(404).json({ message: 'Cotización finalizada no encontrada' });
    res.json(cotizacion);
  } catch (error) {
    console.error('Error al obtener cotización finalizada:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});


// Obtener borrador por ID
router.get('/borrador/:id', async (req, res) => {
  try {
    const borrador = await Cotizacion.findOne({ _id: req.params.id, estado: 'borrador' });
    if (!borrador) return res.status(404).json({ message: 'Borrador no encontrado' });
    res.json(borrador);
  } catch (error) {
    console.error('Error al obtener borrador:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Guardar borrador (protegido)
router.post('/borrador', verifyToken, async (req, res) => {
  try {
    const { cliente, direccion, fechaEntrega, metodoPago, tipo, productos } = req.body;

    const productosConTotal = productos.map(p => ({
      ...p,
      total: p.cantidad * p.precio,
    }));

    const total = productosConTotal.reduce((acc, p) => acc + p.total, 0);

    const nuevaCotizacion = new Cotizacion({
      cliente,
      direccion,
      fechaHoy: new Date().toLocaleDateString('es-CL'),
      fechaEntrega,
      metodoPago,
      tipo,
      total,
      estado: 'borrador',
      productos: productosConTotal,
    });

    await nuevaCotizacion.save();

    res.status(200).json({ message: 'Borrador guardado', _id: nuevaCotizacion._id });
  } catch (error) {
    console.error('Error al guardar borrador:', error);
    res.status(500).json({ message: 'Error al guardar borrador' });
  }
});

// ✅ Convertir cotización a nota de venta correctamente (reserva stock, genera número y PDF)
router.post('/:id/convertir-a-nota', verifyToken, async (req, res) => {
  try {
    const cotizacion = await Cotizacion.findById(req.params.id);
    if (!cotizacion) {
      return res.status(404).json({ error: 'Cotización no encontrada' });
    }

    if (cotizacion.tipo === 'nota') {
      return res.status(400).json({ error: 'Ya es una nota de venta' });
    }

    // Verificar si ya existe una nota de venta para esta cotización
const notaExistente = await Cotizacion.findOne({ cotizacionOriginalId: cotizacion._id });
if (notaExistente) {
  return res.status(400).json({ error: 'Esta cotización ya fue convertida a nota de venta' });
}

            // Buscar la última nota con número válido
      const ultimaNota = await Cotizacion.findOne({
        tipo: 'nota',
        numero: { $exists: true, $ne: null }
      }).sort({ numero: -1 });

      let nuevoNumero = 8636 + 1;
      if (ultimaNota && typeof ultimaNota.numero === 'number' && ultimaNota.numero >= 8636) {
        nuevoNumero = ultimaNota.numero + 1;
      }


    // Convertir productos para nuevo documento
    const productosConPrecio = cotizacion.productos.map(p => ({
      itemId: p.itemId,
      nombre: p.nombre,
      cantidad: p.cantidad,
      precio: p.precio,
      total: p.total
    }));

    // Crear nueva nota de venta
    const nuevaNota = await Cotizacion.create({
      cliente: cotizacion.cliente,
      direccion: cotizacion.direccion,
      fechaHoy: new Date().toLocaleDateString('es-CL'),
      fechaEntrega: cotizacion.fechaEntrega,
      metodoPago: cotizacion.metodoPago,
      tipo: 'nota',
      numero: nuevoNumero,
       numeroDocumento: nuevoNumero,
      productos: productosConPrecio,
      total: cotizacion.total,
      estado: 'finalizada',
      rutCliente: cotizacion.rutCliente || '',
      giroCliente: cotizacion.giroCliente || '',
      direccionCliente: cotizacion.direccionCliente || '',
      comunaCliente: cotizacion.comunaCliente || '',
      ciudadCliente: cotizacion.ciudadCliente || '',
      atencion: cotizacion.atencion || '',
      emailCliente: cotizacion.emailCliente || '',
      telefonoCliente: cotizacion.telefonoCliente || '',
      pdfUrl: cotizacion.pdfUrl || '',
       cotizacionOriginalId: cotizacion._id, // ← Aquí se liga
    });

    // ✅ Comprometer stock
    for (const p of productosConPrecio) {
      const item = await Item.findById(p.itemId);
      if (item) {
        item.comprometidos.push({
          cantidad: p.cantidad,
          hasta: new Date(cotizacion.fechaEntrega),
          cotizacionId: nuevaNota._id
        });
        await item.save();
      }
    }

    nuevaNota.cotizacionId = cotizacion._id;
    await nuevaNota.save();

    res.status(201).json(nuevaNota);
  } catch (err) {
    console.error('Error al convertir cotización:', err);
    res.status(500).json({ error: 'Error al convertir a nota de venta' });
  }
});

router.put('/:id', verifyToken, async (req, res) => {
  try {
    const cotizacion = await Cotizacion.findById(req.params.id);
    if (!cotizacion) return res.status(404).send('Cotización no encontrada');

    const { cliente, direccion, rutCliente, fechaEntrega, metodoPago, tipo, productos } = req.body;

    cotizacion.cliente = cliente;
    cotizacion.rutCliente = rutCliente;
    cotizacion.direccion = direccion;
    cotizacion.fechaEntrega = fechaEntrega;
    cotizacion.metodoPago = metodoPago;
    cotizacion.tipo = tipo;

    // Validar productos
   const productosValidados = await Promise.all(
  productos.map(async (p, index) => {
    const cantidad = Number(p.cantidad);
    let precio = Number(p.precio);

    if (isNaN(precio)) {
      const item = await Item.findById(p.itemId);
      precio = item ? item.precio : 0;
    }

    const total = cantidad * precio;

    if (isNaN(cantidad) || isNaN(precio) || isNaN(total)) {
      throw new Error(`Producto #${index + 1} tiene datos inválidos: cantidad=${p.cantidad}, precio=${p.precio}`);
    }

    return {
      ...p,
      cantidad,
      precio,
      total,
    };
  })
);


    cotizacion.productos = productosValidados;
    cotizacion.total = productosValidados.reduce((acc, p) => acc + p.total, 0);

    await cotizacion.save();
    res.json(cotizacion);
  } catch (err) {
    console.error('Error al actualizar cotización:', err.message || err);
    res.status(500).send('Error del servidor');
  }
});



// Crear o actualizar cotización o nota (protegido)
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
      estado, // opcional para actualizar estado
    } = req.body;

    if (!['cotizacion', 'nota'].includes(tipo)) {
      return res.status(400).json({ error: 'Tipo inválido (cotizacion o nota)' });
    }

    if (!Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ error: 'Debe incluir al menos un producto' });
    }

    // Validar existencia y stock (solo si es nota)
    for (const p of productos) {
      const item = await Item.findById(p.itemId);

      if (!item && tipo === 'nota') {
        return res.status(400).json({ error: `Producto no encontrado: ${p.itemId}` });
      }

      if (!item && tipo === 'cotizacion') {
        continue;
      }

     
    }

    // Preparar productos con precios
    const productosConPrecio = await Promise.all(
      productos.map(async (p) => {
        const item = await Item.findById(p.itemId);

        if (!item) {
          return {
            itemId: p.itemId,
            nombre: '[Producto eliminado]',
            cantidad: p.cantidad,
            precio: 0,
            total: 0,
          };
        }

        return {
          itemId: item._id,
          nombre: item.nombre,
          cantidad: p.cantidad,
          precio: item.precio,
          total: item.precio * p.cantidad
        };
      })
    );

    const total = productosConPrecio.reduce((acc, p) => acc + p.total, 0);

    // CORRELATIVO por tipo
    const rangoBaseCotizacion = 10000;
    const rangoBaseNota = 8636;

    let rangoInicial = tipo === 'cotizacion' ? rangoBaseCotizacion : rangoBaseNota;

    const ultima = await Cotizacion.findOne({ tipo }).sort({ numero: -1 });

    let nuevoNumero = !ultima || typeof ultima.numero !== 'number' || ultima.numero < rangoInicial
      ? rangoInicial + 1
      : ultima.numero + 1;

    let cotizacion;

    if (_id) {
      // Actualizar documento existente
      cotizacion = await Cotizacion.findByIdAndUpdate(_id, {
        cliente,
        direccion,
        fechaHoy,
        fechaEntrega,
        metodoPago,
        tipo,
        numero: nuevoNumero,
        productos: productosConPrecio,
        total,
        numeroDocumento,
        tipoDocumento,
        estado: estado || 'finalizada'
      }, { new: true });
    } else {
      // Crear nuevo documento
      cotizacion = await Cotizacion.create({
        cliente,
        direccion,
        fechaHoy,
        fechaEntrega,
        metodoPago,
        tipo,
        numero: nuevoNumero,
        productos: productosConPrecio,
        total,
        numeroDocumento,
        tipoDocumento,
        estado: 'finalizada'
      });
    }



    // Comprometer stock si la fecha de entrega es futura
    if (tipo === 'nota' ) {
      const fechaEntrega = new Date(cotizacion.fechaEntrega);
      if (isNaN(fechaEntrega)) {
        return res.status(400).json({ error: 'Fecha de entrega inválida' });
      }
      for (const p of productos) {
        const item = await Item.findById(p.itemId);
        if (item) {
          item.comprometidos.push({
            cantidad: p.cantidad,
            hasta: new Date(fechaEntrega),
            cotizacionId: cotizacion._id
          });
          await item.save();
        }
      }
    }
    res.status(201).json(cotizacion);
  } catch (error) {
    console.error('❌ Error al crear cotización:', error);
    res.status(500).json({ error: 'Error al crear cotización' });
  }
});




// Eliminar cotización o borrador
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await Cotizacion.findByIdAndDelete(req.params.id);
    res.status(200).json({ mensaje: 'Cotización eliminada' });
  } catch (err) {
    console.error('Error al eliminar cotización:', err);
    res.status(500).json({ error: 'Error al eliminar cotización' });
  }
});

module.exports = router;
