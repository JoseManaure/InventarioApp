require("dotenv").config();

const mongoose = require("mongoose");

const Cotizacion = require("../models/Cotizacion");

const EMPRESA_ID = "6a42dcd1d1b206ea01771e72";

async function ejecutar() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("✅ MongoDB conectado");

        // Contar antes
        const total = await Cotizacion.countDocuments();

        console.log(`📄 Total cotizaciones: ${total}`);

        // Actualizar TODAS
        const resultado = await Cotizacion.updateMany(
            {},
            {
                $set: {
                    empresa: new mongoose.Types.ObjectId(EMPRESA_ID),
                },
            }
        );

        console.log("");
        console.log("====================================");
        console.log("✅ MIGRACIÓN FINALIZADA");
        console.log("====================================");
        console.log(`Cotizaciones encontradas : ${total}`);
        console.log(`Cotizaciones modificadas : ${resultado.modifiedCount}`);
        console.log(`Empresa asignada         : ${EMPRESA_ID}`);
        console.log("====================================");

        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
}

ejecutar();