require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Sequelize, DataTypes } = require("sequelize");

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de la base de datos (Session Pooler para IPv4)
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

// Modelo de Usuario
const Usuario = sequelize.define("Usuario", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.TEXT, allowNull: false },
  email: { type: DataTypes.TEXT, allowNull: false, unique: true },
  password: { type: DataTypes.TEXT, allowNull: false },
  rol: { type: DataTypes.TEXT, allowNull: false },
}, {
  tableName: "usuarios",
  timestamps: false,
});

// Middlewares
app.use(cors());
app.use(express.json());

// ── Ruta de estado ──────────────────────────────────────────────
app.get("/api/status", async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: "ok", message: "Servidor de CentralTicket funcionando y Base de Datos conectada" });
  } catch (error) {
    console.error("Error de BD:", error.message);
    res.status(500).json({ status: "error", message: error.message });
  }
});

// ── Ruta de Login ───────────────────────────────────────────────
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  // Validación básica
  if (!email || !password) {
    return res.status(400).json({ status: "error", message: "Email y contraseña son obligatorios" });
  }

  try {
    // Buscar usuario por email
    const usuario = await Usuario.findOne({ where: { email } });

    if (!usuario) {
      return res.status(401).json({ status: "error", message: "Usuario no encontrado" });
    }

    // Verificar contraseña (texto plano para el prototipo)
    if (usuario.password !== password) {
      return res.status(401).json({ status: "error", message: "Contraseña incorrecta" });
    }

    // Login correcto — devolver datos del usuario (sin la contraseña)
    res.json({
      status: "ok",
      message: "Login correcto",
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      },
    });

  } catch (error) {
    console.error("Error en login:", error.message);
    res.status(500).json({ status: "error", message: "Error interno del servidor" });
  }
});

// ── Arranque ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Servidor de CentralTicket escuchando en http://localhost:${PORT}`);
});
