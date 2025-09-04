const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();

// Middlewares
app.use(express.json());

// Variables de entorno para CORS
const allowedOrigin = process.env.CORS_ORIGIN; // producción Vercel
const devOrigin = process.env.DEV_ORIGIN;      // localhost

// Configuración general de CORS
const corsOptions = {
  origin: [allowedOrigin, devOrigin],
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
};

// Middleware global para manejar OPTIONS
app.options('*', cors(corsOptions));

// Salud (ping)
app.get('/health', (_req, res) => res.status(200).send('ok'));

// ✅ Carpeta de uploads (PDFs)
const uploadPath = path.join(__dirname, 'uploads/pdfs');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routers
const authRouter = require('./routes/auth');
const itemsRouter = require('./routes/items');
const comparadorRouter = require('./routes/comparador');
const compararPreciosRouter = require('./routes/comparar-precios');
const pagosRouter = require('./routes/pagos');
const guiasRouter = require('./routes/guias');
const cotizacionesRouter = require('./routes/cotizaciones');
const facturasRouter = require('./routes/facturas');
const chatRouter = require('./routes/chat');

// Aplicar CORS directamente a cada router crítico
app.use('/api/auth', cors(corsOptions), authRouter);
app.use('/api/items', cors(corsOptions), itemsRouter);
app.use('/api/comparar-precios', cors(corsOptions), comparadorRouter);
app.use('/api/comparar-precios', cors(corsOptions), compararPreciosRouter);
app.use('/api/pagos', cors(corsOptions), pagosRouter);
app.use('/api/guias', cors(corsOptions), guiasRouter);
app.use('/api/cotizaciones', cors(corsOptions), cotizacionesRouter);
app.use('/api/facturas', cors(corsOptions), facturasRouter);
app.use('/api/chat', cors(corsOptions), chatRouter);

// Modelo para PDF
const Cotizacion = require('./models/Cotizacion');

// Subida de PDFs
app.post('/api/cotizaciones/upload-pdf', cors(corsOptions), upload.single('file'), async (req, res) => {
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
