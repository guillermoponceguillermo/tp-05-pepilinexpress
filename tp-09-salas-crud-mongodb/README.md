# TP 09 - Actualización y eliminación de reservas de salas

Aplicación con vistas HTML y API JSON para crear, consultar, reemplazar,
actualizar parcialmente y eliminar reservas persistidas en MongoDB.

## Origen y preparación

Esta carpeta es una copia independiente del TP 08. Conserva CommonJS, Express
5, Mongoose 8, EJS, express-ejs-layouts, Morgan, la interfaz y el ciclo de
conexión/cierre ordenado. La conexión utiliza la base `reservas_salas_u9` y la
colección `reservas`; no carga datos de ejemplo ni escribe al iniciar, listar o
consultar. El TP 08 y sus datos no se modifican.

Se requiere Node.js 20.6 o superior. Instalar dependencias y crear el archivo
local de entorno:

```powershell
npm ci
Copy-Item .env.example .env
```

Completar `MONGODB_URI` en `.env` con una URI válida de Atlas. Crear una base
gratuita M0, un usuario de base de datos y habilitar únicamente la IP necesaria.
Codificar en URL los caracteres especiales de usuario y contraseña. No subir ni
compartir `.env`, credenciales o una URI real. `PORT` permite elegir el puerto;
por defecto es 3000.

Iniciar la aplicación:

```bash
npm start
```

El servidor espera la conexión a MongoDB antes de escuchar y la mantiene entre
solicitudes. Al recibir `SIGINT` o `SIGTERM`, cierra el servidor y luego la
conexión. Una URI vacía o con marcadores impide el arranque. El TP 08 de esta
copia no tenía un ajuste DNS especial para conservar; no se inventa uno. Si el
entorno del curso requiere uno autorizado, aplicarlo una sola vez en la
configuración de conexión, no por solicitud.

## Organización

| Ruta | Responsabilidad |
| --- | --- |
| `src/config/database.js` | Conexión a `reservas_salas_u9`. |
| `src/modelos/reserva.js` | Esquema Mongoose y validaciones. |
| `src/servicios/reservas.js` | Lectura, escritura, actualización y borrado. |
| `src/controladores/` | Respuestas HTML y JSON. |
| `src/rutas/` | Rutas HTML y API. |
| `src/middleware/` | Validación de entrada y manejo de errores. |
| `views/`, `public/` | Vistas EJS y estilos conservados del TP 08. |
| `tests/` | Pruebas unitarias de validación y operaciones del servicio. |

El sitio y la API utilizan el mismo servicio asíncrono y la misma colección.
Las modificaciones realizadas por API aparecen en el detalle, el listado HTML
y el conteo de `/estado`.

## Campos y validación

| Campo | Regla |
| --- | --- |
| `estudiante` | Texto obligatorio, recortado con `trim`. |
| `email` | Texto obligatorio, recortado y con `@`. |
| `sala` | `Sala Norte`, `Sala Sur` o `Sala Multimedia`. |
| `fecha` | Texto obligatorio, recortado; no se exige fecha futura. |
| `turno` | `Mañana`, `Tarde` o `Noche`. |
| `personas` | Entero entre 1 y 6. |
| `estado` | `pendiente` o `confirmada`; al crear, default `pendiente`. |

El POST conserva los seis campos originales e ignora campos extra; no permite
asignar `estado` ni `_id`. PUT exige los siete campos editables. PATCH admite
solo `personas` y/o `estado`, y rechaza el cuerpo vacío. En PUT y PATCH se
rechazan campos desconocidos, `_id`, operadores, cuerpos ausentes o arreglos.
`personas` puede enviarse como número o texto numérico no vacío; se valida que
sea finito, entero y esté entre 1 y 6. Los controles HTTP y el esquema
Mongoose aplican validaciones compatibles.

No se validan calendario, disponibilidad, solapamiento, cupo compartido ni
unicidad. Confirmar cambia el estado por decisión explícita, sin verificar esas
condiciones.

## API

Base local: `http://localhost:3000`. Las respuestas de error de la API son JSON;
un ID mal formado devuelve `400`, uno válido pero inexistente devuelve `404`.

| Método | URL | Resultado |
| --- | --- | --- |
| GET | `/api/reservas` | `200` y arreglo simple de reservas. |
| POST | `/api/reservas` | `201`, reserva con ID y `Location`; estado inicial `pendiente`. |
| GET | `/api/reservas/:id` | `200` y reserva, o `404`. |
| PUT | `/api/reservas/:id` | `200` y reemplazo completo con el mismo ID, o `404`. |
| PATCH | `/api/reservas/:id` | `200` y recurso con cambios parciales, o `404`. |
| DELETE | `/api/reservas/:id` | `204` sin cuerpo, o `404`. |

PUT y PATCH usan validadores de esquema, devuelven el documento posterior a la
modificación y mantienen `upsert: false`: modificar un ID inexistente nunca
crea una reserva. El servicio construye un reemplazo o un `$set` limitado a
campos permitidos; no envía el cuerpo HTTP completo a MongoDB. DELETE elimina
físicamente un único documento. Cambiar `estado` a `pendiente` no equivale a
borrar; un segundo DELETE y un GET posterior al borrado responden `404`.

Se conserva el listado sin filtros avanzados ni metadatos. Las consultas
avanzadas corresponden a la unidad 10.

## Prueba manual con Postman

Iniciar el servidor y usar Postman de escritorio. En GET y DELETE, dejar Body en
`none`. Para POST, PUT y PATCH, seleccionar Body → raw → JSON y verificar
`Content-Type: application/json`.

1. Enviar `POST /api/reservas` con datos ficticios:

   ```json
   {
     "estudiante": "Ana Ejemplo",
     "email": "ana@example.com",
     "sala": "Sala Norte",
     "fecha": "2026-10-28",
     "turno": "Mañana",
     "personas": 2
   }
   ```

   Guardar el ID y la cabecera `Location` de la respuesta `201`. La fecha es
   ilustrativa y no una regla de futuro.

2. Consultar el ID con GET. Enviar PUT a ese ID con los seis campos del ejemplo
   y `"estado": "confirmada"`; comprobar `200`, el mismo ID y los siete valores.
   Omitir un campo en otra prueba PUT: debe responder `400` y no modificar el
   recurso.

3. Enviar PATCH `{"personas": 3}`. Verificar que se conserva el resto de los
   campos, incluido `estado`. Probar también
   `{"estado": "pendiente"}`. Un cuerpo vacío, un campo extra, `_id`, `$set` o
   valores no válidos de personas deben responder `400` sin cambios.

4. Antes de borrar, verificar por GET el ID de una reserva creada para este
   ejercicio. Enviar DELETE: esperar `204` y cuerpo vacío. Confirmar `404` con
   GET posterior y que el arreglo del listado tenga una reserva menos. No borrar
   registros previos ni vaciar la colección.

5. Actualizar un registro de ejercicio y guardar su ID y valores. Reiniciar el
   servidor con la misma base y consultar el ID para verificar persistencia.
   Reiniciar también después de borrar otro registro de ejercicio y comprobar
   que siga ausente.

## Matriz de verificación

Los siguientes casos requieren configurar Atlas y ejecutarse con Postman o el
navegador. No se marcan como realizados hasta registrar sus resultados reales.

| Caso | Resultado esperado | Observación |
| --- | --- | --- |
| POST válido | `201`, `Location` y estado pendiente | Pendiente de ejecutar con Atlas. |
| GET de colección e individual | `200`, arreglo y recurso guardados | Pendiente de ejecutar con Atlas. |
| PUT completo / incompleto | `200` mismo ID / `400` sin cambios | Pendiente de ejecutar con Atlas. |
| PATCH personas / estado | `200`, campos omitidos conservados | Pendiente de ejecutar con Atlas. |
| PATCH vacío, extras, `_id` o `$set` | `400`, sin modificación | Pendiente de ejecutar con Atlas. |
| Personas 0, 7, 2.5, booleano, arreglo u objeto | `400`, sin modificación | Pendiente de ejecutar con Atlas. |
| Estado o enum inválido | `400`, sin modificación | Pendiente de ejecutar con Atlas. |
| ID mal formado / válido ausente | `400` / `404` | Pendiente de ejecutar. |
| JSON mal formado o cuerpo ausente | `400` JSON | Pendiente de ejecutar. |
| DELETE existente, repetir DELETE y GET | `204`; luego `404` | Pendiente de ejecutar con Atlas. |
| Reiniciar tras actualizar y eliminar | Cambios persistidos | Pendiente de ejecutar con Atlas. |
| Formulario, listado, detalle y `/estado` | Contratos y conteo conservados | Pendiente de probar en navegador. |
| URI vacía o con marcadores | El servidor no inicia ni escucha | Comprobable sin credenciales. |

Registrar ID, cantidades y respuestas observadas; no inventar resultados ni
utilizar datos personales reales. Una falla inesperada debe revisarse en un
entorno de ejercicio aislado, sin alterar usuarios, accesos o clústeres
compartidos.

## Calidad

```bash
npm run format
npm run check
```

`check` valida la sintaxis de las fuentes y ejecuta las pruebas unitarias con
Node.js. Las pruebas contra la base real, la persistencia tras reiniciar y la
interfaz en navegador se completan una vez configurado el entorno privado de
Atlas.
