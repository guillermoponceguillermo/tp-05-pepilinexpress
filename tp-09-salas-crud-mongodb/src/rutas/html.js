const express = require("express");
const controlador = require("../controladores/html");
const { validarReservaFormulario } = require("../middleware/validar-reserva");

const router = express.Router();

router.get("/", controlador.listar);
router.get("/nueva", controlador.nueva);
router.post("/", validarReservaFormulario, controlador.crear);
router.get("/:id", controlador.consultarPorId);

module.exports = router;
