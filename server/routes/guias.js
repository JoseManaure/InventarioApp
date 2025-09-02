// server/routes/guias.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const GuiaDespacho = require("../models/GuiaDespacho");
const Cotizacion = require("../models/Cotizacion");
const Item = require("../models/Item");
const verifyToken = require("../middleware/auth");

// =========================
// Utils
// =========================
async function obtenerNuevoCorrelativoGuia() {
  const ultima = await GuiaDespacho.findOne().sort({ numero: -1 }).select("numero");
  return ultima ? ultima.numero + 1 : 1;
}

async function entregadoPorItem(notaId) {
  const agg = await GuiaDespacho.aggregate([
    { $match: { notaId: new mongoose.Types.ObjectId(notaId) } },
    { $unwind: "$productos" },
    { $group: { _id: "$productos.itemId", total: { $sum: "$productos.cantidad" } } },
  ]);
  const map = new Map();
  agg.forEach(r => map.set(String(r._id), r.total));
  return map;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// =========================
// Crear PDF Guía (integrado)
// =========================
const logoPath = path.join(__dirname, "..", "..", "client", "api_inventario", "inventario-web", "src", "assets", "logo rasiva.png");

function crearPDFGuia(guia, nota, outputPath) {
  return new Promise((resolve, reject) => {
    if (!guia.numero) return reject(new Error("El número de guía no está definido"));

    const doc = new PDFDocument({ margin: 36, size: "A4" });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // --- Logo ---
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 36, 15, { width: 50 });
    }

    // --- Datos empresa ---
    doc.fontSize(10).font("Helvetica-Bold").text("COMERCIAL RASIVA SpA.", 100, 20);
    doc.font("Helvetica").text("RUT: 77 143 635-8", 100, 28);
    doc.text("Servicios de Ingeniería, Compra y Venta de materiales", 100, 36);
    doc.text("Construcción y Transportes.", 100, 44);
    doc.text("Fono: (02) Cel. 9 6240 1457 - 9 5649 6112", 100, 52);
    doc.text("Dirección: Balmaceda N°01091, Malloco - Peñaflor", 100, 60);

    // --- Título ---
    doc.fontSize(16).font("Helvetica-Bold").text(
      `GUÍA DE DESPACHO N° ${guia.numero}`,
      { align: "center", underline: true }
    );

    // --- Datos guía ---
    const fecha = new Date(guia.fecha || Date.now()).toLocaleDateString("es-CL");
    doc.fontSize(10).font("Helvetica").text(`Fecha: ${fecha}`, 36, 90);
    doc.text(`Nota de Venta: ${nota.numero ?? "-"} (ID: ${String(nota._id)})`, 36, 100);

    // --- Datos cliente (dos columnas) ---
    const datosIzq = [
      ["Cliente:", nota.cliente || "__________________"],
      ["RUT:", nota.rutCliente || "__________________"],
      ["Giro:", nota.giroCliente || "__________________"],
      ["Dirección:", nota.direccionCliente || "__________________"],
      ["Comuna:", nota.comunaCliente || "__________________"],
      ["Ciudad:", nota.ciudadCliente || "Santiago"],
      ["Mail:", nota.emailCliente || "__________________"]
    ];

    const datosDer = [
      ["At. Sr.:", nota.atencion || "__________________"],
      ["Válida:", "3 días"],
      ["Dirección:", nota.direccion || "__________________"],
      ["Cel.:", nota.telefonoCliente || ""],
      ["Entrega:", nota.fechaEntrega || "Por definir"],
      ["Pago:", nota.metodoPago || "Contado"],
      [" ", " "]
    ];

    let yCliente = 120;
    for (let i = 0; i < datosIzq.length; i++) {
      const [labelIzq, valueIzq] = datosIzq[i];
      const [labelDer, valueDer] = datosDer[i];

      doc.font("Helvetica-Bold").text(labelIzq, 36, yCliente);
      doc.font("Helvetica").text(valueIzq, 80, yCliente);

      doc.font("Helvetica-Bold").text(labelDer, 300, yCliente);
      doc.font("Helvetica").text(valueDer, 340, yCliente);

      yCliente += 15;
    }

    // --- Tabla productos ---
    let y = yCliente + 10;
    const columnWidths = [30, 200, 60, 80, 80];
    const tableHeader = ["#", "Producto", "Cant.", "Precio Unit.", "Total"];

    doc.font("Helvetica-Bold");
    tableHeader.forEach((h, i) => doc.text(h, 36 + columnWidths.slice(0, i).reduce((a,b)=>a+b,0), y));
    y += 20;
    doc.font("Helvetica");

    let subtotal = 0;
    guia.productos.forEach((p, index) => {
      const cantidad = Number(p.cantidad || 0);
      const precio = Number(p.precio || 0);
      const totalLinea = cantidad * precio;
      subtotal += totalLinea;

      if (index % 2 === 0) {
        doc.rect(36, y-2, columnWidths.reduce((a,b)=>a+b,0), 18).fill("#EBF5FF").fillColor("black");
      }

      const row = [
        `${index + 1}`,
        p.nombre,
        cantidad,
        `$${precio.toLocaleString("es-CL")}`,
        `$${totalLinea.toLocaleString("es-CL")}`
      ];

      row.forEach((txt, i) => {
        let x = 36 + columnWidths.slice(0, i).reduce((a,b)=>a+b,0);
        let align = (i >= 3) ? "right" : "left";
        doc.text(txt, x, y, { width: columnWidths[i], align });
      });

      y += 18;
    });

    const iva = Math.round(subtotal * 0.19);
    const total = subtotal + iva;
    y += 10;
    doc.font("Helvetica-Bold");
    doc.text(`Subtotal: $${subtotal.toLocaleString("es-CL")}`, 36, y, { align: "right" });
    y += 15;
    doc.text(`IVA (19%): $${iva.toLocaleString("es-CL")}`, 36, y, { align: "right" });
    y += 15;
    doc.fillColor("green").text(`Total: $${total.toLocaleString("es-CL")}`, 36, y, { align: "right" });
    doc.fillColor("black");

    // --- Forma de pago / Nota ---
    y += 40;
    doc.font("Helvetica-Bold").text("Forma de Pago:", 36, y);
    doc.font("Helvetica").text(nota.formaPago || "__________________", 120, y);

    y += 20;
    doc.font("Helvetica-Bold").text("Nota:", 36, y);
    doc.font("Helvetica").text(nota.nota || "__________________", 120, y);

    // --- Información transferencia ---
    y += 30;
    doc.font("Helvetica-Bold").fillColor("red").text("Transferir a:", 36, y);
    doc.fillColor("black").font("Helvetica");
    doc.text("Comercial Rasiva SpA", 36, y + 10);
    doc.text("Cta.Vista N°21670187273 Bco.Estado", 36, y + 20);
    doc.text("Rut. 77 143 635-8", 36, y + 30);
    doc.fillColor("blue").text("comercialrasiva@gmail.com", 36, y + 40, { link: "mailto:comercialrasiva@gmail.com" });

    doc.end();
    stream.on("finish", resolve);
    stream.on("error", reject);
  });
}

// =========================
// Listar guías de una nota
// =========================
router.get("/nota/:notaId", verifyToken, async (req, res) => {
  try {
    const { notaId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(notaId)) {
      return res.status(400).json({ error: "notaId inválido" });
    }

    const guias = await GuiaDespacho.find({ notaId: new mongoose.Types.ObjectId(notaId) })
      .sort({ createdAt: 1 })
      .populate("productos.itemId", "nombre")
      .lean();

    res.json(guias);
  } catch (err) {
    console.error("Error listando guías:", err);
    res.status(500).json({ error: "Error listando guías" });
  }
});

// =========================
// Obtener guía individual
// =========================
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID de guía no válido" });
    }

    const guia = await GuiaDespacho.findById(id).populate("productos.itemId");
    if (!guia) return res.status(404).json({ error: "Guía no encontrada" });
    res.json(guia);
  } catch (err) {
    console.error("Error obteniendo guía:", err);
    res.status(500).json({ error: "Error al obtener guía" });
  }
});

// =========================
// Crear Guía
// =========================
router.post("/", verifyToken, async (req, res) => {
  try {
    const { notaId, productos } = req.body;
    if (!notaId || !mongoose.Types.ObjectId.isValid(notaId)) {
      return res.status(400).json({ error: "notaId inválido" });
    }
    if (!Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ error: "No hay productos para guardar" });
    }

    const nota = await Cotizacion.findById(notaId).lean();
    if (!nota || nota.tipo !== "nota") {
      return res.status(404).json({ error: "Nota no encontrada" });
    }

    const entregadoMap = await entregadoPorItem(nota._id);

    const disponiblesPorItem = new Map();
    for (const np of nota.productos) {
      const itemId = String(np.itemId);
      const ya = entregadoMap.get(itemId) || 0;
      const disponible = Number(np.cantidad) - Number(ya);
      disponiblesPorItem.set(itemId, Math.max(disponible, 0));
    }

    const productosValidados = [];
    for (const p of productos) {
      const itemId = String(p.itemId);
      const enNota = nota.productos.find(np => String(np.itemId) === itemId);
      if (!enNota) return res.status(400).json({ error: `Item ${itemId} no está en la nota` });

      const cantidadSolicitada = Number(p.cantidad || 0);
      const disponible = disponiblesPorItem.get(itemId) || 0;
      if (cantidadSolicitada <= 0) continue;
      if (cantidadSolicitada > disponible) {
        return res.status(400).json({ error: `No puedes entregar más de lo vendido para ${enNota.nombre}. Disponible: ${disponible}` });
      }

      productosValidados.push({
        itemId: enNota.itemId,
        nombre: enNota.nombre,
        cantidad: cantidadSolicitada,
        precio: Number(p.precio ?? enNota.precio ?? 0),
        numero: 1
      });
    }

    if (productosValidados.length === 0) {
      return res.status(400).json({ error: "No hay cantidades válidas para despachar" });
    }

    const ultimo = await GuiaDespacho.findOne().sort({ numero: -1 }).lean();
    let nuevoNumero = 1;
    if (ultimo && typeof ultimo.numero === "number" && !isNaN(ultimo.numero)) {
      nuevoNumero = ultimo.numero + 1;
    }

    // 1️⃣ Crear guía y guardar primero
    const guia = new GuiaDespacho({
      notaId: new mongoose.Types.ObjectId(notaId),
      numero: nuevoNumero,
      productos: productosValidados,
      estado: "pendiente",
    });

    

    // 2️⃣ Rebajar stock y comprometidos
    for (const p of productosValidados) {
      const item = await Item.findById(p.itemId);
      if (!item) continue;

      item.cantidad = Math.max(Number(item.cantidad || 0) - p.cantidad, 0);

      let pendiente = p.cantidad;
      item.comprometidos = (item.comprometidos || []).map(c => {
        if (String(c.cotizacionId) !== String(nota._id)) return c;
        if (pendiente <= 0) return c;
        const consumir = Math.min(Number(c.cantidad || 0), pendiente);
        c.cantidad -= consumir;
        pendiente -= consumir;
        return c;
      }).filter(c => Number(c.cantidad) > 0);

      await item.save();
    }

    // 3️⃣ Generar PDF
    const baseDir = path.join(__dirname, "..", "uploads", "guias");
    if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });

    const fileName = `guia_${guia.numero}.pdf`;
    const absPath = path.join(baseDir, fileName);

    await crearPDFGuia(guia.toObject(), nota, absPath);

    // 4️⃣ Guardar URL pública y devolver al frontend
    guia.pdfPath = `http://localhost:3000/uploads/guias/${fileName}`;
    await guia.save();

    res.status(201).json(guia);
  } catch (err) {
    console.error("Error creando guía:", err);
    res.status(500).json({ error: "Error al crear guía" });
  }
});

// =========================
// Eliminar guía
// =========================
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID de guía no válido" });
    }

    const guia = await GuiaDespacho.findById(id);
    if (!guia) return res.status(404).json({ error: "Guía no encontrada" });

    // Revertir stock
    for (const p of guia.productos) {
      const item = await Item.findById(p.itemId);
      if (!item) continue;
      item.cantidad += Number(p.cantidad || 0);

      item.comprometidos.push({
        cantidad: p.cantidad,
        hasta: new Date(),
        cotizacionId: guia.notaId,
      });

      await item.save();
    }

    if (guia.pdfPath) {
      const abs = path.join(__dirname, "..", guia.pdfPath);
      fs.existsSync(abs) && fs.unlinkSync(abs);
    }

    await guia.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    console.error("Error eliminando guía:", err);
    res.status(500).json({ error: "Error al eliminar guía" });
  }
});

module.exports = router;
