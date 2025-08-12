const multer = require('multer');
const path = require('path');
const fs = require('fs');
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const Cotizacion = require('../models/Cotizacion');
const Item = require('../models/Item');
const { generarGuiaPDF } = require('../utils/pdf');

const { obtenerNuevoCorrelativoSeguro } = require('../utils/correlativo');

const mongoose = require('mongoose')


// 🔹 Función para obtener correlativo
async function obtenerNuevoCorrelativo(tipoDocumento) {
  const ultima = await Cotizacion.findOne({ tipoDocumento })
    .sort({ numeroDocumento: -1 });
  return ultima ? ultima.numeroDocumento + 1 : 1;
}

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

 // Verificar si cada cotización fue convertida a nota
    const cotizacionesConEstado = await Promise.all(
      cotizaciones.map(async (c) => {
        const fueConvertida = await Cotizacion.findOne({ cotizacionOriginalId: c._id, tipo: 'nota' });
        return {
          ...c.toObject(),
          yaConvertida: Boolean(fueConvertida),
        };
      })
    );
   res.json(cotizacionesConEstado);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener cotizaciones' });
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
      rutCliente,
      giroCliente,
      direccionCliente,
      comunaCliente,
      ciudadCliente,
      atencion,
      emailCliente,
      telefonoCliente
    } = req.body;

    if (!['cotizacion', 'nota'].includes(tipo)) {
      return res.status(400).json({ error: 'Tipo inválido (cotizacion o nota)' });
    }

    if (!Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ error: 'Debe incluir al menos un producto' });
    }

    // Validar fechaEntrega o asignar fecha hoy sin hora
    let fechaEntregaValida;
    if (!fechaEntrega || isNaN(new Date(fechaEntrega).getTime())) {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      fechaEntregaValida = hoy.toISOString().split('T')[0];
    } else {
      const soloFecha = new Date(fechaEntrega);
      soloFecha.setHours(0, 0, 0, 0);
      fechaEntregaValida = soloFecha.toISOString().split('T')[0];
    }

    // Validar existencia y stock (solo si es nota)
    for (const p of productos) {
      const item = await Item.findById(p.itemId);
      if (!item && tipo === 'nota') {
        return res.status(400).json({ error: `Producto no encontrado: ${p.itemId}` });
      }
    }

    // Preparar productos con precios
    const productosConPrecio = await Promise.all(
      productos.map(async (p) => {
        const item = await Item.findById(p.itemId);
        const cantidad = Number(p.cantidad);
        const precio = item ? Number(item.precio) : 0;
        if (isNaN(cantidad) || isNaN(precio)) {
          throw new Error(`Producto inválido: cantidad=${p.cantidad}, precio=${item ? item.precio : '0'}`);
        }
        return {
          itemId: item ? item._id : p.itemId,
          nombre: item ? item.nombre : '[Producto eliminado]',
          cantidad,
          precio,
          total: cantidad * precio,
        };
      })
    );

    const total = productosConPrecio.reduce((acc, p) => acc + p.total, 0);
    let numeroFinal = null;
    let cotizacion;

    if (_id) {
      // Editar cotización existente
      const cotizacionExistente = await Cotizacion.findById(_id);

      numeroFinal = cotizacionExistente?.numero || null;

      // Si estaba en borrador y ahora no, asignar nuevo correlativo seguro
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
          productos: productosConPrecio,
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
          telefonoCliente
        },
        { new: true }
      );

    } else {
      // Crear nueva cotización
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
        productos: productosConPrecio,
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
        telefonoCliente
      });
    }

    // Comprometer stock si es nota
    if (tipo === 'nota') {
      const fechaEntregaObj = new Date(cotizacion.fechaEntrega);
      if (isNaN(fechaEntregaObj)) {
        return res.status(400).json({ error: 'Fecha de entrega inválida' });
      }
      for (const p of productos) {
        const item = await Item.findById(p.itemId);
        if (item) {
          item.comprometidos.push({
            cantidad: p.cantidad,
            hasta: fechaEntregaObj,
            cotizacionId: cotizacion._id
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


// Listar borradores
router.get('/borradores', async (req, res) => {
  try {
    const borradores = await Cotizacion.find({ estado: 'borrador' }).sort({ updatedAt: -1 });
    res.json(borradores);
  } catch (err) {
    res.status(500).json({ error: 'Error al listar borradores' });
  }
});



// Guardar borrador (protegido)
router.post('/borrador', verifyToken, async (req, res) => {
  try {
   const {
  cliente,
  direccion,
  fechaEntrega,
  metodoPago,
  tipo,
  productos,
  rutCliente,
  giroCliente,
  direccionCliente,
  comunaCliente,
  ciudadCliente,
  atencion,
  emailCliente,
  telefonoCliente
} = req.body;


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
      rutCliente,
      giroCliente,
      direccionCliente,
      comunaCliente,
      ciudadCliente,
       atencion,
      emailCliente,
    telefonoCliente


    });

    await nuevaCotizacion.save();

    res.status(200).json({ message: 'Borrador guardado', _id: nuevaCotizacion._id });
  } catch (error) {
    console.error('Error al guardar borrador:', error);
    res.status(500).json({ message: 'Error al guardar borrador' });
  }
});


// Crear cotización desde borrador
router.post('/desde-borrador/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 1️⃣ Validar que el ID sea válido → evita CastError
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    // 2️⃣ Buscar borrador válido
    const borrador = await Cotizacion.findById(id);

    if (!borrador || borrador.estado !== 'borrador' || borrador.tipo !== 'cotizacion') {
      return res.status(400).json({ error: 'No es un borrador válido' });
    }

    // 3️⃣ Evitar conversión duplicada
    const yaExiste = await Cotizacion.findOne({ cotizacionOriginalId: borrador._id, tipo: 'cotizacion' });
    if (yaExiste) {
      return res.status(400).json({ error: 'Este borrador ya fue convertido' });
    }

    // 4️⃣ Usar tu función para obtener un número único
    const nuevoNumero = await obtenerNuevoCorrelativoSeguro('cotizacion');

    // 5️⃣ Crear nueva cotización
    const nuevaCotizacion = new Cotizacion({
      ...borrador.toObject(),
      _id: undefined,
      estado: 'finalizada',
      numero: nuevoNumero,
      cotizacionOriginalId: borrador._id,
    });

    await nuevaCotizacion.save();
    await borrador.deleteOne();

    res.json(nuevaCotizacion);
  } catch (err) {
    console.error("Error al convertir borrador:", err);
    res.status(500).json({ error: 'Error al convertir borrador' });
  }
});




// PUT para actualizar borrador y pasarlo a cotización
router.put('/borrador-a-cotizacion/:id', verifyToken, async (req, res) => {
  try {
    const id = req.params.id;
    
    const {
      cliente,
      direccion,
      rutCliente,
      giroCliente,
      direccionCliente,
      comunaCliente,
      ciudadCliente,
      atencion,
      emailCliente,
      telefonoCliente,
      fechaHoy,
      fechaEntrega,
      metodoPago,
      productos
    } = req.body;
    
     // Obtener nuevo número correlativo seguro para cotización
    const nuevoNumero = await obtenerNuevoCorrelativoSeguro('cotizacion');

    // Actualiza y cambia tipo a "cotizacion"
    const cotizacionActualizada = await Cotizacion.findByIdAndUpdate(
      id,
      {
        cliente,
        direccion,
        rutCliente,
        giroCliente,
        direccionCliente,
        comunaCliente,
        ciudadCliente,
        atencion,
        emailCliente,
        telefonoCliente,
        fechaHoy,
        fechaEntrega,
        metodoPago,
        tipo: "cotizacion", // se convierte
         numero: nuevoNumero,
         estado: 'finalizada',
        productos
      },
      { new: true }
    );

    res.json(cotizacionActualizada);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar borrador" });
  }
});


// Obtener cotización por ID (borrador o finalizada)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validación: prevenir errores de ObjectId
    if (!id || id === 'null' || id === 'undefined') {
      return res.status(400).json({ message: 'ID no válido' });
    }

    const cotizacion = await Cotizacion.findById(id);
    if (!cotizacion) return res.status(404).json({ message: 'Cotización no encontrada' });

    res.json(cotizacion);
  } catch (err) {
    console.error('Error al obtener cotización:', err);
    res.status(500).json({ message: 'Error del servidor' });
  }
});


// Anular nota de venta por id (y liberar stock comprometido)
router.put('/:id/anular', async (req, res) => {
  try {
    const nota = await Cotizacion.findById(req.params.id);
    if (!nota) return res.status(404).json({ message: 'Nota no encontrada' });

    if (nota.tipo !== 'nota') {
      return res.status(400).json({ message: 'Solo se pueden anular notas de venta' });
    }

    // Marcar como anulada
    nota.anulada = true;
    await nota.save();

    // Eliminar stock comprometido relacionado a esta nota
    for (const p of nota.productos) {
      const item = await Item.findById(p.itemId);
      if (item) {
        item.comprometidos = item.comprometidos.filter(
          (comp) => String(comp.cotizacionId) !== String(nota._id)
        );
        await item.save();
      }
    }

    res.json({ message: 'Nota anulada correctamente y stock liberado' });
  } catch (err) {
    console.error('Error al anular nota:', err);
    res.status(500).json({ message: 'Error del servidor' });
  }
});



// ✅ Convertir cotización a nota de venta correctamente (reserva stock, genera número y PDF)
router.post('/:id/convertir-a-nota', verifyToken, async (req, res) => {
  try {
    const cotizacion = await Cotizacion.findById(req.params.id);
    if (!cotizacion) return res.status(404).json({ error: 'Cotización no encontrada' });
    if (cotizacion.estado === 'borrador')
      return res.status(400).json({ error: 'No se puede generar nota desde un borrador' });
    if (cotizacion.tipo === 'nota')
      return res.status(400).json({ error: 'Ya es una nota de venta' });

    if (cotizacion.tipo !== 'cotizacion') {
      return res.status(400).json({ error: 'Solo se puede convertir una cotización' });
    }

    // 🚫 NUEVO: verificar si ya fue convertida
    const yaConvertida = await Cotizacion.findOne({ cotizacionOriginalId: cotizacion._id, tipo: 'nota' });
    if (yaConvertida) {
      return res.status(400).json({ error: 'Esta cotización ya fue convertida a una nota de venta' });
    }
    
 // para que no de error duplicado numero
const nuevoNumero = await obtenerNuevoCorrelativoSeguro('nota');

    // Crear nueva nota con datos de la cotización
    const nuevaNota = await Cotizacion.create({
      cliente: cotizacion.cliente,
      direccion: cotizacion.direccion,
      fechaHoy: new Date().toLocaleDateString('es-CL'),
      fechaEntrega: cotizacion.fechaEntrega,
      metodoPago: cotizacion.metodoPago,
      tipo: 'nota',
      numero: nuevoNumero,
      numeroDocumento: nuevoNumero,
      productos: cotizacion.productos,
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
      pdfUrl: '',
      cotizacionOriginalId: cotizacion._id,
    });

    // Generar PDF con jsPDF y autotable
    const pdfBuffer = generarGuiaPDF(
      cotizacion.cliente,
      cotizacion.productos,
      {
        tipo: 'nota',
        direccion: cotizacion.direccion,
        fechaEntrega: cotizacion.fechaEntrega,
        metodoPago: cotizacion.metodoPago,
        tipoDocumento: 'nota',
        numeroDocumento: nuevoNumero,
        rutCliente: cotizacion.rutCliente,
        giroCliente: cotizacion.giroCliente,
        direccionCliente: cotizacion.direccionCliente,
        comunaCliente: cotizacion.comunaCliente,
        ciudadCliente: cotizacion.ciudadCliente,
        atencion: cotizacion.atencion,
        emailCliente: cotizacion.emailCliente,
        telefonoCliente: cotizacion.telefonoCliente,
      }
    );

    // Guardar PDF en disco
    const filename = `nota-${nuevaNota._id}.pdf`;
    const filepath = path.join(__dirname, `../uploads/${filename}`);
    fs.writeFileSync(filepath, pdfBuffer);

    nuevaNota.pdfUrl = `/uploads/${filename}`;
    
    await nuevaNota.save();
      // ✅ Reservar stock al convertir a nota
for (const p of cotizacion.productos) {
  const item = await Item.findById(p.itemId);
  if (item) {
    item.comprometidos.push({
      cantidad: p.cantidad,
      hasta: new Date(nuevaNota.fechaEntrega),
      cotizacionId: nuevaNota._id
    });
    await item.save();
  }
}

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

       if (cotizacion.tipo === 'cotizacion') {
            const fueConvertida = await Cotizacion.findOne({ cotizacionOriginalId: cotizacion._id, tipo: 'nota' });
            if (fueConvertida) {
              return res.status(403).json({ error: 'Cotización ya fue convertida. No se puede editar.' });
            }
          }

   const {
  cliente,
  direccion,
  rutCliente,
  fechaEntrega,
  metodoPago,
  tipo,
  productos,
  giroCliente,
  direccionCliente,
  comunaCliente,
  ciudadCliente,
  atencion,
  emailCliente,
  telefonoCliente,
} = req.body;


    cotizacion.cliente = cliente;
    cotizacion.rutCliente = rutCliente;
    cotizacion.direccion = direccion;
    cotizacion.fechaEntrega = fechaEntrega;
    cotizacion.metodoPago = metodoPago;
    cotizacion.tipo = tipo;

    cotizacion.giroCliente = giroCliente ?? '';
    cotizacion.direccionCliente = direccionCliente ?? '';
    cotizacion.comunaCliente = comunaCliente;
    cotizacion.ciudadCliente = ciudadCliente;
    cotizacion.atencion = atencion;
    cotizacion.emailCliente = emailCliente;
    cotizacion.telefonoCliente = telefonoCliente;

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
