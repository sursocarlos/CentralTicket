const { Sequelize } = require("sequelize");

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "Falta la variable de entorno DATABASE_URL. Crea un archivo .env en /backend o configúrala en tu entorno antes de arrancar el servidor.",
  );
}

const sequelize = new Sequelize(databaseUrl, {
  dialect: "postgres",
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

// ── Importar modelos ─────────────────────────────────────
const Usuario = require("./usuario")(sequelize);
const Categoria = require("./Categoria")(sequelize);
const Incidencia = require("./Incidencia")(sequelize);
const Comentario = require("./Comentario")(sequelize);
const HistorialEstado = require("./HistorialEstado")(sequelize);

// ── Asociaciones ─────────────────────────────────────────

// Usuario ↔ Incidencia
Usuario.hasMany(Incidencia, {
  foreignKey: "id_creador",
  as: "incidenciasCreadas",
});
Usuario.hasMany(Incidencia, {
  foreignKey: "id_tecnico",
  as: "incidenciasAsignadas",
});
Incidencia.belongsTo(Usuario, { foreignKey: "id_creador", as: "creador" });
Incidencia.belongsTo(Usuario, { foreignKey: "id_tecnico", as: "tecnico" });

// Categoria ↔ Incidencia
Categoria.hasMany(Incidencia, {
  foreignKey: "id_categoria",
  as: "incidencias",
});
Incidencia.belongsTo(Categoria, {
  foreignKey: "id_categoria",
  as: "categoria",
});

// Incidencia ↔ Comentario
Incidencia.hasMany(Comentario, {
  foreignKey: "id_incidencia",
  as: "comentarios",
  onDelete: "CASCADE",
});
Comentario.belongsTo(Incidencia, {
  foreignKey: "id_incidencia",
  as: "incidencia",
});

// Usuario ↔ Comentario
// Alias distinto a "comentarios" para evitar conflicto con Incidencia.hasMany
Usuario.hasMany(Comentario, {
  foreignKey: "id_usuario",
  as: "comentariosEscritos",
});
Comentario.belongsTo(Usuario, { foreignKey: "id_usuario", as: "autor" });

// Incidencia ↔ HistorialEstado
Incidencia.hasMany(HistorialEstado, {
  foreignKey: "id_incidencia",
  as: "historial",
  onDelete: "CASCADE",
});
HistorialEstado.belongsTo(Incidencia, {
  foreignKey: "id_incidencia",
  as: "incidencia",
});

// Usuario ↔ HistorialEstado
Usuario.hasMany(HistorialEstado, {
  foreignKey: "id_usuario",
  as: "historialCambios",
});
HistorialEstado.belongsTo(Usuario, { foreignKey: "id_usuario", as: "usuario" });

// ── Funciones de utilidad ────────────────────────────────
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Conexión con la BD establecida.");
    return true;
  } catch (error) {
    console.error("❌ Error al conectar con la BD:", error.message);
    return false;
  }
};

const syncDatabase = async () => {
  try {
    await sequelize.query(`
      ALTER TABLE incidencias
      ADD COLUMN IF NOT EXISTS fecha_actualizacion TIMESTAMP WITH TIME ZONE
    `);
    await sequelize.query(`
      ALTER TABLE categorias
      ADD COLUMN IF NOT EXISTS color VARCHAR(255) DEFAULT '#6366f1'
    `);
    await sequelize.query(`
      ALTER TABLE categorias
      ADD COLUMN IF NOT EXISTS activa BOOLEAN DEFAULT true
    `);
    await sequelize.query(`
      ALTER TABLE categorias
      ADD COLUMN IF NOT EXISTS fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    `);

    try {
      await sequelize.query(`
        UPDATE usuarios
        SET fecha_actualizacion = COALESCE(fecha_actualizacion, fecha_creacion, NOW())
        WHERE fecha_actualizacion IS NULL
      `);
    } catch (_) {}

    await sequelize.sync();
    console.log("✅ Modelos sincronizados con la BD.");
  } catch (error) {
    console.error("❌ Error al sincronizar modelos:", error.message);
  }
};

module.exports = {
  sequelize,
  Usuario,
  Categoria,
  Incidencia,
  Comentario,
  HistorialEstado,
  testConnection,
  syncDatabase,
};
