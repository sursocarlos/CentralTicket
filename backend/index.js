// Clase encargada de arrancar el backend:
// Carga las variables de entorno
// Aplica seguridad:
//    - Helmet (Cabeceras HTTP seguras)
//    - CORS (Solo peticiones del frontend)
//    - Rate limiters (1000 peticiones máximo, 50 intentos login , 15 min)
// Body parser: Se trae las peticiones JSON y las pasa a JS
// Monta las rutas
// Control de errores globales.
// Arranque seguro

// Cargamos las variables de entorno (.env) y las hacemos accesibles para TODO el proyecto.
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { testConnection, syncDatabase } = require("./models");

const authRoutes = require("./routes/auth");
const usuariosRoutes = require("./routes/usuarios");
const categoriasRoutes = require("./routes/categorias");
const incidenciasRoutes = require("./routes/incidencias");
const comentariosRoutes = require("./routes/comentarios");

const app = express();

// Definimos el puerto 3000 como fallback. Si no ecuentra la variable de entorno, usa el puerto 3000 por defecto.
const PORT = process.env.PORT || 3000;

// Almacenamos la URL del frontend para que el CORS permita UNICAMENTE las peticiones de esa URL
const allowedOrigin = (
  process.env.FRONTEND_URL || "http://localhost:5173"
).replace(/\/$/, "");

// --- Seguridad: cabeceras HTTP seguras ---
// Se pone entre el servidor y el usuario, intercepta la respuesta y
// le añade cabeceras (reglas) de seguridad para proteger al navegador del usuario contra ataques comunes.
app.use(helmet());

// --- CORS: solo permite el frontend ---
// Medida de seguridad: Permite unicamente las peticiones de nuestro frontend
app.use(
  cors({
    origin: allowedOrigin,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// --- Rate limiting: máx 1000 peticiones por IP cada 15 min ---
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas peticiones. Inténtalo más tarde." },
});
app.use(limiter);

// --- Rate limiting más estricto para login (evitar fuerza bruta) ---
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: "Demasiados intentos de login. Espera 15 minutos." },
});

// --- Body parser ---
// Se trae los datos del frontend en formato JSON (Cuando el usuario crea una indicencia , pone un comentario etc...)
// Los pasa a JavaScript para que posteriormente Sequelize lo pase a SQL para que lo pueda leer PostgreSQL.
// Ponemos un limite maximo de 10mb por seguridad. Si se envia una petición de mas de 10mb se bloquea automaticamente.
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// --- Rutas ---
// Usamos el router de Express para enlazar las rutas virtuales de la API
// a sus correspondiente modulos de la carpeta backend/routes.
// Lo hacemos unicamente para tener un codigo mas ordenado,
// sino tendriaamos que tener todos los modelos en index.js, lo que se traduce en codigo espagueti
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/categorias", categoriasRoutes);
app.use("/api/incidencias", incidenciasRoutes);
app.use("/api/comentarios", comentariosRoutes);

// --- Ruta de estado ---
// Permite comprobar en cualquier momento si el servidor y la base de datos están funcionando
// http://localhost:3000/api/status
app.get("/api/status", async (req, res) => {
  const dbOk = await testConnection();
  res.json({
    status: dbOk ? "ok" : "error",
    message: dbOk
      ? "CentralTicket API funcionando correctamente"
      : "Error de conexión con la base de datos",
    version: "1.0.0",
  });
});

// --- Manejo de rutas no encontradas ---
// Si ninguna ruta coincide con lo que pidió el cliente, caemos aquí.
// Respondemos con un 404 limpio en vez de dejar que Express explote por su cuenta.
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// --- Manejo global de errores ---
// Si en cualquier controlador se lanza un error inesperado y se propaga
// con next(err), este middleware lo captura como último recurso.
app.use((err, req, res, next) => {
  console.error("Error no controlado:", err);
  res.status(500).json({ error: "Error interno del servidor" });
});

// --- Arranque ---
// El servidor solo empieza a aceptar peticiones después de que la conexión
// con PostgreSQL esté establecida y los modelos Sequelize sincronizados.
const startServer = async () => {
  await syncDatabase();
  app.listen(PORT, () => {
    console.log(`🚀 CentralTicket API en http://localhost:${PORT}`);
  });
};

startServer();
