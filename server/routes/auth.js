// routes/auth.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Empresa = require('../models/Empresa');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const verifyToken = require('../middleware/verifyToken');

const JWT_SECRET = process.env.JWT_SECRET;

const {
  loginLimiter,
  registerLimiter
} = require('../middleware/rateLimits');


// =========================
// GET /auth/me
// =========================
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('empresa');

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json(user);
  } catch (err) {
    console.error('Error en /auth/me:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});


// =========================
// REGISTER
// =========================
router.post('/register', registerLimiter, async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      email,
      password: hashedPassword,
      name
    });

    await user.save();

    res.status(201).json({
      message: 'Usuario creado correctamente'
    });

  } catch (err) {
    console.error('❌ Error en registro:', err);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});


// =========================
// LOGIN (FIX DEFINITIVO)
// =========================
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    // =========================
    // 1. Buscar usuario
    // =========================
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Usuario desactivado' });
    }

    // =========================
    // 2. Trial check
    // =========================
    if (
      user.role !== 'admin' &&
      user.plan === 'trial' &&
      user.trialEndsAt &&
      new Date() > new Date(user.trialEndsAt)
    ) {
      return res.status(403).json({
        error: 'Tu período de prueba ha expirado'
      });
    }

    // =========================
    // 3. Password check
    // =========================
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    // =========================
    // 4. 🔥 GARANTIZAR EMPRESA (FIX CLAVE)
    // =========================
    let empresa = null;

    if (user.empresa) {
      empresa = await Empresa.findById(user.empresa);
    }

    if (!empresa) {
      empresa = await Empresa.findOne({ owner: user._id });

      if (!empresa) {
        empresa = await Empresa.create({
          nombre: `Empresa de ${user.name}`,
          owner: user._id
        });
      }

      await User.findByIdAndUpdate(user._id, {
        empresa: empresa._id
      });

      user.empresa = empresa._id;
    }

    // =========================
    // 5. JWT consistente
    // =========================
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        empresa: empresa._id
      },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    // =========================
    // 6. Response limpia
    // =========================
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        empresa: empresa._id
      }
    });

  } catch (err) {
    console.error('❌ Error en login:', err);

    res.status(500).json({
      error: 'Error al iniciar sesión'
    });
  }
});

module.exports = router;