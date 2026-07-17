const express = require('express');
const router = express.Router();
const requireAdmin =
    require('../middleware/requireAdmin');

const Cotizacion = require('../models/Cotizacion');
const verifyToken = require('../middleware/verifyToken');

const mongoose = require('mongoose');

// ======================================
// 🧠 NORMALIZAR PRODUCTOS
// ======================================
const normalizarProducto = (nombre = "") => {
    return nombre
        .toLowerCase()
        .replace("mts3", "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim();
};

// ======================================
// 📊 DASHBOARD VENTAS
// ======================================
router.get(
    "/ventas",
    verifyToken,
    requireAdmin,
    async (req, res) => {

        try {

            if (!req.user.empresa) {
                return res.status(400).json({
                    error: "Usuario sin empresa"
                });
            }

            const notas = await Cotizacion.find({
                empresa: req.user.empresa,
                tipo: "nota",
                estado: "finalizada",
                anulada: null
            })
                .select(
                    "cliente productos fechaEntrega estado numero total"
                );

            console.log("📊 TOTAL NOTAS:", notas.length);

            // ==============================
            // KPIs
            // ==============================
            let neto = 0;
            let iva = 0;
            let totalFinal = 0;
            let costoTotal = 0;
            let utilidadBruta = 0;
            // ==============================
            // AGRUPADORES
            // ==============================
            const ventasPorMes = {};
            const productosMap = {};

            // ==============================
            // RECORRER NOTAS
            // ==============================
            for (const nota of notas) {

                let costoNota = 0;

                const totalNota = nota.productos.reduce(
                    (acc, p) => {

                        costoNota +=
                            (p.cantidad || 0) *
                            (p.costo || 0);

                        return acc +
                            ((p.cantidad || 0) *
                                (p.precio || 0));

                    },
                    0
                );

                const ivaNota =
                    Math.round(totalNota * 0.19);

                neto += totalNota;

                iva += ivaNota;

                totalFinal += totalNota + ivaNota;

                costoTotal += costoNota;

                utilidadBruta +=
                    totalNota - costoNota;

                // ==========================
                // 📅 VENTAS POR MES
                // ==========================
                const mes = nota.fechaEntrega?.slice(0, 7);

                if (mes) {
                    ventasPorMes[mes] =
                        (ventasPorMes[mes] || 0)
                        + totalNota;
                }

                // ==========================
                // 📦 TOP PRODUCTOS
                // ==========================
                for (const p of (nota.productos || [])) {

                    // 🔥 NORMALIZAR NOMBRE
                    const nombreNormalizado =
                        normalizarProducto(p.nombre);

                    productosMap[nombreNormalizado] =
                        (productosMap[nombreNormalizado] || 0)
                        + (p.cantidad * p.precio);
                }
            }

            // ==============================
            // 🏆 TOP 5 PRODUCTOS
            // ==============================
            const topProductos = Object.entries(productosMap)
                .map(([nombre, total]) => ({
                    nombre,
                    total
                }))
                .sort((a, b) => b.total - a.total)
                .slice(0, 5);

            // ==============================
            // 📈 VENTAS MENSUALES
            // ==============================
            const ventasMensuales = Object.entries(ventasPorMes)
                .map(([mes, total]) => ({
                    mes,
                    total
                }))
                .sort((a, b) => a.mes.localeCompare(b.mes));

            // ==============================
            // 🎟 TICKET PROMEDIO
            // ==============================
            const ticketPromedio =
                notas.length > 0
                    ? Math.round(totalFinal / notas.length)
                    : 0;

            // ==============================
            // 👥 CLIENTES DISPONIBLES
            // ==============================
            const clientesDisponibles = [
                ...new Set(
                    notas
                        .map(n => n.cliente)
                        .filter(Boolean)
                )
            ];

            // ==============================
            // 📦 PRODUCTOS DISPONIBLES
            // ==============================
            const productosDisponibles = [
                ...new Set(
                    notas.flatMap(n =>
                        (n.productos || []).map(p =>
                            normalizarProducto(p.nombre)
                        )
                    )
                )
            ];

            const notasResumen = notas.map(n => ({

                id: n._id,

                cliente: n.cliente,

                fechaEntrega: n.fechaEntrega,

                total: n.total,

                estado: n.estado,

                numero: n.numero,

                productos: n.productos || []

            }));

            // ==============================
            // 📤 RESPUESTA FINAL
            // ==============================
            res.json({

                kpis: {
                    neto,
                    iva,
                    total: totalFinal,
                    notas: notas.length,
                    ticketPromedio,

                    costoTotal,
                    utilidadBruta
                },

                ventasMensuales,

                topProductos,

                notas: notasResumen,

                clientesDisponibles,

                productosDisponibles
            });

        } catch (error) {

            console.error(
                '❌ Error dashboard ventas:',
                error
            );

            res.status(500).json({
                error: 'Error obteniendo dashboard'
            });
        }
    });

module.exports = router;