const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

dotenv.config();

const app = express();

/* ==================================================
   CORS CORREGIDO PARA VERCEL + LOCALHOST + RAILWAY
================================================== */
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://inventario-app-woad.vercel.app"
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

// JSON
app.use(express.json());

/* ==================================================
   TESTS
================================================== */

app.get('/health', (_req, res) => {
  res.status(200).send('ok');
});

app.get('/api/test', (_req, res) => {
  res.status(200).send('API OK ✅');
});

/* ==================================================
   RUTAS
================================================== */

app.use('/api/auth', require('./routes/auth'));
app.use('/api/items', require('./routes/items'));
app.use('/api/comparador', require('./routes/comparador'));
app.use('/api/comparar-precios', require('./routes/comparar-precios'));
app.use('/api/cotizaciones', require('./routes/cotizaciones'));
app.use('/api/facturas', require('./routes/facturas'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/pagos', require('./routes/pagos'));
app.use('/api/guias', require('./routes/guias'));
app.use('/api/llama', require('./routes/llama'));

/* ==================================================
   MULTER PDFS
================================================== */

const uploadPath = path.join(__dirname, 'uploads/pdfs');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadPath),

  filename: (_req, file, cb) => {
    const uniqueSuffix =
      Date.now() + '-' + Math.round(Math.random() * 1e9);

    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

/* ==================================================
   SUBIR PDF
================================================== */

const Cotizacion = require('./models/Cotizacion');

app.post(
  '/api/cotizaciones/upload-pdf',
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ error: 'No se subió ningún archivo' });
      }

      const { cotizacionId } = req.body;

      if (!cotizacionId) {
        return res
          .status(400)
          .json({ error: 'Falta el ID de la cotización' });
      }

      const pdfUrl = `/uploads/pdfs/${req.file.filename}`;

      const cotizacion =
        await Cotizacion.findByIdAndUpdate(
          cotizacionId,
          { pdfUrl },
          { new: true }
        );

      if (!cotizacion) {
        return res
          .status(404)
          .json({ error: 'Cotización no encontrada' });
      }

      res.json({ pdfUrl, cotizacion });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: 'Error al actualizar la cotización con el PDF'
      });
    }
  }
);

/* ==================================================
   DB
================================================== */

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch((err) => console.error('❌ Error MongoDB:', err));

/* ==================================================
   START
================================================== */

const PORT = process.env.PORT || 5000;
