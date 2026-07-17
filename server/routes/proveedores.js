const express = require("express");
const router = express.Router();

const Proveedor = require("../models/Proveedor");

const verifyToken = require("../middleware/verifyToken");


router.get(
    "/",
    verifyToken,
    async (req, res) => {

        try {

            const { search = "" } = req.query;

            const proveedores = await Proveedor.find({

                empresa: req.user.empresa,

                activo: true,

                nombre: {
                    $regex: search,
                    $options: "i"
                }

            })
                .limit(10)
                .sort({ nombre: 1 });
            console.log("Encontrados:", proveedores.length);

            proveedores.forEach(p =>
                console.log(p.nombre)
            );
            res.json(proveedores);

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error: "Error buscando proveedores"
            });

        }

    }
);

router.get(
    "/:id",
    verifyToken,
    async (req, res) => {

        try {

            const proveedor = await Proveedor.findOne({
                _id: req.params.id,
                empresa: req.user.empresa
            });

            if (!proveedor) {
                return res.status(404).json({
                    error: "Proveedor no encontrado"
                });
            }

            res.json(proveedor);

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error: "Error obteniendo proveedor"
            });

        }

    }
);

router.put(
    "/:id",
    verifyToken,
    async (req, res) => {

        try {

            const proveedor = await Proveedor.findOneAndUpdate(

                {
                    _id: req.params.id,
                    empresa: req.user.empresa
                },

                req.body,

                {
                    new: true
                }

            );

            if (!proveedor) {
                return res.status(404).json({
                    error: "Proveedor no encontrado"
                });
            }

            res.json(proveedor);

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error: "Error actualizando proveedor"
            });

        }

    }
);

router.delete(
    "/:id",
    verifyToken,
    async (req, res) => {

        try {

            const proveedor = await Proveedor.findOneAndUpdate(

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

            if (!proveedor) {
                return res.status(404).json({
                    error: "Proveedor no encontrado"
                });
            }

            res.json({
                message: "Proveedor desactivado correctamente"
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error: "Error eliminando proveedor"
            });

        }

    }
);
module.exports = router;