// Este archivo gestiona todo lo relacionado con las categorias de las incidencias:

// GET /api/categorias — Muestra todas las categorias ACTIVAS. Cualquier usuario autenticado.

// GET /api/categorias/todas — Muestra todas las categorias, incluye inactivas. Solo ADMIN.

// POST /api/categorias : Crear categorias. Solo ADMIN.

// PUT /api/categorias/:id : Editar categoria. Solo ADMIN.

// PATCH /api/categorias/:id/toggle — Activar/Desactivar categorias. Solo ADMIN.

// DELETE /api/categorias/:id : Eliminar categorias. Solo ADMIN.

const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const { Categoria } = require("../models");
const {
  verificarToken,
  verificarRol,
} = require("../middlewares/authMiddleware");

// GET /api/categorias — Cualquier usuario autenticado. Devuelve solo las activas.
router.get(
  "/todas",
  verificarToken,
  verificarRol("admin"),
  async (req, res) => {
    try {
      const categorias = await Categoria.findAll({
        order: [["nombre", "ASC"]],
      });
      res.json(categorias);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener categorías." });
    }
  },
);

// GET /api/categorias — Obtener solo categorías activas (para todos los usuarios)
router.get("/", verificarToken, async (req, res) => {
  try {
    const categorias = await Categoria.findAll({
      where: { activa: true }, // Solo mostramos las que no están desactivadas
      order: [["nombre", "ASC"]],
    });
    res.json(categorias);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener categorías." });
  }
});

// POST /api/categorias — solo admin
// Nos permite crear categorias
router.post(
  "/",
  verificarToken,
  verificarRol("admin"),
  [
    body("nombre").notEmpty().withMessage("El nombre es obligatorio").trim(),
    body("color").optional().isHexColor().withMessage("Color inválido"),
  ],
  async (req, res) => {
    const errores = validationResult(req);
    if (!errores.isEmpty())
      return res.status(400).json({ errores: errores.array() });

    try {
      const categoria = await Categoria.create(req.body);
      res.status(201).json(categoria);
    } catch (error) {
      res.status(500).json({ error: "Error al crear categoría." });
    }
  },
);

// PUT /api/categorias/:id — solo admin
// Nos permite editar categorias
router.put("/:id", verificarToken, verificarRol("admin"), async (req, res) => {
  try {
    const categoria = await Categoria.findByPk(req.params.id);
    if (!categoria)
      return res.status(404).json({ error: "Categoría no encontrada." });

    await categoria.update(req.body);
    res.json(categoria);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar categoría." });
  }
});

// PATCH /api/categorias/:id/toggle — activar o desactivar
// Nos permite desactivar categorias
router.patch(
  "/:id/toggle",
  verificarToken,
  verificarRol("admin"),
  async (req, res) => {
    try {
      const categoria = await Categoria.findByPk(req.params.id);
      if (!categoria)
        return res.status(404).json({ error: "Categoría no encontrada." });

      await categoria.update({ activa: !categoria.activa });
      res.json({
        mensaje: `Categoría ${categoria.activa ? "activada" : "desactivada"} correctamente.`,
        categoria,
      });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Error al cambiar estado de la categoría." });
    }
  },
);

// DELETE /api/categorias/:id — eliminación física permanente
// Nos permite eliminar categorias
router.delete(
  "/:id",
  verificarToken,
  verificarRol("admin"),
  async (req, res) => {
    try {
      const categoria = await Categoria.findByPk(req.params.id);
      if (!categoria)
        return res.status(404).json({ error: "Categoría no encontrada." });

      await categoria.destroy();
      res.json({ mensaje: "Categoría eliminada permanentemente." });
    } catch (error) {
      res.status(500).json({ error: "Error al eliminar categoría." });
    }
  },
);

module.exports = router;
