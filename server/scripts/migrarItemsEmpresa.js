const path = require("path");

require("dotenv").config({
    path: path.resolve(__dirname, "../.env"),
});

const mongoose = require("mongoose");

const User = require("../models/User");
const Item = require("../models/Item");

async function main() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("✅ Conectado a MongoDB");

        const admin = await User.findOne({
            role: "admin",
            empresa: { $ne: null }
        });

        if (!admin) {
            throw new Error("No se encontró un administrador con empresa.");
        }

        console.log("Empresa encontrada:", admin.empresa.toString());

        const items = await Item.find({
            $or: [
                { empresa: { $exists: false } },
                { empresa: null }
            ]
        });

        console.log(`Items a migrar: ${items.length}`);

        let migrados = 0;

        for (const item of items) {
            await Item.updateOne(
                { _id: item._id },
                {
                    $set: {
                        empresa: admin.empresa
                    }
                },
                {
                    runValidators: false
                }
            );

            migrados++;
        }
        const unidades = await Item.distinct("unidad");

        console.log("Unidades encontradas:");
        console.log(unidades.sort());
        console.log(`✅ Migrados: ${migrados}`);

        process.exit(0);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();