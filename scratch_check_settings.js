const db = require('./db');

async function main() {
  console.log("=== DIAGNOSTIK SYSTEM SETTINGS ===");
  try {
    const tableCheck = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'system_settings'
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log("Tabel 'system_settings' tidak ditemukan!");
      return;
    }

    console.log("Tabel 'system_settings' ditemukan.");
    const result = await db.query(`SELECT id, nama FROM kelas ORDER BY nama`);
    console.log("Daftar Kelas:");
    console.log(result.rows);
  } catch (error) {
    console.error("Gagal query database:", error);
  } finally {
    process.exit(0);
  }
}

main();
