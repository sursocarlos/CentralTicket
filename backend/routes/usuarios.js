const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const { Usuario } = require("../models");
const {
  verificarToken,
  verificarRol,
} = require("../middlewares/authMiddleware");

// GET /api/usuarios — solo admin
router.get("/", verificarToken, verificarRol("admin"), async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      attributes: { exclude: ["password"] },
      order: [["fecha_creacion", "DESC"]],
    });
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener usuarios." });
  }
});

// GET /api/usuarios/tecnicos — admin y empleado (para asignar)
router.get("/tecnicos", verificarToken, async (req, res) => {
  try {
    const tecnicos = await Usuario.findAll({
      where: { rol: "tecnico", activo: true },
      attributes: ["id", "nombre", "email"],
    });
    res.json(tecnicos);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener técnicos." });
  }
});

// PUT /api/usuarios/:id — admin puede editar cualquiera
router.put(
  "/:id",
  verificarToken,
  verificarRol("admin"),
  [
    body("nombre").optional().notEmpty().trim(),
    body("email").optional().isEmail().normalizeEmail(),
    body("rol").optional().isIn(["admin", "tecnico", "empleado"]),
    body("activo").optional().isBoolean(),
  ],
  async (req, res) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({ errores: errores.array() });
    }

    try {
      const usuario = await Usuario.findByPk(req.params.id);
      if (!usuario)
        return res.status(404).json({ error: "Usuario no encontrado." });

      const { nombre, email, rol, activo, password } = req.body;
      const datos = {};
      if (nombre !== undefined) datos.nombre = nombre;
      if (email !== undefined) datos.email = email;
      if (rol !== undefined) datos.rol = rol;
      if (activo !== undefined) datos.activo = activo;
      if (password !== undefined) datos.password = password;

      await usuario.update(datos);
      res.json({
        mensaje: "Usuario actualizado.",
        usuario: usuario.toSafeJSON(),
      });
    } catch (error) {
      res.status(500).json({ error: "Error al actualizar usuario." });
    }
  },
);

// DELETE /api/usuarios/:id — soft delete (desactivar)
router.delete(
  "/:id",
  verificarToken,
  verificarRol("admin"),
  async (req, res) => {
    try {
      const usuario = await Usuario.findByPk(req.params.id);
      if (!usuario)
        return res.status(404).json({ error: "Usuario no encontrado." });

      await usuario.update({ activo: false });
      res.json({ mensaje: "Usuario desactivado correctamente." });
    } catch (error) {
      res.status(500).json({ error: "Error al desactivar usuario." });
    }
  },
);

module.exports = router;
