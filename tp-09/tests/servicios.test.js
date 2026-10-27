const assert = require("node:assert/strict");
const test = require("node:test");
const Reserva = require("../src/modelos/reserva");
const reservas = require("../src/servicios/reservas");

const id = "507f1f77bcf86cd799439011";
const documento = {
  _id: { toString: () => id },
  estudiante: "Ana Ejemplo",
  email: "ana@example.com",
  sala: "Sala Norte",
  fecha: "2026-10-28",
  turno: "Mañana",
  personas: 2,
  estado: "pendiente",
};

test("el reemplazo usa campos permitidos, validadores y no hace upsert", async () => {
  const original = Reserva.findByIdAndUpdate;
  let argumentos;
  Reserva.findByIdAndUpdate = async (...args) => {
    argumentos = args;
    return documento;
  };

  try {
    const resultado = await reservas.reemplazarReserva(id, {
      ...documento,
      extra: "no copiar",
    });

    assert.equal(argumentos[0], id);
    assert.deepEqual(Object.keys(argumentos[1]), [
      "estudiante",
      "email",
      "sala",
      "fecha",
      "turno",
      "personas",
      "estado",
    ]);
    assert.deepEqual(argumentos[2], {
      new: true,
      runValidators: true,
      upsert: false,
    });
    assert.equal(resultado.id, id);
    assert.equal(resultado.estado, "pendiente");
  } finally {
    Reserva.findByIdAndUpdate = original;
  }
});

test("PATCH construye $set únicamente con campos autorizados", async () => {
  const original = Reserva.findByIdAndUpdate;
  let argumentos;
  Reserva.findByIdAndUpdate = async (...args) => {
    argumentos = args;
    return documento;
  };

  try {
    await reservas.actualizarReservaParcial(id, {
      personas: 3,
      estado: "confirmada",
      email: "no copiar",
    });

    assert.deepEqual(argumentos[1], {
      $set: { personas: 3, estado: "confirmada" },
    });
    assert.deepEqual(argumentos[2], {
      new: true,
      runValidators: true,
      upsert: false,
    });
  } finally {
    Reserva.findByIdAndUpdate = original;
  }
});

test("el borrado físico indica si encontró el documento", async () => {
  const original = Reserva.findByIdAndDelete;
  Reserva.findByIdAndDelete = async () => documento;
  try {
    assert.equal(await reservas.eliminarReserva(id), true);
    Reserva.findByIdAndDelete = async () => null;
    assert.equal(await reservas.eliminarReserva(id), false);
  } finally {
    Reserva.findByIdAndDelete = original;
  }
});
