// routes/cotizaciones.js
const express = require('express');
const router = express.Router();
const Cotizacion = require('../models/Cotizacion');
const Item = require('../models/Item');
const ExcelJS = require('exceljs');
const verifyToken = require('../middleware/verifyToken');
const mongoose = require('mongoose');
const { obtenerNuevoCorrelativoSeguro } = require('../utils/correlativo');
const {
  cotizacionAdminSchema,
  cotizacionPublicaSchema
} = require("../validators/cotizacionSchemas");
const fs = require('fs');
const path = require('path');
const { generarGuiaPDF } = require('../utils/pdf');
const User = require("../models/User");
const Empresa = require("../models/Empresa");
const Cliente = require("../models/Cliente");

const { z } = require("zod");
const sanitizeHtml = require("sanitize-html");
const isAdmin = require('../middleware/requireAdmin')

const parseFecha = (fecha) => {
  if (!fecha) return null;

  // ✅ evita problemas UTC/timezone
  const [year, month, day] = fecha.split("-").map(Number);

  const d = new Date(year, month - 1, day);

  if (isNaN(d.getTime())) return null;

  d.setHours(0, 0, 0, 0);

  return d;
};

// =========================
// 🔐 Rate limit SOLO para este endpoint
// =========================
const rateLimit = require("express-rate-limit");

const publicLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 min
  max: 30, // máx 30 requests
  message: { error: "Demasiadas solicitudes, intenta más tarde" }
});
// =========================
// 🔐 Schema de validación
// =========================


// =========================
// 📌 Crear o actualizar Cotización / Nota
// =========================
router.post('/', verifyToken, async (req, res) => {
  try {
    const {
      cliente,
      clienteId,
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
    console.log(
      "Productos recibidos:",
      JSON.stringify(productos, null, 2)
    );
    const productosValidados = await Promise.all(
      productos.map(async (p) => {
        const cantidad = Number(p.cantidad || 0);
        const precio = Number(p.precio || 0);

        let costo = 0;
        let codigo = '';

        let unidad = p.unidad || 'unidad';

        if (unidad === 'mts') {
          unidad = 'metro_lineal';
        }

        if (p.itemId) {
          const item = await Item.findById(p.itemId);

          if (item) {
            costo = item.costo ?? 0;
            codigo = item.codigo ?? '';

            // Solo usar la unidad del item si no vino desde el frontend
            if (!p.unidad) {
              unidad = item.unidad ?? 'unidad';
            }
          }
        }

        return {
          itemId: p.itemId,
          codigo,
          cantidad,
          nombre: p.nombre,
          precio,
          costo,
          total: cantidad * precio,
          unidad,
        };
      })
    );

    const total = productosValidados.reduce((acc, p) => acc + p.total, 0);

    // ========================================
    // Crear o actualizar cliente automáticamente
    // ========================================

    let clienteDB = null;

    if (cliente?.trim()) {

      clienteDB = await Cliente.findOne({
        empresa: req.user.empresa,
        nombre: cliente.trim(),
        activo: true
      });

      if (!clienteDB) {

        clienteDB = await Cliente.create({
          empresa: req.user.empresa,

          nombre: cliente.trim(),

          rut: rutCliente || "",

          direccion: direccionCliente || direccion || "",

          comuna: comunaCliente || "",

          ciudad: ciudadCliente || "",

          giro: giroCliente || "",

          telefono: telefonoCliente || "",

          email: emailCliente || "",

          contacto: atencion || ""
        });

        console.log("✅ Cliente creado:", clienteDB.nombre);

      } else {

        clienteDB.rut = rutCliente || clienteDB.rut;

        clienteDB.direccion = direccionCliente || direccion || clienteDB.direccion;

        clienteDB.comuna = comunaCliente || clienteDB.comuna;

        clienteDB.ciudad = ciudadCliente || clienteDB.ciudad;

        clienteDB.giro = giroCliente || clienteDB.giro;

        clienteDB.telefono = telefonoCliente || clienteDB.telefono;

        clienteDB.email = emailCliente || clienteDB.email;

        clienteDB.contacto = atencion || clienteDB.contacto;

        await clienteDB.save();

        console.log("🔄 Cliente actualizado:", clienteDB.nombre);

      }

    }


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
          cliente: clienteDB ? clienteDB._id : null,
          clienteRef: clienteDB ? clienteDB._id : null,
          clienteId: clienteDB ? clienteDB._id : null,
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
      console.log(
        "📦 Productos antes de guardar:",
        JSON.stringify(productosValidados, null, 2)
      );
      cotizacion = await Cotizacion.create({
        cliente: clienteDB ? clienteDB._id : null,

        clienteRef: clienteDB ? clienteDB._id : null,

        clienteId: clienteDB ? clienteDB._id : null,
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
        createdBy: req.user.id,
        atencion,
        emailCliente,
        telefonoCliente,
        formaPago: formaPago ?? '',
        nota: nota ?? '',
        empresa: req.user.empresa,
      });
    }

    if (tipo === 'nota' && estado !== 'borrador') {
      for (const p of productosValidados) {
        await Item.updateOne(
          { _id: p.itemId },
          {
            $push: {
              comprometidos: {
                cantidad: p.cantidad,
                hasta: fechaEntregaObj,
                cotizacionId: cotizacion._id,
              }
            }
          }
        );
      }
    }

    // 📌 Validar stock y generar warnings (pero no bloquear)
    let warnings = [];
    for (const p of productos) {
      if (tipo === 'nota') {
        const item = await Item.findById(p.itemId);
        if (item && item.cantidad < p.cantidad) {
          warnings.push(`Stock insuficiente para ${item.nombre}. Disponible: ${item.cantidad}, solicitado: ${p.cantidad}`);
        }
      }
    }

    res.status(201).json({
      cotizacion,
      warnings
    });
    console.log(
      JSON.stringify(productosValidados, null, 2)
    );
    console.log("=================================");
    console.log("FORMA PAGO FINAL:", formaPago);
    console.log("NOTA FINAL:", nota);
    console.log("TIPO:", tipo);
    console.log("=================================");
    // =========================
    // 📄 GENERAR PDF AUTOMÁTICO
    // =========================
    if (estado !== 'borrador') {


      const clientePDF = clienteDB?.nombre || "";

      const pdfBuffer = generarGuiaPDF(
        clientePDF,
        productosValidados,
        {
          numeroDocumento: numeroFinal,
          tipo,
          rutCliente,
          giroCliente,
          direccionCliente,
          comunaCliente,
          ciudadCliente,
          atencion,
          emailCliente,
          telefonoCliente,
          fechaEntrega: fechaEntregaValida,
          metodoPago,
          direccion,
          formaPago,
          nota
        }
      );

      const nombreArchivo =
        `${tipo}-${numeroFinal}.pdf`;

      const carpetaPDF = path.join(
        __dirname,
        '../uploads/pdfs'
      );

      if (!fs.existsSync(carpetaPDF)) {
        fs.mkdirSync(carpetaPDF, {
          recursive: true
        });
      }

      const rutaPDF = path.join(
        carpetaPDF,
        nombreArchivo
      );

      fs.writeFileSync(rutaPDF, pdfBuffer);

      cotizacion.pdfUrl =
        `/uploads/pdfs/${nombreArchivo}`;

      await cotizacion.save();
    }
  } catch (error) {
    console.error('Error al crear o actualizar cotización:', error);
    res.status(500).json({ error: 'Error al crear o actualizar cotización' });
  }
});

// =========================
// 📌 Obtener todas (con populate)
// =========================
router.get('/',
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {

      let empresaId = req.user.empresa;

      // 🔥 AUTO FIX: si no tiene empresa, crearla
      if (!empresaId) {
        const user = await User.findById(req.user.id || req.user._id);

        const nuevaEmpresa = await Empresa.create({
          nombre: `Empresa de ${user.name}`,
          owner: user._id
        });

        empresaId = nuevaEmpresa._id;

        await User.findByIdAndUpdate(user._id, {
          empresa: empresaId
        });
      }

      const cotizaciones = await Cotizacion.find({
        empresa: req.user.empresa
      })
        .populate("cliente", "nombre rut telefono email giro direccion comuna ciudad")
        .populate("productos.itemId", "nombre costo")
        .populate("createdBy", "name email role")
        .sort({ createdAt: -1 })
        .lean();

      console.log("PRIMERA COTIZACION:");
      console.log(JSON.stringify(cotizaciones[0], null, 2));


      const resultado = cotizaciones.map((c) => ({
        ...c,

        nombreCliente:
          c.cliente?.nombre ||
          c.clienteSnapshot?.nombre ||
          "",

        rutCliente:
          c.cliente?.rut ||
          c.clienteSnapshot?.rut ||
          c.rutCliente ||
          "",

        telefonoCliente:
          c.cliente?.telefono ||
          c.clienteSnapshot?.telefono ||
          c.telefonoCliente ||
          "",

        emailCliente:
          c.cliente?.email ||
          c.clienteSnapshot?.email ||
          c.emailCliente ||
          "",
      }));

      return res.json(resultado);


    } catch (error) {
      console.error(error);
      return res.status(500).json({
        error: 'Error al obtener cotizaciones'
      });
    }
  }
);


// ✅ Declaración global para esta ruta
const estadosValidos = [
  'borrador',
  'finalizada',
  'convertida',
  'cancelada'
];

// =========================
// 🧠 NORMALIZADOR DE TEXTO
// =========================
const normalizarTexto = (texto = "") => {
  return texto
    .toLowerCase()
    .normalize("NFD") // separa letras y tildes
    .replace(/[\u0300-\u036f]/g, "") // elimina tildes
    .replace(/[^a-z0-9\s]/g, "") // elimina símbolos
    .replace(/\s+/g, " ") // espacios múltiples → uno
    .trim();
};

router.post('/public', publicLimiter, async (req, res) => {
  try {
    console.log("📥 REQUEST /public");

    // =========================
    // 🔍 VALIDAR INPUT
    // =========================
    const parsed =
      cotizacionPublicaSchema.safeParse(req.body);

    if (!parsed.success) {

      console.log(
        "❌ VALIDACIÓN FALLÓ"
      );

      console.log(
        JSON.stringify(
          parsed.error.flatten(),
          null,
          2
        )
      );

      return res.status(400).json({
        error: "Datos inválidos",
        detalles: parsed.error.flatten()
      });
    }

    let {
      cliente,
      emailCliente,
      telefonoCliente,
      direccion,
      metodoPago,
      fechaEntrega,
      productos
    } = parsed.data;

    console.log("📦 productos recibidos:", productos);

    // =========================
    // 🧼 SANITIZAR
    // =========================
    cliente = sanitizeHtml(cliente);
    direccion = sanitizeHtml(direccion);
    emailCliente = sanitizeHtml(emailCliente || "");
    telefonoCliente = sanitizeHtml(telefonoCliente);

    // =========================
    // 🔎 CARGAR ITEMS DB
    // =========================
    const itemsDB = await Item.find({}, "nombre codigo unidad costo");

    // =========================
    // 💰 MATCH INTELIGENTE
    // =========================
    const productosFinal = productos.map((p) => {
      const nombreNormalizado = normalizarTexto(p.nombre);

      // 🔥 1. Buscar por código exacto
      let match = itemsDB.find(
        item => String(item.codigo) === String(p.codigo)
      );

      // 🔥 2. Si no encuentra → fallback por nombre
      if (!match) {
        match = itemsDB.find(item => {
          const itemNombreNorm = normalizarTexto(item.nombre);

          return (
            itemNombreNorm.includes(nombreNormalizado) ||
            nombreNormalizado.includes(itemNombreNorm)
          );
        });
      }

      if (!match) {
        console.log("❌ SIN MATCH:", p.nombre);
      } else {
        console.log("✅ MATCH:", p.nombre, "→", match.nombre);
      }

      const cantidad = Number(p.cantidad);
      const precio = Number(p.precio);

      return {
        itemId: match?._id || null,
        codigo: match?.codigo || '',
        unidad: match?.unidad || 'unidad',
        cantidad,
        nombre: match?.nombre || p.nombre,
        precio,
        costo: match?.costo || 0,
        total: cantidad * precio,
      };
    });

    // =========================
    // 🚫 VALIDAR MATCH
    // =========================
    const sinMatch = productosFinal.filter(p => !p.itemId);

    if (sinMatch.length > 0) {
      console.log("❌ PRODUCTOS SIN MATCH:", sinMatch);

      return res.status(400).json({
        error: "Productos inválidos",
        detalle: sinMatch.map(p => p.nombre)
      });
    }

    // =========================
    // 💵 TOTAL REAL
    // =========================
    const totalReal = productosFinal.reduce(
      (acc, p) => acc + p.total,
      0
    );

    // =========================
    // 🧠 CREAR EN DB
    // =========================
    const fechaEntregaObj = parseFecha(fechaEntrega);

    let fechaEntregaValida = null;

    if (fechaEntregaObj) {
      const year = fechaEntregaObj.getFullYear();
      const month = String(fechaEntregaObj.getMonth() + 1).padStart(2, "0");
      const day = String(fechaEntregaObj.getDate()).padStart(2, "0");

      fechaEntregaValida = `${year}-${month}-${day}`;
    }

    const numeroFinal = await obtenerNuevoCorrelativoSeguro("cotizacion");
    console.log("CORRELATIVO GENERADO:", numeroFinal);
    const nuevaCotizacion = await Cotizacion.create({
      cliente,
      direccion,
      emailCliente,
      telefonoCliente,
      metodoPago,
      numero: numeroFinal,
      fechaEntrega: fechaEntregaValida,
      productos: productosFinal,
      total: totalReal,
      tipo: "cotizacion",
      estado: "finalizada",
      origen: "web_publica",
      empresa: req.user.empresa,
    });

    console.log("✅ Cotización creada:", nuevaCotizacion._id);

    return res.status(201).json({
      ok: true,
      cotizacion: nuevaCotizacion,
      id: nuevaCotizacion._id,
      total: totalReal
    });

  } catch (error) {
    console.error("💥 ERROR /public:", error);

    return res.status(500).json({
      error: "Error interno del servidor"
    });
  }
});

router.get("/debug-items", async (req, res) => {
  const items = await Item.find({}, "nombre codigo");
  res.json(items);
});

// =========================
// 📊 Exportar Excel
// =========================
router.get("/exportar-excel",
  verifyToken,
  isAdmin,
  async (req, res) => {

    try {

      const workbook = new ExcelJS.Workbook();

      const worksheet =
        workbook.addWorksheet(
          "Resumen Notas"
        );

      const notas =
        await Cotizacion.find({
          tipo: "nota"
        })
          .sort({
            createdAt: -1
          })
          .lean();

      worksheet.columns = [
        {
          header: "N° Nota",
          key: "numero",
          width: 12
        },
        {
          header: "Cliente",
          key: "cliente",
          width: 30
        },
        {
          header: "Fecha Entrega",
          key: "fechaEntrega",
          width: 18
        },
        {
          header: "Método Pago",
          key: "metodoPago",
          width: 20
        },
        {
          header: "Neto",
          key: "neto",
          width: 15
        },
        {
          header: "IVA",
          key: "iva",
          width: 15
        },
        {
          header: "Total",
          key: "total",
          width: 15
        },
        {
          header: "Recibido Por",
          key: "recibidoPor",
          width: 20
        },
        {
          header: "Estado",
          key: "estado",
          width: 15
        }
      ];

      notas.forEach((nota) => {

        const neto =
          nota.subtotal ??
          nota.total;

        const iva =
          nota.iva ??
          Math.round(
            neto * 0.19
          );

        const total =
          nota.subtotal
            ? nota.total
            : neto + iva;

        worksheet.addRow({

          numero:
            nota.numero || "",

          cliente:
            nota.cliente || "",

          fechaEntrega:
            nota.fechaEntrega || "",

          metodoPago:
            nota.metodoPago || "",

          neto,

          iva,

          total,

          recibidoPor:
            nota.recibidoPor || "",

          estado:
            nota.estado || ""

        });

      });

      worksheet.getRow(1).font = {
        bold: true
      };

      worksheet.getRow(1).alignment = {
        vertical: "middle",
        horizontal: "center"
      };

      // =========================
      // 📦 Hoja Productos Vendidos
      // =========================

      const productosSheet =
        workbook.addWorksheet(
          "Productos Vendidos"
        );

      productosSheet.columns = [
        {
          header: "Producto",
          key: "nombre",
          width: 30
        },
        {
          header: "Unidad",
          key: "unidad",
          width: 15
        },
        {
          header: "Cantidad Vendida",
          key: "cantidad",
          width: 20
        },
        {
          header: "Ventas Totales",
          key: "ventas",
          width: 18
        },
        {
          header: "Costos Totales",
          key: "costos",
          width: 18
        },
        {
          header: "Ganancia",
          key: "ganancia",
          width: 18
        }
      ];

      const resumenProductos = {};

      notas.forEach((nota) => {

        if (!nota.productos) return;

        nota.productos.forEach((producto) => {

          const nombre =
            producto.nombre || "Sin nombre";

          if (!resumenProductos[nombre]) {

            resumenProductos[nombre] = {

              nombre,

              unidad:
                producto.unidad || "",

              cantidad: 0,

              ventas: 0,

              costos: 0,

              ganancia: 0

            };

          }

          const cantidad =
            Number(producto.cantidad) || 0;

          const precio =
            Number(producto.precio) || 0;

          const costo =
            Number(producto.costo) || 0;

          resumenProductos[nombre].cantidad +=
            cantidad;

          resumenProductos[nombre].ventas +=
            cantidad * precio;

          resumenProductos[nombre].costos +=
            cantidad * costo;

          resumenProductos[nombre].ganancia +=
            (cantidad * precio) -
            (cantidad * costo);

        });

      });

      Object.values(
        resumenProductos
      ).forEach((producto) => {

        productosSheet.addRow({

          nombre: producto.nombre,

          unidad: producto.unidad,

          cantidad: producto.cantidad,

          ventas: producto.ventas,

          costos: producto.costos,

          ganancia: producto.ganancia

        });

      });

      productosSheet.getRow(1).font = {
        bold: true
      };

      productosSheet.getRow(1).alignment = {
        vertical: "middle",
        horizontal: "center"
      };

      productosSheet.getColumn(
        "ventas"
      ).numFmt = '"$"#,##0';

      productosSheet.getColumn(
        "costos"
      ).numFmt = '"$"#,##0';

      productosSheet.getColumn(
        "ganancia"
      ).numFmt = '"$"#,##0';

      worksheet.getColumn(
        "neto"
      ).numFmt = '"$"#,##0';

      worksheet.getColumn(
        "iva"
      ).numFmt = '"$"#,##0';

      worksheet.getColumn(
        "total"
      ).numFmt = '"$"#,##0';

      console.log(
        `Se encontraron ${notas.length} notas`
      );

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      res.setHeader(
        "Content-Disposition",
        'attachment; filename="Resumen_NotasVenta.xlsx"'
      );

      await workbook.xlsx.write(res);

      res.end();

    } catch (error) {

      console.error(
        "Error exportando excel:",
        error
      );

      res.status(500).json({
        error:
          "Error exportando excel"
      });

    }
  }
);

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    let resultado;

    // 🔹 Si el parámetro es un estado válido
    if (estadosValidos.includes(id)) {
      resultado = await Cotizacion.find({ estado: id })
        .populate("productos.itemId ", "nombre costo")
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
      .populate("createdBy", "name email role")
      .populate("productos.itemId");

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
router.post('/:id/convertir-a-nota',
  verifyToken,
  isAdmin,
  async (req, res) => {
    console.log({
      formaPago: req.body.formaPago,
      nota: req.body.nota
    });
    try {
      const cotizacion = await Cotizacion.findById(req.params.id);
      console.log("=== COTIZACION ORIGINAL ===");
      console.log({
        id: cotizacion._id,
        tipo: cotizacion.tipo,
        numero: cotizacion.numero,
        formaPago: cotizacion.formaPago,
        nota: cotizacion.nota
      });
      if (!cotizacion) {
        return res.status(404).json({ error: "Cotización no encontrada" });
      }

      const numeroFinal = await obtenerNuevoCorrelativoSeguro('nota');
      const subtotal = cotizacion.productos.reduce(
        (acc, p) =>
          acc +
          (
            Number(p.cantidad || 0) *
            Number(p.precio || 0)
          ),
        0
      );

      const iva = Math.round(
        subtotal * 0.19
      );

      const total = subtotal + iva;

      console.log("Empresa cotización:", cotizacion.empresa);

      const nuevaNota = await Cotizacion.create({
        empresa: cotizacion.empresa,

        cliente: cotizacion.cliente,
        direccion: cotizacion.direccion || cotizacion.direccionCliente || '',
        fechaHoy: cotizacion.fechaHoy,
        fechaEntrega:
          cotizacion.fechaEntrega ||
          new Date().toISOString().split("T")[0],
        metodoPago: cotizacion.metodoPago,
        createdBy: req.user.id,
        rutCliente: cotizacion.rutCliente,
        giroCliente: cotizacion.giroCliente,
        direccionCliente: cotizacion.direccionCliente,
        comunaCliente: cotizacion.comunaCliente,
        ciudadCliente: cotizacion.ciudadCliente,
        atencion: cotizacion.atencion,
        emailCliente: cotizacion.emailCliente,
        telefonoCliente: cotizacion.telefonoCliente,
        formaPago: cotizacion.formaPago || '',
        nota: cotizacion.nota || '',
        productos: cotizacion.productos.map(p => ({
          itemId: p.itemId,
          codigo: p.codigo || '',
          nombre: p.nombre,
          unidad: p.unidad || 'unidad',

          cantidad: Number(p.cantidad || 0),

          precio: Number(p.precio || 0),

          costo: Number(p.costo || 0),

          total:
            Number(p.cantidad || 0) *
            Number(p.precio || 0)
        })),

        tipo: 'nota',
        numero: numeroFinal,
        estado: 'finalizada',

        cotizacionOriginalId: cotizacion._id,
        subtotal,
        iva,
        total,
      });
      console.log("Número asignado:", nuevaNota.numero);
      // =========================
      // Marcar cotización original
      // como convertida
      // =========================

      await Cotizacion.findByIdAndUpdate(
        cotizacion._id,
        {
          estado: 'convertida',
          yaConvertida: true,
          fechaConversion: new Date(),
          notaGeneradaId: nuevaNota._id
        }
      );

      // ✅ Parsear fecha de forma segura
      const fechaHasta = parseFecha(nuevaNota.fechaEntrega);

      // 📦 Comprometer stock
      for (const p of nuevaNota.productos) {
        if (!p.itemId) continue; // 🔥 producto sin item → ignorar

        await Item.updateOne(
          { _id: p.itemId },
          {
            $push: {
              comprometidos: {
                nombre: p.nombre,
                cantidad: p.cantidad,
                hasta: fechaHasta, // 🔥 YA SEGURO
                cotizacionId: nuevaNota._id,
              }
            }
          }
        );
      }

      // 🧱 PASO 4 — DEFENSA EXTRA (RECOMENDADO)
      if (!fechaHasta) {
        console.warn("⚠️ fechaEntrega inválida en nota:", nuevaNota._id);
      }
      // =========================
      // GENERAR PDF NOTA
      // =========================
      console.log({
        numero: nuevaNota.numero,
        formaPago: nuevaNota.formaPago,
        nota: nuevaNota.nota
      });
      const clientePDF = await Cliente.findById(nuevaNota.cliente);

      const pdfBuffer = generarGuiaPDF(
        clientePDF?.nombre || '',
        nuevaNota.productos,
        {
          numero: nuevaNota.numero,

          tipo: 'nota',

          rutCliente: nuevaNota.rutCliente,
          giroCliente: nuevaNota.giroCliente,
          direccionCliente: nuevaNota.direccionCliente,
          comunaCliente: nuevaNota.comunaCliente,
          ciudadCliente: nuevaNota.ciudadCliente,

          atencion: nuevaNota.atencion,
          emailCliente: nuevaNota.emailCliente,
          telefonoCliente: nuevaNota.telefonoCliente,

          fechaEntrega: nuevaNota.fechaEntrega,

          metodoPago: nuevaNota.metodoPago,

          direccion: nuevaNota.direccion,

          formaPago: nuevaNota.formaPago,

          nota: nuevaNota.nota
        }
      );

      const nombreArchivo = `nota-${nuevaNota.numero}.pdf`;

      const carpetaPDF = path.join(
        __dirname,
        '../uploads/pdfs'
      );

      if (!fs.existsSync(carpetaPDF)) {
        fs.mkdirSync(carpetaPDF, {
          recursive: true
        });
      }

      const rutaPDF = path.join(
        carpetaPDF,
        nombreArchivo
      );

      fs.writeFileSync(
        rutaPDF,
        pdfBuffer
      );

      nuevaNota.pdfUrl =
        `/uploads/pdfs/${nombreArchivo}`;

      await nuevaNota.save();
      res.status(201).json(nuevaNota);
      console.log("🆕 NOTA CREADA:", nuevaNota);
    } catch (error) {
      console.error("Error al convertir a nota:", error);
      res.status(500).json({ error: "Error al convertir a nota" });
    }
  });

// =========================
// 📌 Actualizar (PUT)
// =========================

// server/routes/cotizaciones.js
router.put('/:id', verifyToken, async (req, res) => {
  try {

    const productos = (req.body.productos || []).map(p => ({
      itemId:
        typeof p.itemId === 'string'
          ? p.itemId
          : p.itemId?._id?.toString() || null,

      nombre: p.nombre,

      codigo: p.codigo || '',

      unidad: (p.unidad || 'm3')
        .toLowerCase()
        .trim(),

      cantidad: Number(p.cantidad || 0),

      precio: Number(p.precio || 0),

      costo: Number(p.costo || 0),

      total:
        Number(p.cantidad || 0) *
        Number(p.precio || 0)
    }));

    const updated = await Cotizacion.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        productos
      },
      { new: true }
    );

    res.json({
      cotizacion: updated
    });

  } catch (err) {
    console.error('Error al actualizar cotización:', err);

    res.status(500).json({
      error: 'Error al actualizar cotización',
      detalles: err
    });
  }
});

// routes/cotizaciones.js
router.put(
  '/:id/anular',
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const nota = await Cotizacion.findById(id);

      if (!nota) return res.status(404).json({ error: 'Cotización no encontrada' });
      if (nota.anulada) return res.status(400).json({ error: 'La nota ya fue anulada' });

      // Solo aplicable si es tipo nota
      if (nota.tipo === 'nota') {
        for (const prod of nota.productos) {
          if (!prod.itemId) continue;

          const item = await Item.findById(prod.itemId);
          if (item) {
            // Buscar el compromiso asociado a esta nota
            const index = item.comprometidos.findIndex(c => c.cotizacionId.toString() === nota._id.toString());
            if (index !== -1) {
              // Reponer stock con la cantidad comprometida
              const cantidadComprometida = item.comprometidos[index].cantidad || 0;
              item.stock += cantidadComprometida;

              // Eliminar el compromiso de esta nota
              item.comprometidos.splice(index, 1);
              await item.save();
            }
          }
        }
      }

      // Marcar la nota como anulada
      nota.anulada = new Date();
      await nota.save();

      res.json({ mensaje: 'Nota anulada correctamente y stock repuesto', nota });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al anular la nota' });
    }
  });

router.delete('/:id', verifyToken, isAdmin, async (req, res) => {

  try {
    const { id } = req.params;

    const cotizacion = await Cotizacion.findById(id);

    if (!cotizacion) {
      return res.status(404).json({ error: 'Cotización no encontrada' });
    }

    // 🧠 Si es nota y está finalizada → revertir stock
    if (cotizacion.tipo === 'nota' && cotizacion.estado !== 'borrador') {
      for (const prod of cotizacion.productos) {
        if (!prod.itemId) continue;

        const item = await Item.findById(prod.itemId);
        if (item) {
          const index = item.comprometidos.findIndex(
            c => c.cotizacionId.toString() === cotizacion._id.toString()
          );

          if (index !== -1) {
            const cantidad = item.comprometidos[index].cantidad || 0;

            // 🔥 devolver stock
            item.stock += cantidad;

            // eliminar compromiso
            item.comprometidos.splice(index, 1);

            await item.save();
          }
        }
      }
    }

    // 🟡 Soft delete (recomendado)
    cotizacion.estado = 'cancelada';
    await cotizacion.save();

    res.json({ message: 'Cotización cancelada correctamente' });

  } catch (error) {
    console.error('Error al eliminar cotización:', error);
    res.status(500).json({ error: 'Error al eliminar cotización' });
  }
});

// =========================
// 💰 Actualizar recibidoPor
// =========================
router.put('/:id/recibido-por', verifyToken, async (req, res) => {
  try {

    const { recibidoPor } = req.body;

    // ✅ validar
    if (typeof recibidoPor !== 'string') {
      return res.status(400).json({
        error: 'recibidoPor debe ser string'
      });
    }

    // ✅ limpiar espacios
    const recibidoPorLimpio = recibidoPor.trim();

    // ✅ actualizar SOLO ese campo
    const notaActualizada = await Cotizacion.findByIdAndUpdate(
      req.params.id,
      {
        recibidoPor: recibidoPorLimpio
      },
      {
        new: true
      }
    );

    if (!notaActualizada) {
      return res.status(404).json({
        error: 'Nota no encontrada'
      });
    }

    res.json({
      ok: true,
      nota: notaActualizada
    });

  } catch (err) {

    console.error('Error actualizando recibidoPor:', err);

    res.status(500).json({
      error: 'Error actualizando recibidoPor'
    });
  }
});



module.exports = router;

