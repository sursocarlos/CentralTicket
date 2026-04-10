const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const { Usuario } = require("../models");
const { verificarToken } = require("../middlewares/authMiddleware");

// POST /api/auth/login
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Email no válido").normalizeEmail(),
    body("password").notEmpty().withMessage("La contraseña es obligatoria"),
  ],
  async (req, res) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({ errores: errores.array() });
    }

    const { email, password } = req.body;

    try {
      const usuario = await Usuario.findOne({ where: { email, activo: true } });

      if (!usuario) {
        return res.status(401).json({ error: "Credenciales incorrectas." });
      }

      // Compatibilidad: permite login con contraseñas antiguas en texto plano
      // y las migra a hash bcrypt automáticamente tras login correcto.
      const pareceHashBcrypt = /^\$2[aby]\$\d{2}\$/.test(usuario.password || "");
      let passwordValida = false;

      if (pareceHashBcrypt) {
        passwordValida = await usuario.verificarPassword(password);
      } else {
        passwordValida = usuario.password === password;
        if (passwordValida) {
          await usuario.update({ password }); // Hook beforeUpdate aplica hash
        }
      }

      if (!passwordValida) {
        return res.status(401).json({ error: "Credenciales incorrectas." });
      }

      const token = jwt.sign(
        { id: usuario.id, rol: usuario.rol },
        process.env.JWT_SECRET,
        { expiresIn: "8h" },
      );

      res.json({
        mensaje: "Login correcto",
        token,
        usuario: usuario.toSafeJSON(),
      });
    } catch (error) {
      console.error("Error en login:", error);
      res.status(500).json({ error: "Error interno del servidor." });
    }
  },
);

// GET /api/auth/me — devuelve el usuario autenticado
router.get("/me", verificarToken, (req, res) => {
  res.json({ usuario: req.usuario });
});

// POST /api/auth/registro — solo para el primer admin (o protegerlo luego)
router.post(
  "/registro",
  [
    body("nombre").notEmpty().withMessage("El nombre es obligatorio").trim(),
    body("email").isEmail().withMessage("Email no válido").normalizeEmail(),
    body("password").isLength({ min: 6 }).withMessage("Mínimo 6 caracteres"),
    body("rol")
      .isIn(["admin", "tecnico", "empleado"])
      .withMessage("Rol no válido"),
  ],
  async (req, res) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({ errores: errores.array() });
    }

    const { nombre, email, password, rol } = req.body;

    try {
      const existe = await Usuario.findOne({ where: { email } });
      if (existe) {
        return res
          .status(409)
          .json({ error: "Este email ya está registrado." });
      }

      const usuario = await Usuario.create({ nombre, email, password, rol });

      res.status(201).json({
        mensaje: "Usuario creado correctamente",
        usuario: usuario.toSafeJSON(),
      });
    } catch (error) {
      console.error("Error en registro:", error);
      res.status(500).json({ error: "Error interno del servidor." });
    }
  },
);

module.exports = router;
