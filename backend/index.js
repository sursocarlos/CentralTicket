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
const PORT = process.env.PORT || 3000;
const allowedOrigin = (process.env.FRONTEND_URL || "http://localhost:5173").replace(
  /\/$/,
  "",
);

// --- Seguridad: cabeceras HTTP seguras ---
app.use(helmet());

// --- CORS: solo permite el frontend ---
app.use(
  cors({
    origin: allowedOrigin,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// --- Rate limiting: máx 100 peticiones por IP cada 15 min ---
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas peticiones. Inténtalo más tarde." },
});
app.use(limiter);

// --- Rate limiting más estricto para login (evitar fuerza bruta) ---
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Demasiados intentos de login. Espera 15 minutos." },
});

// --- Body parser ---
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// --- Rutas ---
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/categorias", categoriasRoutes);
app.use("/api/incidencias", incidenciasRoutes);
app.use("/api/comentarios", comentariosRoutes);

// --- Ruta de estado ---
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
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// --- Manejo global de errores ---
app.use((err, req, res, next) => {
  console.error("Error no controlado:", err);
  res.status(500).json({ error: "Error interno del servidor" });
});

// --- Arranque ---
const startServer = async () => {
  await syncDatabase();
  app.listen(PORT, () => {
    console.log(`🚀 CentralTicket API en http://localhost:${PORT}`);
  });
};

startServer();
