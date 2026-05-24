// Configura toda la capa de datos de la aplicación:
// Realiza la conexión con la BD
// Carga los modelos
// Define las relaciones entre tablas
// Sincroniza los modelos con la BD al arrancar
// Exporta los modelos para que sean accesibles en todo el proyecto

const { Sequelize } = require("sequelize");

// Comprobamos que la URL de la base de datos es correcta.
// Si no existe, lanza un error y para todo antes de intentar arrancar.
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "Falta la variable de entorno DATABASE_URL. Crea un archivo .env en /backend o configúrala en tu entorno antes de arrancar el servidor.",
  );
}

// Crea la instancia de Sequelize que usará toda la aplicación.
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
// Aqui le decimos a Sequelize cómo se relacionan las tablas entre sí.
// hasMany → "tiene muchos"
// belongsTo → "pertenece a"

// Usuario ↔ Incidencia
Usuario.hasMany(Incidencia, {
  foreignKey: "id_creador",
  as: "incidenciasCreadas",
  onDelete: "SET NULL",
});
Usuario.hasMany(Incidencia, {
  foreignKey: "id_tecnico",
  as: "incidenciasAsignadas",
  onDelete: "SET NULL",
});
Incidencia.belongsTo(Usuario, {
  foreignKey: "id_creador",
  as: "creador",
  onDelete: "SET NULL",
});
Incidencia.belongsTo(Usuario, {
  foreignKey: "id_tecnico",
  as: "tecnico",
  onDelete: "SET NULL",
});

// Categoria ↔ Incidencia
Categoria.hasMany(Incidencia, {
  foreignKey: "id_categoria",
  as: "incidencias",
  onDelete: "SET NULL",
});
Incidencia.belongsTo(Categoria, {
  foreignKey: "id_categoria",
  as: "categoria",
  onDelete: "SET NULL",
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
  onDelete: "SET NULL",
});
Comentario.belongsTo(Usuario, {
  foreignKey: "id_usuario",
  as: "autor",
  onDelete: "SET NULL",
});

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
  onDelete: "SET NULL",
});
HistorialEstado.belongsTo(Usuario, {
  foreignKey: "id_usuario",
  as: "usuario",
  onDelete: "SET NULL",
});

// ── Funciones de utilidad ────────────────────────────────
// Intentamos conectarnos a la base de datos
// Devuelve true si funciona y false si no.
// Usamos /api/status
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

// Comprobamos que la base de datos este sincronizada
// Comprobamos que todas las tablas y comlumnas existen
// en la BD y las creamos si falta alguna.
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

// Exportamos los modelos y funciones para poder usarlos
// desde cualquier otro archivo del proyecto.
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
