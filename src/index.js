const express = require('express');
const path = require('node:path');
const expressLayouts = require('express-ejs-layouts');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;
const salasPermitidas = ['Sala Norte', 'Sala Sur', 'Sala Multimedia'];
const turnosPermitidos = ['Mañana', 'Tarde', 'Noche'];

let siguienteSolicitud = 0;
let reservas = [
  {
    id: 1,
    estudiante: 'Lucía Fernández',
    email: 'lucia.fernandez@example.com',
    sala: 'Sala Norte',
    fecha: '2026-10-02',
    turno: 'Mañana',
    personas: 2
  },
  {
    id: 2,
    estudiante: 'Tomás Benítez',
    email: 'tomas.benitez@example.com',
    sala: 'Sala Multimedia',
    fecha: '2026-10-03',
    turno: 'Tarde',
    personas: 4
  },
  {
    id: 3,
    estudiante: 'Camila Rojas',
    email: 'camila.rojas@example.com',
    sala: 'Sala Sur',
    fecha: '2026-10-04',
    turno: 'Noche',
    personas: 1
  },
  {
    id: 4,
    estudiante: 'Mateo Silva',
    email: 'mateo.silva@example.com',
    sala: 'Sala Norte',
    fecha: '2026-10-05',
    turno: 'Tarde',
    personas: 6
  }
];

function identificarSolicitud(req, res, next) {
  siguienteSolicitud += 1;
  res.locals.solicitudId = `BIB-${String(siguienteSolicitud).padStart(4, '0')}`;
  next();
}

function medirDuracion(req, res, next) {
  const inicio = process.hrtime.bigint();

  res.on('finish', () => {
    const duracionMs = Number(process.hrtime.bigint() - inicio) / 1_000_000;
    console.log(
      `${res.locals.solicitudId} ${req.method} ${req.originalUrl} ${res.statusCode} ${duracionMs.toFixed(2)} ms`
    );
  });

  next();
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));
app.set('layout', 'layouts/main');

app.use(morgan('dev'));
app.use(identificarSolicitud);
app.use(medirDuracion);
app.use(expressLayouts);
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get('/', (req, res) => {
  res.render('inicio', { titulo: 'Inicio | Salas de estudio' });
});

app.get('/estado', (req, res) => {
  res.json({
    servicio: 'activo',
    reservas: reservas.length,
    solicitudId: res.locals.solicitudId
  });
});

const reservasRouter = express.Router();

function prepararAreaReservas(req, res, next) {
  res.locals.seccion = 'Reservas de salas';
  next();
}

function validarReserva(req, res, next) {
  const campoOriginal = (nombre) => (
    typeof req.body?.[nombre] === 'string' ? req.body[nombre] : ''
  );
  const valores = {
    estudiante: campoOriginal('estudiante'),
    email: campoOriginal('email'),
    sala: campoOriginal('sala'),
    fecha: campoOriginal('fecha'),
    turno: campoOriginal('turno'),
    personas: campoOriginal('personas')
  };
  const texto = (valor) => valor.trim();
  const estudiante = texto(valores.estudiante);
  const email = texto(valores.email);
  const sala = texto(valores.sala);
  const fecha = texto(valores.fecha);
  const turno = texto(valores.turno);
  const personas = Number(valores.personas);
  let error = null;

  if (!estudiante || !email || !sala || !fecha || !turno || !valores.personas.trim()) {
    error = 'Completa todos los campos para registrar la reserva.';
  } else if (!email.includes('@')) {
    error = 'Ingresa un email válido que incluya @.';
  } else if (!salasPermitidas.includes(sala)) {
    error = 'La sala seleccionada no está permitida.';
  } else if (!turnosPermitidos.includes(turno)) {
    error = 'El turno seleccionado no está permitido.';
  } else if (!Number.isInteger(personas) || personas < 1 || personas > 6) {
    error = 'La cantidad de personas debe ser un entero entre 1 y 6.';
  }

  if (error) {
    return res.status(400).render('reservas/nueva', {
      titulo: 'Nueva reserva | Salas de estudio',
      error,
      valores
    });
  }

  req.reservaValidada = { estudiante, email, sala, fecha, turno, personas };
  next();
}

function crearReserva(req, res) {
  const nuevoId = Math.max(...reservas.map((reserva) => reserva.id), 0) + 1;
  reservas.push({ id: nuevoId, ...req.reservaValidada });
  res.redirect('/reservas');
}

reservasRouter.use(prepararAreaReservas);

reservasRouter.get('/', (req, res) => {
  res.render('reservas/lista', {
    titulo: 'Reservas | Salas de estudio',
    reservas
  });
});

reservasRouter.get('/nueva', (req, res) => {
  res.render('reservas/nueva', {
    titulo: 'Nueva reserva | Salas de estudio',
    error: null,
    valores: {}
  });
});

reservasRouter.get('/:id', (req, res, next) => {
  const id = Number(req.params.id);
  const reserva = reservas.find((item) => item.id === id);

  if (!Number.isInteger(id) || !reserva) {
    return next();
  }

  res.render('reservas/detalle', {
    titulo: `Reserva ${reserva.id} | Salas de estudio`,
    reserva
  });
});

reservasRouter.post('/', validarReserva, crearReserva);

app.use('/reservas', reservasRouter);

app.use((req, res) => {
  res.status(404).render('no-encontrado', {
    titulo: 'Página no encontrada',
    mensaje: 'La dirección solicitada no existe.'
  });
});

app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});