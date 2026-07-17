const express = require("express");
const router = express.Router();
const Empresa = require("../models/Empresa");
const verifyToken = require("../middleware/verifyToken");
const requireRole = require("../middleware/requireRole");
const User = require("../models/User");

// Obtener empresas para autocompletar
router.get("/", async (req, res) => {
    try {

        const { search = "" } = req.query;

        const empresas = await Empresa.find({
            nombre: {
                $regex: search,
                $options: "i"
            }
        })
            .limit(10)
            .sort({ nombre: 1 });

        res.json(empresas);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Error al buscar empresas"
        });
    }
});

// Crear empresa
router.post("/", async (req, res) => {

    try {

        const nuevaEmpresa = new Empresa(req.body);

        const guardada = await nuevaEmpresa.save();

        res.status(201).json(guardada);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Error al crear empresa"
        });

    }

});

// =====================================
// OBTENER CONFIGURACIÓN DE LA EMPRESA
// =====================================


router.get(
    "/configuracion",
    verifyToken,
    requireRole("admin"),
    async (req, res) => {
        try {
            const userId = req.user.id || req.user._id;

            const user = await User.findById(userId);

            if (!user) {
                return res.status(404).json({ error: "Usuario no encontrado" });
            }

            // 1. SI USUARIO YA TIENE EMPRESA → usarla
            if (user.empresa) {
                const empresa = await Empresa.findById(user.empresa);
                if (empresa) return res.json(empresa);
            }

            // 2. BUSCAR EMPRESA REAL POR OWNER (ESTO ES CLAVE)
            let empresa = await Empresa.findOne({ owner: userId });

            // 3. SI YA EXISTE → REUTILIZARLA (NO CREAR OTRA)
            if (empresa) {
                user.empresa = empresa._id;
                await user.save();
                return res.json(empresa);
            }

            // 4. SOLO SI NO EXISTE → CREAR
            empresa = await Empresa.create({
                nombre: `Empresa de ${user.name}`,
                owner: userId
            });

            // 5. ASIGNAR AL USUARIO
            user.empresa = empresa._id;
            await user.save();

            return res.json(empresa);

        } catch (error) {
            console.error("ERROR CONFIG EMPRESA:", error);
            return res.status(500).json({
                error: "Error obteniendo configuración"
            });
        }
    }
);

// Obtener una empresa por ID
router.get("/:id", async (req, res) => {

    try {

        const empresa = await Empresa.findById(req.params.id);

        if (!empresa) {
            return res.status(404).json({
                error: "Empresa no encontrada"
            });
        }

        res.json(empresa);

    } catch (error) {

        res.status(500).json({
            error: "Error al obtener empresa"
        });

    }

});




// =====================================
// GUARDAR CONFIGURACIÓN DE LA EMPRESA
// =====================================

router.put(
    "/configuracion",
    verifyToken,
    requireRole("admin"),
    async (req, res) => {

        try {

            let empresa = await Empresa.findById(req.user.empresa);

            if (!empresa) {

                empresa = await Empresa.create(req.body);

                await User.findByIdAndUpdate(
                    req.user.id,
                    {
                        empresa: empresa._id
                    }
                );

            } else {

                Object.assign(empresa, req.body);

                await empresa.save();

            }

            res.json({
                message: "Configuración guardada correctamente",
                empresa
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error: "Error guardando configuración"
            });

        }

    }
);
module.exports = router;