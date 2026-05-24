// Gestiona todo el ciclo de vida de una incidencia:

// GET /api/incidencias: Listamos las incidencias según rol

// GET /api/incidencias/stats : Devuelve conteos por estado para el dashboard del admin

// GET /api/incidencias/:id : Devuelve una incidencia completa con comentarios e historial. Comprueba que el usuario tiene permiso para verla

//PATCH /api/incidencias/:id/estado : Cambia el estado y registra el cambio en HistorialEstado automáticamente

// POST /api/incidencias: Crea una incidencia. El creador y el estado inicial los asigna el servidor, no el frontend

// PATCH /api/incidencias/:id/asignar: Asigna o desasigna un técnico. Solo admin

// DELETE /api/incidencias/:id: Elimina la incidencia y en cascada sus comentarios e historial. Solo admin

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
// Listar incidencias según rol
router.get("/", verificarToken, async (req, res) => {
  try {
    // Comprobamos el usuario que quiere acceder a esas incidencias
    const { rol, id } = req.usuario;

    // Nos permite filtrar las incidencias por estado y prioridad
    const { estado, prioridad, id_usuario } = req.query;

    const where = {};
    if (rol === "empleado") where.id_creador = id;
    if (rol === "tecnico") where.id_tecnico = id;
    if (estado) where.estado = estado;
    if (prioridad) where.prioridad = prioridad;
    if (rol === "admin" && id_usuario) where.id_creador = id_usuario;

    // Obtenemos los datos de las incidencias:
    // Creador, Tecnico, Categoria
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
// Cuenta el numero total de incidencias Abiertas, En proceso, y Resueltas
// Hace cuatro consultas de conteo a la BD.
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
// Ver una incidencia concreta
router.get("/:id", verificarToken, async (req, res) => {
  try {
    // Trae la incidencia completa con sus comentarios e historial de estados
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

    // Comprobamos que el usuario tiene permiso para ver esa incidencia
    // Aunque un empleado conozca el id de otra incidencia e intente acceder directamente por URL, aquí se le bloquea.
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
// Nos permite crear una incidencia
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
        // El estado de la incidencia SIMPRE arranca como "abierta"
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
// Nos permite cambiar el estado de la incidencia y registrar el cambio de la misma
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

      // Actualizamos el estado de la incidencia
      const estadoAnterior = incidencia.estado;
      const estadoNuevo = req.body.estado;

      if (estadoAnterior === estadoNuevo)
        return res.json({ mensaje: "Sin cambios.", incidencia });

      const updates = { estado: estadoNuevo };
      if (estadoNuevo === "resuelta") updates.fecha_resolucion = new Date();
      if (estadoNuevo !== "resuelta") updates.fecha_resolucion = null;

      await incidencia.update(updates);

      // Creamos un registro en la tabla HistorialEstado con el estado anterior, el nuevo, quién lo cambió y cuándo.
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
// Nos permite asignar una incidencia a un tecnico. Solo el admin.
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
// Nos permite eliminar incidencias. Solo el admin.
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
