require("dotenv").config({
    path: require("path").join(__dirname, "../.env")
});

const mongoose = require("mongoose");

const Cliente = require("../models/Cliente");


async function buscar() {

    await mongoose.connect(process.env.MONGO_URI);


    const clientes = await Cliente.find({
        empresa: "6a42dcd1d1b206ea01771e72",
        $or: [
            {
                nombre: {
                    $regex: "Bodegas",
                    $options: "i"
                }
            },
            {
                rut: "762703882"
            }
        ]
    });


    console.log("Encontrados:");
    console.log(clientes);


    process.exit();

}


buscar();