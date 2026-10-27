const mongoose = require("mongoose");

const salasPermitidas = ["Sala Norte", "Sala Sur", "Sala Multimedia"];
const turnosPermitidos = ["Mañana", "Tarde", "Noche"];

const reservaSchema = new mongoose.Schema({
  estudiante: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: (email) => email.includes("@"),
      message: "El email debe incluir @.",
    },
  },
  sala: { type: String, required: true, enum: salasPermitidas, trim: true },
  fecha: { type: String, required: true, trim: true },
  turno: { type: String, required: true, enum: turnosPermitidos, trim: true },
  personas: {
    type: Number,
    set: (valor) => (typeof valor === "number" ? valor : Number.NaN),
    required: true,
    min: 1,
    max: 6,
    validate: {
      validator: Number.isInteger,
      message: "La cantidad de personas debe ser un entero.",
    },
  },
  estado: {
    type: String,
    enum: ["pendiente", "confirmada"],
    default: "pendiente",
  },
});

module.exports = mongoose.model("Reserva", reservaSchema);
