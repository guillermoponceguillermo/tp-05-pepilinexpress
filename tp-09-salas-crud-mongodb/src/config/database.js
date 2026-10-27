const mongoose = require("mongoose");

async function conectarBaseDeDatos() {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.includes("<") || uri.includes(">")) {
    throw new Error("MONGODB_URI no está configurada con una URI válida.");
  }

  await mongoose.connect(uri, { dbName: "reservas_salas_u9" });
}

module.exports = { conectarBaseDeDatos };
