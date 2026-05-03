require("dotenv").config();
const cron = require("node-cron");
const { exec } = require("child_process");
const { sequelize } = require("../models");
const path = require("path");
const fs = require("fs");

const BACKUP_DIR = path.join(__dirname, "../backups");
const LAST_STATE_FILE = path.join(BACKUP_DIR, "last_state.json");

if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR);

// 1. Metemos toda la lógica en una función reutilizable
async function ejecutarProcesoBackup() {
  console.log("⏳ Comprobando cambios en la base de datos...");

  try {
    const [results] = await sequelize.query(
      "SELECT sum(n_tup_ins + n_tup_upd + n_tup_del) as total_cambios FROM pg_stat_user_tables;",
    );
    const totalActual = results[0].total_cambios;

    let totalPrevio = 0;
    if (fs.existsSync(LAST_STATE_FILE)) {
      totalPrevio = JSON.parse(fs.readFileSync(LAST_STATE_FILE)).total;
    }

    if (totalActual > totalPrevio) {
      console.log("🔄 Cambios detectados. Iniciando volcado SQL...");
      fs.writeFileSync(LAST_STATE_FILE, JSON.stringify({ total: totalActual }));

      const fileName = `backup_${new Date().toISOString().split("T")[0]}.sql`;
      const outputPath = path.join(BACKUP_DIR, fileName);
      const dbUrl = process.env.DATABASE_URL;

      exec(`pg_dump "${dbUrl}" > "${outputPath}"`, (error) => {
        if (error)
          return console.error("❌ Fallo en el comando pg_dump:", error);
        console.log(`✅ Sistema: Backup guardado con éxito en ${fileName}`);
      });
    } else {
      console.log(
        "⏭️ Sin cambios detectados. Backup omitido para ahorrar recursos.",
      );
    }
  } catch (error) {
    console.error("❌ Error en el proceso de backup:", error);
  }
}

// 2. PROGRAMACIÓN: Configura el despertador para las 03:00 AM
cron.schedule("0 3 * * *", () => {
  console.log("⏰ Cron: Es la hora del backup programado.");
  ejecutarProcesoBackup();
});

// 3. LLAMADA INMEDIATA: Esto es lo que permite que funcione con 'npm run db:backup'
console.log("🚀 Script iniciado manualmente...");
ejecutarProcesoBackup();
