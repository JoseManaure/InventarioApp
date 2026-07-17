const mongoose = require("mongoose");

const clienteSchema = new mongoose.Schema(
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

        comuna: {
            type: String,
            default: "",
            trim: true
        },

        ciudad: {
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

        giro: {
            type: String,
            default: "",
            trim: true
        },

        atencion: {
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

clienteSchema.index({
    empresa: 1,
    nombre: 1
});

module.exports = mongoose.model("Cliente", clienteSchema);