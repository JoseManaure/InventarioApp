require("dotenv").config({
    path: require("path").join(__dirname, "../.env")
});

const mongoose = require("mongoose");

const Cliente = require("../models/Cliente");


async function migrar() {

    try {

        await mongoose.connect(process.env.MONGO_URI);

        console.log("✅ Mongo conectado");


        const db = mongoose.connection.db;


        const cotizaciones =
            await db.collection("cotizacions")
                .find({
                    cliente: {
                        $type: "string"
                    }
                })
                .toArray();



        console.log(
            "Cotizaciones a actualizar:",
            cotizaciones.length
        );


        let actualizadas = 0;
        let noEncontradas = 0;



        for (const cotizacion of cotizaciones) {


            const nombreCliente =
                cotizacion.cliente?.trim();



            if (!nombreCliente) {
                continue;
            }



            const cliente =
                await Cliente.findOne({
                    empresa: cotizacion.empresa,
                    nombre: nombreCliente
                });



            if (!cliente) {

                console.log(
                    "❌ No encontrado:",
                    nombreCliente
                );

                noEncontradas++;

                continue;
            }



            await db.collection("cotizacions")
                .updateOne(
                    {
                        _id: cotizacion._id
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
                                atencion: cliente.contacto || ""

                            }

                        }
                    }
                );



            console.log(
                "✅ Actualizado:",
                nombreCliente
            );


            actualizadas++;

        }



        console.log("");
        console.log("===============================");
        console.log("MIGRACIÓN FINAL");
        console.log("===============================");
        console.log(
            "Actualizadas:",
            actualizadas
        );
        console.log(
            "No encontradas:",
            noEncontradas
        );
        console.log("===============================");


        await mongoose.disconnect();

        process.exit(0);


    } catch (error) {

        console.error(error);

        process.exit(1);

    }

}


migrar();