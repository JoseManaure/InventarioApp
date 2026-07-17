require("dotenv").config({
    path: require("path").resolve(__dirname, "../.env")
});

const mongoose = require("mongoose");

const Proveedor = require("../models/Proveedor");

const EMPRESA_ID = "6a42dcd1d1b206ea01771e72";
const CREATED_BY = "68783a7ceea4a644b67b97f0";

async function migrar() {

    try {

        await mongoose.connect(process.env.MONGO_URI);

        console.log("✅ Mongo conectado\n");

        const facturasCollection =
            mongoose.connection.db.collection("facturas");

        const facturas = await facturasCollection.find({}).toArray();

        console.log(`📄 Facturas encontradas: ${facturas.length}\n`);

        let migradas = 0;
        let proveedoresCreados = 0;
        let omitidas = 0;
        let errores = 0;

        for (const factura of facturas) {

            try {

                // Ya migrada
                if (
                    factura.proveedor &&
                    factura.empresa &&
                    typeof factura.empresa !== "string"
                ) {
                    omitidas++;
                    continue;
                }

                if (typeof factura.empresa !== "string") {
                    console.log(
                        `⏭ Saltando ${factura._id} (empresa no es string)`
                    );
                    omitidas++;
                    continue;
                }

                const nombreProveedor = factura.empresa.trim();

                if (!nombreProveedor) {

                    console.log(
                        `⚠ Factura ${factura._id} sin nombre proveedor`
                    );

                    errores++;
                    continue;
                }

                let proveedor = await Proveedor.findOne({
                    empresa: EMPRESA_ID,
                    nombre: nombreProveedor
                });

                if (!proveedor) {

                    proveedor = await Proveedor.create({

                        empresa: EMPRESA_ID,

                        nombre: nombreProveedor,

                        rut: factura.rut || "",

                        direccion: factura.direccion || "",

                        telefono: "",

                        email: "",

                        contacto: "",

                        observaciones: ""

                    });

                    proveedoresCreados++;

                    console.log(`🆕 Proveedor creado: ${nombreProveedor}`);
                }

                await facturasCollection.updateOne(

                    {
                        _id: factura._id
                    },

                    {
                        $set: {
                            empresa: new mongoose.Types.ObjectId(EMPRESA_ID),
                            proveedor: proveedor._id,
                            createdBy: new mongoose.Types.ObjectId(CREATED_BY)
                        }
                    }

                );

                migradas++;

                console.log(
                    `✅ Factura ${factura.numeroDocumento} migrada`
                );

            } catch (error) {

                errores++;

                console.log(`❌ Error en factura ${factura._id}`);

                console.error(error.message);

            }

        }

        console.log("\n====================================");
        console.log("🎉 MIGRACIÓN FINALIZADA");
        console.log("====================================");
        console.log(`✅ Facturas migradas : ${migradas}`);
        console.log(`🏢 Proveedores creados : ${proveedoresCreados}`);
        console.log(`⏭ Facturas omitidas : ${omitidas}`);
        console.log(`❌ Errores : ${errores}`);
        console.log("====================================");

        process.exit(0);

    } catch (error) {

        console.error(error);

        process.exit(1);

    }

}

migrar();