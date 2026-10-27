const camposTexto = ["estudiante", "email", "sala", "fecha", "turno"];
const camposReserva = [...camposTexto, "personas"];
const camposEditables = [...camposReserva, "estado"];
const camposParciales = ["personas", "estado"];
const salasPermitidas = ["Sala Norte", "Sala Sur", "Sala Multimedia"];
const turnosPermitidos = ["Mañana", "Tarde", "Noche"];
const estadosPermitidos = ["pendiente", "confirmada"];

function normalizarDatos(body, formulario, permitirPersonasTextuales = false) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;

  const datos = {};
  for (const campo of camposTexto) {
    if (typeof body[campo] !== "string") return null;
    datos[campo] = body[campo].trim();
  }

  const personasOriginal = body.personas;
  if (formulario) {
    if (typeof personasOriginal !== "string" || !personasOriginal.trim())
      return null;
    datos.personas = Number(personasOriginal);
  } else if (
    permitirPersonasTextuales &&
    typeof personasOriginal === "string"
  ) {
    if (!personasOriginal.trim()) return null;
    datos.personas = Number(personasOriginal.trim());
  } else {
    if (typeof personasOriginal !== "number") return null;
    datos.personas = personasOriginal;
  }

  if (!Number.isFinite(datos.personas)) return null;
  if (camposTexto.some((campo) => !datos[campo])) return null;
  if (!datos.email.includes("@")) return null;
  if (!salasPermitidas.includes(datos.sala)) return null;
  if (!turnosPermitidos.includes(datos.turno)) return null;
  if (
    !Number.isInteger(datos.personas) ||
    datos.personas < 1 ||
    datos.personas > 6
  )
    return null;

  return datos;
}

function normalizarEstado(valor) {
  if (typeof valor !== "string") return null;
  const estado = valor.trim();
  return estadosPermitidos.includes(estado) ? estado : null;
}

function validarCamposPermitidos(body, camposPermitidos, parcial = false) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return false;
  const claves = Object.keys(body);
  if (
    claves.length === 0 ||
    claves.some((clave) => !camposPermitidos.includes(clave))
  )
    return false;
  return (
    parcial || camposPermitidos.every((campo) => Object.hasOwn(body, campo))
  );
}

function validarReservaApi(req, res, next) {
  const datos = normalizarDatos(req.body, false);
  if (!datos)
    return res
      .status(400)
      .json({ error: "Los datos de la reserva no son válidos." });

  req.reservaValidada = datos;
  next();
}

function validarReemplazoApi(req, res, next) {
  const body = req.body;
  if (!validarCamposPermitidos(body, camposEditables)) {
    return res.status(400).json({
      error: "El reemplazo debe incluir únicamente todos los campos editables.",
    });
  }

  const datos = normalizarDatos(body, false, true);
  const estado = normalizarEstado(body.estado);
  if (!datos || !estado) {
    return res
      .status(400)
      .json({ error: "Los datos de la reserva no son válidos." });
  }

  req.reservaValidada = { ...datos, estado };
  next();
}

function validarActualizacionParcialApi(req, res, next) {
  const body = req.body;
  if (!validarCamposPermitidos(body, camposParciales, true)) {
    return res.status(400).json({
      error:
        "La actualización solo admite personas o estado y requiere al menos un campo.",
    });
  }

  const cambios = {};
  if (Object.hasOwn(body, "personas")) {
    const valor = body.personas;
    if (
      (typeof valor !== "number" && typeof valor !== "string") ||
      (typeof valor === "string" && !valor.trim())
    ) {
      return res.status(400).json({
        error: "La cantidad de personas debe ser un número entero entre 1 y 6.",
      });
    }

    cambios.personas = Number(valor);
    if (
      !Number.isFinite(cambios.personas) ||
      !Number.isInteger(cambios.personas) ||
      cambios.personas < 1 ||
      cambios.personas > 6
    ) {
      return res.status(400).json({
        error: "La cantidad de personas debe ser un número entero entre 1 y 6.",
      });
    }
  }

  if (Object.hasOwn(body, "estado")) {
    const estado = normalizarEstado(body.estado);
    if (!estado) {
      return res.status(400).json({
        error: "El estado debe ser pendiente o confirmada.",
      });
    }
    cambios.estado = estado;
  }

  req.reservaValidada = cambios;
  next();
}

function validarReservaFormulario(req, res, next) {
  const body =
    req.body && typeof req.body === "object" && !Array.isArray(req.body)
      ? req.body
      : {};
  const valores = {};
  for (const campo of [...camposTexto, "personas"]) {
    valores[campo] = typeof body[campo] === "string" ? body[campo] : "";
  }

  const datos = normalizarDatos(body, true);
  if (!datos) {
    return res.status(400).render("reservas/nueva", {
      titulo: "Nueva reserva | Salas de estudio",
      error:
        "Revisa los datos: completa todos los campos y verifica sus valores.",
      valores,
    });
  }

  req.reservaValidada = datos;
  next();
}

module.exports = {
  validarReservaApi,
  validarReemplazoApi,
  validarActualizacionParcialApi,
  validarReservaFormulario,
};
