const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const { Categoria } = require("../models");
const {
  verificarToken,
  verificarRol,
} = require("../middlewares/authMiddleware");

// GET /api/categorias — todos los autenticados
router.get("/", verificarToken, async (req, res) => {
  try {
    const categorias = await Categoria.findAll({
      where: { activa: true },
      order: [["nombre", "ASC"]],
    });
    res.json(categorias);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener categorías." });
  }
});

// POST /api/categorias — solo admin
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
    if (!errores.isEmpty()) {
      return res.status(400).json({ errores: errores.array() });
    }

    try {
      const categoria = await Categoria.create(req.body);
      res.status(201).json(categoria);
    } catch (error) {
      console.error("Error creando categoria:", error);
      res.status(500).json({ error: "Error al crear categoría." });
    }
  },
);

// PUT /api/categorias/:id — solo admin
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

// DELETE /api/categorias/:id — soft delete
router.delete(
  "/:id",
  verificarToken,
  verificarRol("admin"),
  async (req, res) => {
    try {
      const categoria = await Categoria.findByPk(req.params.id);
      if (!categoria)
        return res.status(404).json({ error: "Categoría no encontrada." });

      await categoria.update({ activa: false });
      res.json({ mensaje: "Categoría desactivada." });
    } catch (error) {
      res.status(500).json({ error: "Error al eliminar categoría." });
    }
  },
);

module.exports = router;
