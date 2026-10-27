const Reserva = require("../modelos/reserva");

const camposEditables = [
  "estudiante",
  "email",
  "sala",
  "fecha",
  "turno",
  "personas",
  "estado",
];
const camposParciales = ["personas", "estado"];

function representarReserva(documento) {
  if (!documento) return null;

  return {
    id: documento._id.toString(),
    estudiante: documento.estudiante,
    email: documento.email,
    sala: documento.sala,
    fecha: documento.fecha,
    turno: documento.turno,
    personas: documento.personas,
    estado: documento.estado,
  };
}

async function listarReservas(filtro = {}) {
  const documentos = await Reserva.find(filtro);
  return documentos.map(representarReserva);
}

async function buscarReservaPorId(id) {
  return representarReserva(await Reserva.findById(id));
}

async function crearReserva(campos) {
  const documento = await Reserva.create(campos);
  return representarReserva(documento);
}

async function reemplazarReserva(id, campos) {
  const reemplazo = Object.fromEntries(
    camposEditables.map((campo) => [campo, campos[campo]]),
  );
  const documento = await Reserva.findByIdAndUpdate(id, reemplazo, {
    new: true,
    runValidators: true,
    upsert: false,
  });
  return representarReserva(documento);
}

async function actualizarReservaParcial(id, campos) {
  const cambios = Object.fromEntries(
    camposParciales
      .filter((campo) => Object.hasOwn(campos, campo))
      .map((campo) => [campo, campos[campo]]),
  );
  const documento = await Reserva.findByIdAndUpdate(
    id,
    { $set: cambios },
    { new: true, runValidators: true, upsert: false },
  );
  return representarReserva(documento);
}

async function eliminarReserva(id) {
  return Boolean(await Reserva.findByIdAndDelete(id));
}

async function contarReservas() {
  return Reserva.countDocuments();
}

module.exports = {
  listarReservas,
  buscarReservaPorId,
  crearReserva,
  reemplazarReserva,
  actualizarReservaParcial,
  eliminarReserva,
  contarReservas,
};
