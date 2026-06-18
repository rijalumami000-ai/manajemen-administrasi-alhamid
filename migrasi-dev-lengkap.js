/**
 * ============================================================
 *  DEV MIGRATION RUNNER — Jalankan sekali di VPS untuk
 *  migrasi seluruh fitur Struktur Organisasi, Jadwal Harian,
 *  dan Foto Guru secara instan sekaligus.
 *
 *  Perintah:
 *    node migrasi-dev-lengkap.js
 * ============================================================
 */

require('dotenv').config();
const db = require('./db');
const fs = require('fs');
const path = require('path');

async function run() {
  console.log('🔄 Memulai migrasi database fitur dev (Struktur, Jadwal, & Foto)...');
  
  try {
    const sqlPath = path.join(__dirname, 'sql', 'migrasi_dev_lengkap.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await db.query(sql);
    console.log('✅ Migrasi database berhasil dan data awal ter-seed!');
  } catch (error) {
    console.error('❌ Gagal menjalankan migrasi database:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

run();
