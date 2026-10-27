const reservas = require("../servicios/reservas");

function inicio(req, res) {
  res.render("inicio", { titulo: "Inicio | Salas de estudio" });
}

async function estado(req, res) {
  res.json({
    servicio: "activo",
    reservas: await reservas.contarReservas(),
    solicitudId: res.locals.solicitudId,
  });
}

async function listar(req, res) {
  res.render("reservas/lista", {
    titulo: "Reservas | Salas de estudio",
    reservas: await reservas.listarReservas(),
  });
}

function nueva(req, res) {
  res.render("reservas/nueva", {
    titulo: "Nueva reserva | Salas de estudio",
    error: null,
    valores: {},
  });
}

async function consultarPorId(req, res, next) {
  const reserva = /^[a-f\d]{24}$/i.test(req.params.id)
    ? await reservas.buscarReservaPorId(req.params.id)
    : null;
  if (!reserva) return next();

  res.render("reservas/detalle", {
    titulo: `Reserva ${reserva.id} | Salas de estudio`,
    reserva,
  });
}

async function crear(req, res) {
  await reservas.crearReserva(req.reservaValidada);
  res.redirect(302, "/reservas");
}

module.exports = { inicio, estado, listar, nueva, consultarPorId, crear };
