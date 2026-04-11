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
      rejectUnauthorized: false, // Necesario para Supabase/Render
    },
  },
});

// Importar modelos
const Usuario = require("./usuario")(sequelize);
const Categoria = require("./Categoria")(sequelize);
const Incidencia = require("./Incidencia")(sequelize);
const Comentario = require("./Comentario")(sequelize);

// --- Asociaciones ---

// Un usuario puede crear muchas incidencias
Usuario.hasMany(Incidencia, {
  foreignKey: "id_creador",
  as: "incidenciasCreadas",
});
Incidencia.belongsTo(Usuario, { foreignKey: "id_creador", as: "creador" });

// Un técnico puede tener muchas incidencias asignadas
Usuario.hasMany(Incidencia, {
  foreignKey: "id_tecnico",
  as: "incidenciasAsignadas",
});
Incidencia.belongsTo(Usuario, { foreignKey: "id_tecnico", as: "tecnico" });

// Una categoría tiene muchas incidencias
Categoria.hasMany(Incidencia, {
  foreignKey: "id_categoria",
  as: "incidencias",
});
Incidencia.belongsTo(Categoria, {
  foreignKey: "id_categoria",
  as: "categoria",
});

// Una incidencia tiene muchos comentarios
Incidencia.hasMany(Comentario, {
  foreignKey: "id_incidencia",
  as: "comentarios",
  onDelete: "CASCADE",
});
Comentario.belongsTo(Incidencia, {
  foreignKey: "id_incidencia",
  as: "incidencia",
});

// Un usuario tiene muchos comentarios
Usuario.hasMany(Comentario, { foreignKey: "id_usuario", as: "comentarios" });
Comentario.belongsTo(Usuario, { foreignKey: "id_usuario", as: "autor" });

// --- Funciones de utilidad ---
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
    // Ajustes mínimos de esquema para BD heredada (sin usar alter global).
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

    // Backfill defensivo: evita fallos al imponer NOT NULL en columnas
    // de timestamps cuando existen registros antiguos con valor NULL.
    try {
      await sequelize.query(`
        UPDATE usuarios
        SET fecha_actualizacion = COALESCE(fecha_actualizacion, fecha_creacion, NOW())
        WHERE fecha_actualizacion IS NULL
      `);
    } catch (_backfillError) {
      // Si la tabla/columna aún no existe (entornos nuevos), continuamos.
    }

    // sync() crea tablas faltantes sin alterar estructura existente.
    // Evita errores peligrosos de alter automático (ENUMs, NOT NULL, etc.).
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
  testConnection,
  syncDatabase,
};
