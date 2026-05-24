// Este archivo gestiona todo lo relacionado con la gestión de usuarios:

// GET /api/usuarios : Obtiene la lista completa de usuarios

// GET /api/usuarios/tecnicos: Obtiene la lista de tecnicos

// PUT /api/usuarios/:id : Modificar usuarios

// PATCH /api/usuarios/:id/toggle : Activar/Desactivar usuarios

// DELETE /api/usuarios/:id : Eliminar usuarios

const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const { Usuario } = require("../models");
const {
  verificarToken,
  verificarRol,
} = require("../middlewares/authMiddleware");

// GET /api/usuarios — solo admin: Listar todos los usuarios
// Vista general del usuaario admin
router.get("/", verificarToken, verificarRol("admin"), async (req, res) => {
  try {
    // Hacemos una consulta para traernos todos los usuarios ordenados por fecha de creación.
    // Excluimos la contraseña del usuario
    const usuarios = await Usuario.findAll({
      attributes: { exclude: ["password"] },
      order: [["fecha_creacion", "DESC"]],
    });
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener usuarios." });
  }
});

// GET /api/usuarios/tecnicos: Listar técnicos activos
// Formulario de crear/editar incidencias para mostrar el desplegable de técnicos disponibles
router.get("/tecnicos", verificarToken, async (req, res) => {
  try {
    // Comprobamos el token del usuario
    const tecnicos = await Usuario.findAll({
      where: { rol: "tecnico", activo: true },
      attributes: ["id", "nombre", "email"],
    });
    res.json(tecnicos);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener técnicos." });
  }
});

// PUT /api/usuarios/:id — editar usuario
// Sino se modifica un campo se queda tal y como estaba
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
    if (!errores.isEmpty())
      return res.status(400).json({ errores: errores.array() });

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

// PATCH /api/usuarios/:id/toggle — activar o desactivar
router.patch(
  "/:id/toggle",
  verificarToken,
  verificarRol("admin"),
  async (req, res) => {
    try {
      const usuario = await Usuario.findByPk(req.params.id);
      if (!usuario)
        return res.status(404).json({ error: "Usuario no encontrado." });

      // Comprobamos el usuario que esta realizando la acción para que el admin no se pueda desactivar a si mismo
      if (usuario.id === req.usuario.id)
        return res
          .status(400)
          .json({ error: "No puedes desactivarte a ti mismo." });

      await usuario.update({ activo: !usuario.activo });
      res.json({
        mensaje: `Usuario ${usuario.activo ? "activado" : "desactivado"} correctamente.`,
        usuario: usuario.toSafeJSON(),
      });
    } catch (error) {
      res.status(500).json({ error: "Error al cambiar estado del usuario." });
    }
  },
);

// DELETE /api/usuarios/:id — eliminación física permanente
router.delete(
  "/:id",
  verificarToken,
  verificarRol("admin"),
  async (req, res) => {
    try {
      const usuario = await Usuario.findByPk(req.params.id);
      if (!usuario)
        return res.status(404).json({ error: "Usuario no encontrado." });
      // Comprobamos el usuario que esta realizando la acción para que el admin no se pueda eliminarse a si mismo
      if (usuario.id === req.usuario.id)
        return res
          .status(400)
          .json({ error: "No puedes eliminarte a ti mismo." });

      await usuario.destroy();
      res.json({ mensaje: "Usuario eliminado permanentemente." });
    } catch (error) {
      res.status(500).json({ error: "Error al eliminar usuario." });
    }
  },
);

module.exports = router;
