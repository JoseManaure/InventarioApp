const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();

// Variables de entorno
const allowedOrigin = process.env.CORS_ORIGIN; // frontend en producción (Vercel)
const devOrigin = process.env.DEV_ORIGIN;      // localhost

// Middleware para parsear JSON
app.use(express.json());

// ✅ CORS global para todas las rutas
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || origin === devOrigin || origin === allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    return next();
  } else {
    return res.status(403).send('CORS bloqueado');
  }
});

// Ruta de salud
app.get('/health', (_req, res) => res.status(200).send('ok'));

// ✅ Rutas
const comparador = require('./routes/comparador');
const compararPreciosRouter = require('./routes/comparar-precios');
const pagosRouter = require('./routes/pagos');
const guiasRoutes = require("./routes/guias");

app.use('/api/auth', require('./routes/auth'));
app.use('/api/items', require('./routes/items'));
app.use('/api/comparar-precios', comparador);
app.use('/api/cotizaciones', require('./routes/cotizaciones'));
app.use('/api/facturas', require('./routes/facturas'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/pagos', pagosRouter);
app.use("/api/guias", guiasRoutes);

// ✅ Configuración Multer para subir PDFs
const uploadPath = path.join(__dirname, 'uploads/pdfs');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Servir PDFs públicamente
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Modelo Cotización
const Cotizacion = require('./models/Cotizacion');

// ✅ Subir PDF de cotización
app.post('/api/cotizaciones/upload-pdf', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });

  const { cotizacionId } = req.body;
  if (!cotizacionId) return res.status(400).json({ error: 'Falta el ID de la cotización' });

  const pdfUrl = `/uploads/pdfs/${req.file.filename}`;

  try {
    const cotizacion = await Cotizacion.findByIdAndUpdate(
      cotizacionId,
      { pdfUrl },
      { new: true }
    );
    if (!cotizacion) return res.status(404).json({ error: 'Cotización no encontrada' });

    res.json({ pdfUrl, cotizacion });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar la cotización con el PDF' });
  }
});

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.error(err));

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API corriendo en http://localhost:${PORT}`);
});
