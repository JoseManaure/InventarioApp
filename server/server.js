const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const verifyToken = require('./middleware/verifyToken');
const requireAdmin = require('./middleware/requireAdmin');
const empresaRoutes = require("./routes/empresaRoutes");
const proveedoresRoutes = require("./routes/proveedores");
const clientesRoutes = require("./routes/clientes");
dotenv.config();

const app = express();

/* ==================================================
   CORS CORREGIDO PARA VERCEL + LOCALHOST + RAILWAY
================================================== */
const allowedOrigins = [
  "http://localhost:5174",
  "http://localhost:3000",
  "http://127.0.0.1:8000", // ← AGREGAR
  "http://localhost:8000", // ← recomendable también
  "http://127.0.0.1:8001",

  "https://inventario-app-woad.vercel.app",
  "https://inventario-ncuxjknoc-joses-projects-e0239e45.vercel.app",
  "https://inventario-dsg3ykta7-joses-projects-e0239e45.vercel.app"
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

app.use('/api/auth', require('./routes/auth'));
app.use('/api/dte', require('./routes/dte'));
/* ==================================================
   RUTAS
================================================== */

app.use('/api/items', require('./routes/items'));
app.use('/api/comparador', require('./routes/comparador'));
app.use('/api/comparar-precios', require('./routes/comparar-precios'));
app.use('/api/cotizaciones', require('./routes/cotizaciones'));
app.use('/api/facturas', require('./routes/facturas'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/pagos', require('./routes/pagos'));
app.use('/api/guias', require('./routes/guias'));
app.use('/api/llama', require('./routes/llama'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use(
  '/api/users',
  require('./routes/users')
);
const generarBoletaXML =
  require('./sii/dte/generarBoletaXML');

app.get('/api/test-xml', async (req, res) => {
  const xml = generarBoletaXML({
    folio: 1,
    rutEmpresa: '76XXXXXX-X',
    razonSocial: 'MMD SPA',
    rutCliente: '11.111.111-1',
    cliente: 'Cliente Test',
    total: 25000
  });

  res.type('application/xml');
  res.send(xml);
});

console.log("🔥 ESTE ES MI SERVER REAL");
app.delete('/api/test-delete', (req, res) => {
  res.send('DELETE funciona');
});

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

const upload = multer({
  storage,

  limits: {
    fileSize: 10 * 1024 * 1024
  },

  fileFilter: (_req, file, cb) => {

    if (file.mimetype !== 'application/pdf') {

      return cb(
        new Error('Solo se permiten PDFs')
      );
    }

    cb(null, true);
  }
});
app.use("/api/empresas", empresaRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));
app.use("/api/proveedores", proveedoresRoutes);
app.use("/api/clientes", clientesRoutes);
/* ==================================================
   SUBIR PDF
================================================== */

const Cotizacion = require('./models/Cotizacion');

app.post(
  '/api/cotizaciones/upload-pdf',
  verifyToken,
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

app.use((err, req, res, next) => {

  if (err instanceof multer.MulterError) {

    return res.status(400).json({
      error: err.message
    });
  }

  if (err.message === 'Solo se permiten archivos PDF') {

    return res.status(400).json({
      error: err.message
    });
  }

  next(err);
});

/* ==================================================
   START
================================================== */

const PORT = process.env.PORT || 5001;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB conectado');

    app.listen(PORT, '0.0.0.0', () => {
      console.log('PORT de Railway:', process.env.PORT);
      console.log(`🚀 API corriendo en puerto ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Error MongoDB:', err);
    process.exit(1);
  });

mongoose.connection.once("open", () => {
  console.log("================================");
  console.log("DATABASE:", mongoose.connection.name);
  console.log("HOST:", mongoose.connection.host);
  console.log("================================");
});




