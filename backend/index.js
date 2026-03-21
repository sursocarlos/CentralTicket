// 1. Cargamos la configuración del archivo .env
require("dotenv").config();
const { Sequelize } = require("sequelize");

// 2. Creamos la conexión usando la URL que pegaste en el .env
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: false, // Esto es para que no nos llene la consola de mensajes raros de SQL
});

// 3. Función asíncrona para probar la conexión
async function probarConexion() {
  console.log("🔄 Intentando conectar con Supabase...");

  try {
    // El método .authenticate() es el que hace la magia
    await sequelize.authenticate();
    console.log(
      "✅ ¡BRUTAL! La conexión funciona. El servidor y la base de datos se entienden perfectamente.",
    );
  } catch (error) {
    console.error("❌ Vaya, algo ha fallado en la conexión:", error.message);
    console.log(
      "\n💡 Consejo: Revisa que la contraseña en el .env sea correcta y que no tenga caracteres raros sin escapar.",
    );
  } finally {
    // Cerramos la conexión para que el script termine
    await sequelize.close();
    process.exit();
  }
}

// Ejecutamos la prueba
probarConexion();
