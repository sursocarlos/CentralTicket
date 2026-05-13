const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const {
  Incidencia,
  Usuario,
  Categoria,
  Comentario,
  HistorialEstado,
} = require("../models");
const {
  verificarToken,
  verificarRol,
} = require("../middlewares/authMiddleware");

// ── GET / — filtrado según rol ───────────────────────────
router.get("/", verificarToken, async (req, res) => {
  try {
    const { rol, id } = req.usuario;
    const { estado, prioridad, id_usuario } = req.query;

    const where = {};
    if (rol === "empleado") where.id_creador = id;
    if (rol === "tecnico") where.id_tecnico = id;
    if (estado) where.estado = estado;
    if (prioridad) where.prioridad = prioridad;
    if (rol === "admin" && id_usuario) where.id_creador = id_usuario;

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

// ── GET /stats — solo admin ──────────────────────────────
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

// ── GET /:id ─────────────────────────────────────────────
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
          separate: true,
          order: [["fecha_creacion", "ASC"]],
        },
        {
          model: HistorialEstado,
          as: "historial",
          include: [
            {
              model: Usuario,
              as: "usuario",
              attributes: ["id", "nombre", "rol"],
            },
          ],
          separate: true,
          order: [["fecha_cambio", "ASC"]],
        },
      ],
    });

    if (!incidencia)
      return res.status(404).json({ error: "Incidencia no encontrada." });

    const { rol, id } = req.usuario;
    if (rol === "empleado" && incidencia.id_creador !== id)
      return res
        .status(403)
        .json({ error: "No tienes permiso para ver esta incidencia." });
    if (rol === "tecnico" && incidencia.id_tecnico !== id)
      return res
        .status(403)
        .json({ error: "No tienes permiso para ver esta incidencia." });

    res.json(incidencia);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener la incidencia." });
  }
});

// ── POST / ───────────────────────────────────────────────
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
    if (!errores.isEmpty())
      return res.status(400).json({ errores: errores.array() });

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

// ── PATCH /:id/estado — técnico o admin ──────────────────
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
    if (!errores.isEmpty())
      return res.status(400).json({ errores: errores.array() });

    try {
      const incidencia = await Incidencia.findByPk(req.params.id);
      if (!incidencia)
        return res.status(404).json({ error: "Incidencia no encontrada." });

      const estadoAnterior = incidencia.estado;
      const estadoNuevo = req.body.estado;

      if (estadoAnterior === estadoNuevo)
        return res.json({ mensaje: "Sin cambios.", incidencia });

      const updates = { estado: estadoNuevo };
      if (estadoNuevo === "resuelta") updates.fecha_resolucion = new Date();
      if (estadoNuevo !== "resuelta") updates.fecha_resolucion = null;

      await incidencia.update(updates);

      await HistorialEstado.create({
        id_incidencia: incidencia.id,
        id_usuario: req.usuario.id,
        estado_anterior: estadoAnterior,
        estado_nuevo: estadoNuevo,
      });

      res.json({ mensaje: "Estado actualizado.", incidencia });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error al actualizar estado." });
    }
  },
);

// ── PATCH /:id/asignar — solo admin ──────────────────────
router.patch(
  "/:id/asignar",
  verificarToken,
  verificarRol("admin"),
  async (req, res) => {
    try {
      const incidencia = await Incidencia.findByPk(req.params.id);
      if (!incidencia)
        return res.status(404).json({ error: "Incidencia no encontrada." });

      await incidencia.update({ id_tecnico: req.body.id_tecnico || null });
      res.json({ mensaje: "Técnico asignado correctamente.", incidencia });
    } catch (error) {
      res.status(500).json({ error: "Error al asignar técnico." });
    }
  },
);

// ── DELETE /:id — solo admin ─────────────────────────────
router.delete(
  "/:id",
  verificarToken,
  verificarRol("admin"),
  async (req, res) => {
    try {
      const incidencia = await Incidencia.findByPk(req.params.id);
      if (!incidencia)
        return res.status(404).json({ error: "Incidencia no encontrada." });

      await incidencia.destroy();
      res.json({ mensaje: "Incidencia eliminada correctamente." });
    } catch (error) {
      res.status(500).json({ error: "Error al eliminar la incidencia." });
    }
  },
);

module.exports = router;
