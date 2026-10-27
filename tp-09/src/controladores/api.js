const mongoose = require("mongoose");
const reservas = require("../servicios/reservas");

async function listar(req, res) {
  const claves = Object.keys(req.query);
  if (claves.some((clave) => clave !== "sala")) {
    return res.status(400).json({ error: "El único filtro admitido es sala." });
  }

  const filtro = {};
  if (Object.hasOwn(req.query, "sala")) {
    if (typeof req.query.sala !== "string") {
      return res
        .status(400)
        .json({ error: "El filtro sala debe ser un único valor textual." });
    }
    filtro.sala = req.query.sala;
  }

  res.json(await reservas.listarReservas(filtro));
}

async function consultarPorId(req, res) {
  if (!validarId(req, res)) return;

  const reserva = await reservas.buscarReservaPorId(req.params.id);
  if (!reserva)
    return res.status(404).json({ error: "No se encontró la reserva." });

  res.json(reserva);
}

async function crear(req, res) {
  const reserva = await reservas.crearReserva(req.reservaValidada);
  res.location(`/api/reservas/${reserva.id}`).status(201).json(reserva);
}

async function reemplazar(req, res) {
  if (!validarId(req, res)) return;

  const reserva = await reservas.reemplazarReserva(
    req.params.id,
    req.reservaValidada,
  );
  if (!reserva)
    return res.status(404).json({ error: "No se encontró la reserva." });

  res.json(reserva);
}

async function actualizarParcial(req, res) {
  if (!validarId(req, res)) return;

  const reserva = await reservas.actualizarReservaParcial(
    req.params.id,
    req.reservaValidada,
  );
  if (!reserva)
    return res.status(404).json({ error: "No se encontró la reserva." });

  res.json(reserva);
}

async function eliminar(req, res) {
  if (!validarId(req, res)) return;

  const eliminada = await reservas.eliminarReserva(req.params.id);
  if (!eliminada)
    return res.status(404).json({ error: "No se encontró la reserva." });

  res.status(204).end();
}

function validarId(req, res) {
  if (
    /^[a-f\d]{24}$/i.test(req.params.id) &&
    mongoose.isValidObjectId(req.params.id)
  ) {
    return true;
  }

  res
    .status(400)
    .json({ error: "El identificador no tiene un formato válido." });
  return false;
}

module.exports = {
  listar,
  consultarPorId,
  crear,
  reemplazar,
  actualizarParcial,
  eliminar,
};
