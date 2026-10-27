const assert = require("node:assert/strict");
const test = require("node:test");
const {
  validarReservaApi,
  validarReemplazoApi,
  validarActualizacionParcialApi,
} = require("../src/middleware/validar-reserva");

const reservaCompleta = {
  estudiante: " Ana Ejemplo ",
  email: "ana@example.com",
  sala: "Sala Norte",
  fecha: "2026-10-28",
  turno: "Mañana",
  personas: "2",
  estado: "confirmada",
};

function validar(middleware, body) {
  const req = { body };
  const res = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };
  let continuo = false;

  middleware(req, res, () => {
    continuo = true;
  });

  return { req, res, continuo };
}

test("PUT acepta el reemplazo completo, normaliza valores y valida estado", () => {
  const resultado = validar(validarReemplazoApi, reservaCompleta);

  assert.equal(resultado.continuo, true);
  assert.deepEqual(resultado.req.reservaValidada, {
    estudiante: "Ana Ejemplo",
    email: "ana@example.com",
    sala: "Sala Norte",
    fecha: "2026-10-28",
    turno: "Mañana",
    personas: 2,
    estado: "confirmada",
  });
});

test("PUT rechaza campos faltantes, desconocidos, _id y operadores", () => {
  for (const body of [
    { ...reservaCompleta, estado: undefined },
    { ...reservaCompleta, extra: "no permitido" },
    { ...reservaCompleta, _id: "507f1f77bcf86cd799439011" },
    { ...reservaCompleta, $set: { personas: 3 } },
    [],
    null,
  ]) {
    const resultado = validar(validarReemplazoApi, body);
    assert.equal(resultado.continuo, false);
    assert.equal(resultado.res.statusCode, 400);
  }
});

test("PATCH acepta solo cambios permitidos y convierte texto numérico", () => {
  for (const [body, esperado] of [
    [{ personas: "3" }, { personas: 3 }],
    [{ estado: " pendiente " }, { estado: "pendiente" }],
    [
      { personas: 4, estado: "confirmada" },
      { personas: 4, estado: "confirmada" },
    ],
  ]) {
    const resultado = validar(validarActualizacionParcialApi, body);
    assert.equal(resultado.continuo, true);
    assert.deepEqual(resultado.req.reservaValidada, esperado);
  }
});

test("PATCH rechaza cuerpo vacío, campos extra y valores inválidos", () => {
  for (const body of [
    {},
    { email: "nuevo@example.com" },
    { _id: "507f1f77bcf86cd799439011" },
    { $set: { personas: 3 } },
    { estado: "cancelada" },
    ...[0, 7, 2.5, true, [], {}, "", "   ", "no es número"].map((personas) => ({
      personas,
    })),
  ]) {
    const resultado = validar(validarActualizacionParcialApi, body);
    assert.equal(resultado.continuo, false);
    assert.equal(resultado.res.statusCode, 400);
  }
});

test("POST conserva los seis campos y no permite personas como texto", () => {
  const body = {
    estudiante: "Ana Ejemplo",
    email: "ana@example.com",
    sala: "Sala Norte",
    fecha: "2026-10-28",
    turno: "Mañana",
    personas: 2,
    estado: "confirmada",
    _id: "ignorado",
  };
  const resultado = validar(validarReservaApi, body);

  assert.equal(resultado.continuo, true);
  assert.deepEqual(Object.keys(resultado.req.reservaValidada), [
    "estudiante",
    "email",
    "sala",
    "fecha",
    "turno",
    "personas",
  ]);
  assert.equal(
    validar(validarReservaApi, { ...body, personas: "2" }).continuo,
    false,
  );
});
