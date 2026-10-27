const express = require("express");
const controlador = require("../controladores/api");
const {
  validarReservaApi,
  validarReemplazoApi,
  validarActualizacionParcialApi,
} = require("../middleware/validar-reserva");

const router = express.Router();

router.get("/", controlador.listar);
router.post("/", validarReservaApi, controlador.crear);
router.put("/:id", validarReemplazoApi, controlador.reemplazar);
router.patch(
  "/:id",
  validarActualizacionParcialApi,
  controlador.actualizarParcial,
);
router.delete("/:id", controlador.eliminar);
router.get("/:id", controlador.consultarPorId);

module.exports = router;
