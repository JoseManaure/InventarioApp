const express = require("express");
const router = express.Router();

const Cliente = require("../models/Cliente");
const verifyToken = require("../middleware/verifyToken");


/*
===========================================
Crear cliente
===========================================
*/
router.post(
    "/",
    verifyToken,
    async (req, res) => {

        try {

            const cliente = new Cliente({

                ...req.body,

                empresa: req.user.empresa

            });


            await cliente.save();


            res.json(cliente);


        } catch (error) {

            console.error(error);

            res.status(500).json({
                error: "Error creando cliente"
            });

        }

    }
);


/*
===========================================
Buscar clientes (autocomplete)
===========================================
*/
router.get(
    "/",
    verifyToken,
    async (req, res) => {
        try {

            const { search = "" } = req.query;

            const clientes = await Cliente.find({
                empresa: req.user.empresa,
                activo: true,
                nombre: {
                    $regex: search,
                    $options: "i"
                }
            })
                .sort({ nombre: 1 })
                .limit(10);

            res.json(clientes);

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error: "Error buscando clientes"
            });

        }
    }
);

/*
===========================================
Obtener un cliente
===========================================
*/
router.get(
    "/:id",
    verifyToken,
    async (req, res) => {

        try {

            const cliente = await Cliente.findOne({
                _id: req.params.id,
                empresa: req.user.empresa
            });

            if (!cliente) {
                return res.status(404).json({
                    error: "Cliente no encontrado"
                });
            }

            res.json(cliente);

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error: "Error obteniendo cliente"
            });

        }

    }
);

/*
===========================================
Actualizar cliente
===========================================
*/
router.put(
    "/:id",
    verifyToken,
    async (req, res) => {

        try {

            const cliente = await Cliente.findOneAndUpdate(
                {
                    _id: req.params.id,
                    empresa: req.user.empresa
                },
                req.body,
                {
                    new: true
                }
            );

            if (!cliente) {
                return res.status(404).json({
                    error: "Cliente no encontrado"
                });
            }

            res.json(cliente);

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error: "Error actualizando cliente"
            });

        }

    }
);

/*
===========================================
Eliminar cliente
===========================================
*/
router.delete(
    "/:id",
    verifyToken,
    async (req, res) => {

        try {

            const cliente = await Cliente.findOneAndUpdate(
                {
                    _id: req.params.id,
                    empresa: req.user.empresa
                },
                {
                    activo: false
                },
                {
                    new: true
                }
            );

            if (!cliente) {
                return res.status(404).json({
                    error: "Cliente no encontrado"
                });
            }

            res.json({
                message: "Cliente eliminado correctamente"
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error: "Error eliminando cliente"
            });

        }

    }
);

module.exports = router;