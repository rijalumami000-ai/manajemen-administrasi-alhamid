const db = require('./db');
const bcrypt = require('bcrypt');

async function main() {
  try {
    const passwordHash = await bcrypt.hash('rijal123', 10);
    
    // Set mymustahiq_username and mymustahiq_password for Ust. Rijal Umami (ID: 1)
    await db.query(`
      UPDATE guru
      SET mymustahiq_username = $1, mymustahiq_password = $2
      WHERE id = $3
    `, ['rijal', passwordHash, 1]);
    
    console.log("✅ Berhasil mendaftarkan akun local untuk Rijal!");
    console.log("   Username: rijal");
    console.log("   Password: rijal123");
  } catch (error) {
    console.error("Gagal mengupdate database:", error);
  } finally {
    process.exit(0);
  }
}

main();
