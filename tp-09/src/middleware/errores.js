function esRutaApi(req) {
  return req.path === "/api" || req.path.startsWith("/api/");
}

function rutaNoEncontrada(req, res) {
  if (esRutaApi(req)) {
    return res.status(404).json({ error: "La ruta solicitada no existe." });
  }

  res.status(404).render("no-encontrado", {
    titulo: "Página no encontrada",
    mensaje: "La dirección solicitada no existe.",
  });
}

function manejarErrores(error, req, res, next) {
  if (res.headersSent) return next(error);

  const api = esRutaApi(req);
  const esJsonMalformado = error.type === "entity.parse.failed";
  const esValidacion =
    error.name === "ValidationError" || error.name === "CastError";

  if (api && (esJsonMalformado || esValidacion)) {
    return res
      .status(400)
      .json({ error: "Los datos enviados no son válidos." });
  }

  if (!api && esValidacion && req.path === "/reservas") {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const valores = {};
    for (const campo of [
      "estudiante",
      "email",
      "sala",
      "fecha",
      "turno",
      "personas",
    ]) {
      valores[campo] = typeof body[campo] === "string" ? body[campo] : "";
    }

    return res.status(400).render("reservas/nueva", {
      titulo: "Nueva reserva | Salas de estudio",
      error: "Revisa los datos ingresados.",
      valores,
    });
  }

  console.error(
    `Error ${error.name || "interno"} en ${req.method} ${req.path}`,
  );
  if (api) return res.status(500).json({ error: "Ocurrió un error interno." });

  res.status(500).render("error-interno", { titulo: "Error interno" });
}

module.exports = { rutaNoEncontrada, manejarErrores };
