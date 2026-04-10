const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const { Comentario, Usuario } = require("../models");
const { verificarToken } = require("../middlewares/authMiddleware");

// POST /api/comentarios — cualquier usuario autenticado
router.post(
  "/",
  verificarToken,
  [
    body("contenido")
      .notEmpty()
      .withMessage("El comentario no puede estar vacío")
      .trim(),
    body("id_incidencia").isInt().withMessage("ID de incidencia inválido"),
  ],
  async (req, res) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({ errores: errores.array() });
    }

    try {
      const comentario = await Comentario.create({
        contenido: req.body.contenido,
        id_incidencia: req.body.id_incidencia,
        id_usuario: req.usuario.id,
      });

      const comentarioCompleto = await Comentario.findByPk(comentario.id, {
        include: [
          { model: Usuario, as: "autor", attributes: ["id", "nombre", "rol"] },
        ],
      });

      res.status(201).json(comentarioCompleto);
    } catch (error) {
      res.status(500).json({ error: "Error al crear el comentario." });
    }
  },
);

// DELETE /api/comentarios/:id — solo el autor o admin
router.delete("/:id", verificarToken, async (req, res) => {
  try {
    const comentario = await Comentario.findByPk(req.params.id);
    if (!comentario)
      return res.status(404).json({ error: "Comentario no encontrado." });

    const esAutor = comentario.id_usuario === req.usuario.id;
    const esAdmin = req.usuario.rol === "admin";

    if (!esAutor && !esAdmin) {
      return res
        .status(403)
        .json({ error: "No tienes permiso para borrar este comentario." });
    }

    await comentario.destroy();
    res.json({ mensaje: "Comentario eliminado." });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar el comentario." });
  }
});

module.exports = router;
