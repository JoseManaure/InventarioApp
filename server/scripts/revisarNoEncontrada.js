require("dotenv").config({
    path: require("path").join(__dirname, "../.env")
});

const mongoose = require("mongoose");

async function revisar() {

    await mongoose.connect(process.env.MONGO_URI);

    const db = mongoose.connection.db;


    const cotizaciones =
        await db.collection("cotizacions")
            .find({
                cliente: {
                    $type: "string"
                }
            })
            .toArray();


    console.log("Pendientes:", cotizaciones.length);


    for (const c of cotizaciones) {

        console.log("--------------------------------");

        console.log("ID:", c._id);
        console.log("Cliente:", c.cliente);
        console.log("RUT:", c.rutCliente);
        console.log("Empresa:", c.empresa);

        console.log(
            "Snapshot:",
            c.clienteSnapshot
        );

    }


    process.exit();

}


revisar();