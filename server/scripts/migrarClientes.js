require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const mongoose = require("mongoose");

const Cotizacion = require("../models/Cotizacion");
const Cliente = require("../models/Client");

async function migrar() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("✅ Mongo conectado");

        const cotizaciones = await Cotizacion.find();

        console.log(`📄 Cotizaciones encontradas: ${cotizaciones.length}`);

        let creados = 0;
        let existentes = 0;

        for (const c of cotizaciones) {

            if (!c.cliente || !c.empresa) continue;

            let cliente = null;

            if (c.rutCliente) {
                cliente = await Cliente.findOne({
                    empresa: c.empresa,
                    rut: c.rutCliente
                });
            }

            if (!cliente) {
                cliente = await Cliente.findOne({
                    empresa: c.empresa,
                    nombre: c.cliente
                });
            }

            if (cliente) {
                existentes++;
                continue;
            }

            await Cliente.create({
                empresa: c.empresa,

                nombre: c.cliente,
                rut: c.rutCliente || "",
                giro: c.giroCliente || "",

                direccion: c.direccionCliente || c.direccion || "",
                comuna: c.comunaCliente || "",
                ciudad: c.ciudadCliente || "",

                telefono: c.telefonoCliente || "",
                email: c.emailCliente || "",
                contacto: c.atencion || "",

                activo: true
            });

            creados++;
        }

        console.log("=================================");
        console.log("✅ Migración terminada");
        console.log("Clientes creados:", creados);
        console.log("Clientes existentes:", existentes);

        process.exit();

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

migrar();