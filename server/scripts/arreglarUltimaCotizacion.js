require("dotenv").config({
    path: require("path").join(__dirname, "../.env")
});

const mongoose = require("mongoose");

const Cliente = require("../models/Cliente");


async function arreglar() {

    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ Mongo conectado");


    const db = mongoose.connection.db;


    const cotizacionId =
        new mongoose.Types.ObjectId(
            "6a4eb5429f8a1cf45daf49f3"
        );


    const cliente =
        await Cliente.findOne({
            empresa:
                "6a42dcd1d1b206ea01771e72",
            rut:
                "762703882"
        });


    if (!cliente) {

        console.log(
            "❌ Cliente no encontrado"
        );

        process.exit(1);
    }



    await db.collection("cotizacions")
        .updateOne(
            {
                _id: cotizacionId
            },
            {
                $set: {

                    cliente: cliente._id,

                    clienteSnapshot: {

                        nombre: cliente.nombre,
                        rut: cliente.rut || "",
                        direccion: cliente.direccion || "",
                        comuna: cliente.comuna || "",
                        ciudad: cliente.ciudad || "",
                        telefono: cliente.telefono || "",
                        email: cliente.email || "",
                        giro: cliente.giro || "",
                        atencion: cliente.atencion || ""

                    }

                }
            }
        );


    console.log(
        "✅ Cotización actualizada"
    );

    console.log(
        "Cliente asignado:",
        cliente._id
    );


    process.exit();

}


arreglar();