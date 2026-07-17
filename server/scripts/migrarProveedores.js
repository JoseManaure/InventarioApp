require("dotenv").config({
    path: require("path").resolve(__dirname, "../.env"),
});

const mongoose = require("mongoose");

const Proveedor = require("../models/Proveedor");

const EMPRESA_ID = "6a42dcd1d1b206ea01771e72";

async function migrar() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("✅ Mongo conectado");

        const proveedores = await Proveedor.find();

        let actualizados = 0;
        let omitidos = 0;

        for (const proveedor of proveedores) {
            // Ya migrado
            if (
                proveedor.empresa &&
                typeof proveedor.empresa !== "string"
            ) {
                omitidos++;
                continue;
            }

            proveedor.empresa = EMPRESA_ID;

            await proveedor.save();

            actualizados++;

            console.log(
                `✅ ${proveedor.nombre} actualizado`
            );
        }

        console.log("\n=========================");
        console.log("Migración terminada");
        console.log("=========================");
        console.log("Actualizados:", actualizados);
        console.log("Omitidos:", omitidos);

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

migrar();