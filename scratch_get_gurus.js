const db = require('./db');

async function main() {
  try {
    const result = await db.query(`
      SELECT id, nip, nama, mymustahiq_username, mymustahiq_password
      FROM guru
      ORDER BY nama
    `);
    console.log("=== GURU / USTADZ DI DATABASE LOCAL ===");
    result.rows.forEach(row => {
      console.log(`- ID: ${row.id} | Nama: ${row.nama} | Username: ${row.mymustahiq_username} | NIP: ${row.nip} | HasPassword: ${!!row.mymustahiq_password}`);
    });
  } catch (error) {
    console.error("Gagal query database:", error);
  } finally {
    process.exit(0);
  }
}

main();
