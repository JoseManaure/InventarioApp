const mongoose = require("mongoose");

const proveedorSchema = new mongoose.Schema(
    {
        empresa: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Empresa",
            required: true,
            index: true
        },

        nombre: {
            type: String,
            required: true,
            trim: true
        },

        rut: {
            type: String,
            default: "",
            trim: true
        },

        direccion: {
            type: String,
            default: "",
            trim: true
        },

        telefono: {
            type: String,
            default: "",
            trim: true
        },

        email: {
            type: String,
            default: "",
            trim: true,
            lowercase: true
        },

        contacto: {
            type: String,
            default: "",
            trim: true
        },

        observaciones: {
            type: String,
            default: ""
        },

        activo: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Proveedor", proveedorSchema);