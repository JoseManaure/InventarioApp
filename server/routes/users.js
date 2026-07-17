const express = require('express');
const router = express.Router();

const bcrypt = require('bcryptjs');

const User = require('../models/User');

const verifyToken =
    require('../middleware/verifyToken');

const requireRole =
    require('../middleware/requireRole');


// =====================================
// LISTAR USUARIOS
// =====================================
router.get(
    '/',
    verifyToken,
    requireRole('admin'),
    async (req, res) => {

        try {

            const usuarios =
                await User.find()
                    .select('-password')
                    .sort({
                        createdAt: -1
                    });

            res.json(usuarios);

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error: 'Error obteniendo usuarios'
            });
        }
    }
);


router.get(
    "/admin/summary",
    verifyToken,
    requireRole("admin"),
    async (req, res) => {
        try {
            const users = await User.find();

            const now = new Date();

            const total = users.length;

            const active = users.filter(
                u =>
                    u.isActive &&
                    (!u.trialEndsAt || new Date(u.trialEndsAt) > now)
            ).length;

            const expired = users.filter(
                u =>
                    u.trialEndsAt &&
                    new Date(u.trialEndsAt) <= now
            ).length;

            const suspended = users.filter(
                u => !u.isActive
            ).length;

            res.json({
                total,
                active,
                expired,
                suspended
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({
                error: "Error obteniendo resumen"
            });
        }
    }
);

// =====================================
// CREAR USUARIO
// =====================================
router.post(
    '/',
    verifyToken,
    requireRole('admin'),
    async (req, res) => {

        try {

            const {
                name,
                email,
                password,
                role,
                trialDays,
                empresa
            } = req.body;

            const existe =
                await User.findOne({
                    email
                });

            if (existe) {
                return res.status(400).json({
                    error: 'El usuario ya existe'
                });
            }

            const hash =
                await bcrypt.hash(
                    password,
                    10
                );
            let trialEndsAt = null;

            if (trialDays && Number(trialDays) > 0) {

                trialEndsAt = new Date();

                trialEndsAt.setDate(
                    trialEndsAt.getDate() + Number(trialDays)
                );
            }
            const usuario =
                await User.create({
                    name,
                    email,
                    password: hash,
                    role,
                    trialEndsAt,
                    empresa,
                });

            res.status(201).json({
                message:
                    'Usuario creado correctamente',
                usuario
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error: 'Error creando usuario'
            });
        }
    }
);

// =====================================
// EXTENDER TRIAL
// =====================================
router.patch(
    '/:id/extend-trial',
    verifyToken,
    requireRole('admin'),
    async (req, res) => {

        try {

            const { days } = req.body;

            const dias = Number(days);

            if (!dias || dias <= 0) {
                return res.status(400).json({
                    error: 'Cantidad de días inválida'
                });
            }

            const user = await User.findById(req.params.id);

            if (!user) {
                return res.status(404).json({
                    error: 'Usuario no encontrado'
                });
            }

            const hoy = new Date();

            // Si el trial sigue vigente, suma desde esa fecha.
            // Si ya expiró o no existe, comienza desde hoy.
            const fechaBase =
                user.trialEndsAt && new Date(user.trialEndsAt) > hoy
                    ? new Date(user.trialEndsAt)
                    : hoy;

            fechaBase.setDate(
                fechaBase.getDate() + dias
            );

            user.trialEndsAt = fechaBase;

            await user.save();

            res.json({
                message: `Trial extendido ${dias} días`,
                trialEndsAt: user.trialEndsAt
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error: 'Error extendiendo trial'
            });

        }

    }
);

// =====================================
// ELIMINAR USUARIO
// =====================================
router.delete(
    '/:id',
    verifyToken,
    requireRole('admin'),
    async (req, res) => {

        try {

            await User.findByIdAndDelete(
                req.params.id
            );

            res.json({
                message:
                    'Usuario eliminado'
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error:
                    'Error eliminando usuario'
            });
        }
    }
);

module.exports = router;