const assert = require("node:assert/strict");
const test = require("node:test");
const controlador = require("../src/controladores/api");
const reservas = require("../src/servicios/reservas");

const id = "507f1f77bcf86cd799439011";
const recurso = { id, personas: 3, estado: "confirmada" };

function respuesta() {
  return {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
    end() {
      this.termino = true;
      return this;
    },
  };
}

test("PUT/PATCH responden 200 o 404 según exista la reserva", async () => {
  const originalReplace = reservas.reemplazarReserva;
  const originalPatch = reservas.actualizarReservaParcial;
  reservas.reemplazarReserva = async () => recurso;
  reservas.actualizarReservaParcial = async () => null;

  try {
    const reemplazo = respuesta();
    await controlador.reemplazar(
      { params: { id }, reservaValidada: {} },
      reemplazo,
    );
    assert.equal(reemplazo.statusCode, 200);
    assert.deepEqual(reemplazo.payload, recurso);

    const ausente = respuesta();
    await controlador.actualizarParcial(
      { params: { id }, reservaValidada: {} },
      ausente,
    );
    assert.equal(ausente.statusCode, 404);
  } finally {
    reservas.reemplazarReserva = originalReplace;
    reservas.actualizarReservaParcial = originalPatch;
  }
});

test("DELETE devuelve 204 vacío, 404 si no existe y 400 para ID inválido", async () => {
  const originalDelete = reservas.eliminarReserva;
  let llamadas = 0;
  reservas.eliminarReserva = async () => {
    llamadas += 1;
    return llamadas === 1;
  };

  try {
    const eliminada = respuesta();
    await controlador.eliminar({ params: { id } }, eliminada);
    assert.equal(eliminada.statusCode, 204);
    assert.equal(eliminada.termino, true);
    assert.equal(Object.hasOwn(eliminada, "payload"), false);

    const ausente = respuesta();
    await controlador.eliminar({ params: { id } }, ausente);
    assert.equal(ausente.statusCode, 404);

    const invalida = respuesta();
    await controlador.eliminar({ params: { id: "1" } }, invalida);
    assert.equal(invalida.statusCode, 400);
    assert.equal(llamadas, 2);
  } finally {
    reservas.eliminarReserva = originalDelete;
  }
});
