require("dotenv").config({
    path: require("path").join(__dirname, "../.env")
});

const mongoose = require("mongoose");

const Cliente = require("../models/Cliente");


async function revisar() {

    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ Mongo conectado");


    const cotizacionesRaw =
        await mongoose.connection
            .collection("cotizacions")
            .find({
                cliente: {
                    $type: "string"
                }
            })
            .limit(10)
            .toArray();



    console.log(
        "Encontradas:",
        cotizacionesRaw.length
    );


    for (const c of cotizacionesRaw) {

        console.log("--------------------------------");

        console.log(
            "ID:",
            c._id
        );

        console.log(
            "cliente RAW:",
            c.cliente
        );

        console.log(
            "rutCliente:",
            c.rutCliente
        );

        console.log(
            "nombre snapshot:",
            c.clienteSnapshot?.nombre
        );


        const cliente = await Cliente.findOne({
            empresa: c.empresa,
            nombre: c.cliente
        });


        console.log(
            "Cliente encontrado:",
            cliente?._id || "NO"
        );

    }


    process.exit();

}


revisar(); 