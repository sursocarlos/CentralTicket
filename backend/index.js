require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Sequelize } = require("sequelize");

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de la base de datos
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: false,
});

// Middlewares
app.use(cors()); // Permite que React (puerto 5173) hable con Node (puerto 3000)
app.use(express.json());

// Ruta de estado para el Frontend
app.get("/api/status", async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({
      status: "ok",
      message:
        "Servidor de CentralTicket funcionando y Base de Datos conectada",
    });
  } catch (error) {
    res
      .status(500)
      .json({ status: "error", message: "Fallo de conexión con la BD" });
  }
});

app.listen(PORT, () => {
  console.log(
    `🚀 Servidor de CentralTicket escuchando en http://localhost:${PORT}`,
  );
});
