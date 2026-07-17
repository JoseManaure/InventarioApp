
require("dotenv").config();

const mongoose = require("mongoose");

const User = require("../models/User");
const Cotizacion = require("../models/Cotizacion");

async function migrar() {

    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ Mongo conectado");

    const usuarios = await User.find({
        empresa: { $ne: null }
    });

    console.log(`Usuarios encontrados: ${usuarios.length}`);

    for (const user of usuarios) {

        console.log("");
        console.log("--------------------------------");
        console.log("Usuario:", user.name);
        console.log("Empresa:", user.empresa);

        const resultado = await Cotizacion.updateMany(
            {
                createdBy: user._id,
                $or: [
                    { empresa: { $exists: false } },
                    { empresa: null }
                ]
            },
            {
                $set: {
                    empresa: user.empresa
                }
            }
        );

        console.log(
            `✔ ${resultado.modifiedCount} cotizaciones migradas`
        );
    }

    console.log("");
    console.log("🎉 Migración terminada");

    process.exit(0);

}

migrar().catch(err => {

    console.error(err);

    process.exit(1);

});