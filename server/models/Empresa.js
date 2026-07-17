const mongoose = require("mongoose");

const empresaSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        unique: true
    },
    rut: String,
    direccion: String,
    rol: String,
    telefono: String,
    email: String,
}, {
    timestamps: true
});

module.exports = mongoose.model("Empresa", empresaSchema);