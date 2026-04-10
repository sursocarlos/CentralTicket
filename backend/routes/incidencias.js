const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const { Op } = require("sequelize");
const { Incidencia, Usuario, Categoria, Comentario } = require("../models");
const {
  verificarToken,
  verificarRol,
} = require("../middlewares/authMiddleware");

// GET /api/incidencias — filtrado según rol
router.get("/", verificarToken, async (req, res) => {
  try {
    const { rol, id } = req.usuario;
    const { estado, prioridad } = req.query;

    const where = {};
    if (rol === "empleado") where.id_creador = id;
    if (estado) where.estado = estado;
    if (prioridad) where.prioridad = prioridad;

    const incidencias = await Incidencia.findAll({
      where,
      include: [
        {
          model: Usuario,
          as: "creador",
          attributes: ["id", "nombre", "email"],
        },
        {
          model: Usuario,
          as: "tecnico",
          attributes: ["id", "nombre", "email"],
        },
        {
          model: Categoria,
          as: "categoria",
          attributes: ["id", "nombre", "color"],
        },
      ],
      order: [["fecha_creacion", "DESC"]],
    });

    res.json(incidencias);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener incidencias." });
  }
});

// GET /api/incidencias/stats — estadísticas para admin
router.get(
  "/stats",
  verificarToken,
  verificarRol("admin"),
  async (req, res) => {
    try {
      const total = await Incidencia.count();
      const abiertas = await Incidencia.count({ where: { estado: "abierta" } });
      const proceso = await Incidencia.count({
        where: { estado: "en proceso" },
      });
      const resueltas = await Incidencia.count({
        where: { estado: "resuelta" },
      });

      res.json({ total, abiertas, proceso, resueltas });
    } catch (error) {
      res.status(500).json({ error: "Error al obtener estadísticas." });
    }
  },
);

// GET /api/incidencias/:id
router.get("/:id", verificarToken, async (req, res) => {
  try {
    const incidencia = await Incidencia.findByPk(req.params.id, {
      include: [
        {
          model: Usuario,
          as: "creador",
          attributes: ["id", "nombre", "email"],
        },
        {
          model: Usuario,
          as: "tecnico",
          attributes: ["id", "nombre", "email"],
        },
        { model: Categoria, as: "categoria" },
        {
          model: Comentario,
          as: "comentarios",
          include: [
            {
              model: Usuario,
              as: "autor",
              attributes: ["id", "nombre", "rol"],
            },
          ],
          order: [["fecha_creacion", "ASC"]],
        },
      ],
    });

    if (!incidencia)
      return res.status(404).json({ error: "Incidencia no encontrada." });

    const { rol, id } = req.usuario;
    if (rol === "empleado" && incidencia.id_creador !== id) {
      return res
        .status(403)
        .json({ error: "No tienes permiso para ver esta incidencia." });
    }

    res.json(incidencia);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener la incidencia." });
  }
});

// POST /api/incidencias — empleado, técnico o admin
router.post(
  "/",
  verificarToken,
  [
    body("titulo").notEmpty().trim().withMessage("El título es obligatorio"),
    body("descripcion").notEmpty().withMessage("La descripción es obligatoria"),
    body("prioridad")
      .isIn(["baja", "media", "alta"])
      .withMessage("Prioridad inválida"),
  ],
  async (req, res) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({ errores: errores.array() });
    }

    try {
      const incidencia = await Incidencia.create({
        ...req.body,
        id_creador: req.usuario.id,
        estado: "abierta",
      });

      const incidenciaCompleta = await Incidencia.findByPk(incidencia.id, {
        include: [
          { model: Usuario, as: "creador", attributes: ["id", "nombre"] },
          { model: Categoria, as: "categoria" },
        ],
      });

      res.status(201).json(incidenciaCompleta);
    } catch (error) {
      console.error("Error creando incidencia:", error);
      res.status(500).json({ error: "Error al crear la incidencia." });
    }
  },
);

// PATCH /api/incidencias/:id/estado — técnico o admin
router.patch(
  "/:id/estado",
  verificarToken,
  verificarRol("tecnico", "admin"),
  [
    body("estado")
      .isIn(["abierta", "en proceso", "resuelta"])
      .withMessage("Estado inválido"),
  ],
  async (req, res) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({ errores: errores.array() });
    }

    try {
      const incidencia = await Incidencia.findByPk(req.params.id);
      if (!incidencia)
        return res.status(404).json({ error: "Incidencia no encontrada." });

      await incidencia.update({ estado: req.body.estado });
      res.json({ mensaje: "Estado actualizado.", incidencia });
    } catch (error) {
      res.status(500).json({ error: "Error al actualizar estado." });
    }
  },
);

// PATCH /api/incidencias/:id/asignar — solo admin
router.patch(
  "/:id/asignar",
  verificarToken,
  verificarRol("admin"),
  async (req, res) => {
    try {
      const incidencia = await Incidencia.findByPk(req.params.id);
      if (!incidencia)
        return res.status(404).json({ error: "Incidencia no encontrada." });

      await incidencia.update({ id_tecnico: req.body.id_tecnico });
      res.json({ mensaje: "Técnico asignado correctamente.", incidencia });
    } catch (error) {
      res.status(500).json({ error: "Error al asignar técnico." });
    }
  },
);

module.exports = router;
