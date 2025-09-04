const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(express.json());

// CORS: permite solo tu frontend en producción
const allowedOrigin = process.env.CORS_ORIGIN;
const devOrigin = process.env.DEV_ORIGIN;

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || origin === devOrigin || origin === allowedOrigin) {
      cb(null, true);
    } else {
      cb(new Error('CORS bloqueado'));
    }
  },
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  credentials: true,
}));

app.options('*', cors({
  origin: [allowedOrigin, devOrigin],
  credentials: true,
}));


// Salud (para Render)
app.get('/health', (_req, res) => res.status(200).send('ok'));




// ✅ Router del comparador
const comparador = require('./routes/comparador');

const compararPreciosRouter = require('./routes/comparar-precios');

const pagosRouter = require('./routes/pagos');


const guiasRoutes = require("./routes/guias");

// ✅ Carpeta de uploads (para guardar PDFs)
const uploadPath = path.join(__dirname, 'uploads/pdfs');

// Configuración de Multer
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




// ✅ Servir PDFs de manera pública
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas API existentes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/items', require('./routes/items'));
app.use('/api/comparar-precios', comparador);
app.use('/api/cotizaciones', require('./routes/cotizaciones'));
app.use('/api/facturas', require('./routes/facturas'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/pagos', pagosRouter);
app.use("/api/guias", guiasRoutes);



const Cotizacion = require('./models/Cotizacion');

// ✅ Nueva ruta para subir PDFs de cotizaciones

app.post('/api/cotizaciones/upload-pdf', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se subió ningún archivo' });
  }

    const { cotizacionId } = req.body;
  if (!cotizacionId) {
    return res.status(400).json({ error: 'Falta el ID de la cotización' });
  }

  
  // Construimos la URL pública del PDF
  const pdfUrl = `/uploads/pdfs/${req.file.filename}`;

  // Actualiza la cotización en la base de datos
  try {
    const cotizacion = await Cotizacion.findByIdAndUpdate(
      cotizacionId,
      { pdfUrl },
      { new: true }
    );
    if (!cotizacion) {
      return res.status(404).json({ error: 'Cotización no encontrada' });
    }
    res.json({ pdfUrl, cotizacion });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar la cotización con el PDF' });
  }
});

// Conexión MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.error(err));

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API corriendo en http://localhost:${PORT}`);
});
