const express = require("express");
const path = require("node:path");
const mongoose = require("mongoose");
const expressLayouts = require("express-ejs-layouts");
const morgan = require("morgan");
const { conectarBaseDeDatos } = require("./config/database");
const reservasHtmlRouter = require("./rutas/html");
const reservasApiRouter = require("./rutas/api");
const { rutaNoEncontrada, manejarErrores } = require("./middleware/errores");
const controladorHtml = require("./controladores/html");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "views"));
app.set("layout", "layouts/main");

let siguienteSolicitud = 0;
app.use(morgan("dev"));
app.use((req, res, next) => {
  siguienteSolicitud += 1;
  res.locals.solicitudId = `BIB-${String(siguienteSolicitud).padStart(4, "0")}`;
  res.locals.seccion = "Reservas de salas";
  next();
});
app.use(expressLayouts);
app.use(express.static(path.join(__dirname, "..", "public")));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get("/", controladorHtml.inicio);
app.get("/estado", controladorHtml.estado);
app.use("/api/reservas", reservasApiRouter);
app.use("/reservas", reservasHtmlRouter);
app.use(rutaNoEncontrada);
app.use(manejarErrores);

async function iniciar() {
  await conectarBaseDeDatos();
  const servidor = app.listen(PORT, () => {
    console.log(`Servidor iniciado en http://localhost:${PORT}`);
  });

  let cerrando = false;
  async function cerrar(signal) {
    if (cerrando) return;
    cerrando = true;
    console.log(`Cierre solicitado (${signal}).`);
    servidor.close(async () => {
      try {
        await mongoose.disconnect();
      } catch {
        console.error(
          "No se pudo cerrar la conexión con MongoDB de forma ordenada.",
        );
        process.exitCode = 1;
      }
    });
  }

  process.on("SIGINT", () => cerrar("SIGINT"));
  process.on("SIGTERM", () => cerrar("SIGTERM"));
}

iniciar().catch(async (error) => {
  const diagnostico = {
    nombre: error.name || "Error",
    codigo: error.code || error.cause?.code || "sin código",
  };
  console.error("No se pudo iniciar el servidor:", diagnostico);
  await mongoose.disconnect();
  process.exitCode = 1;
});
