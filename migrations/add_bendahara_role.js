/**
 * Migration: Tambah role 'bendahara' ke tabel users
 * Diperlukan oleh modul sistem keuangan
 *
 * Pattern: mengikuti pola migration yang sudah ada di folder migrations/
 * Aman untuk dijalankan ulang (idempotent)
 */

const db = require('../db');

async function migrate() {
  console.log('🔄 Menjalankan migration: add_bendahara_role...');

  try {
    // Cek constraint yang ada saat ini
    const checkResult = await db.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'users'
        AND constraint_type = 'CHECK'
        AND constraint_name = 'users_role_check'
    `);

    if (checkResult.rows.length > 0) {
      // Drop constraint lama dan buat yang baru dengan 'bendahara'
      await db.query(`
        ALTER TABLE users
          DROP CONSTRAINT IF EXISTS users_role_check
      `);
      console.log('  ✓ Constraint lama users_role_check dihapus');
    }

    // Buat constraint baru yang menyertakan 'bendahara'
    await db.query(`
      ALTER TABLE users
        ADD CONSTRAINT users_role_check
        CHECK (role IN ('admin', 'guru', 'staff', 'bendahara'))
    `);
    console.log('  ✓ Constraint baru users_role_check ditambahkan (termasuk bendahara)');

    // Tambah kolom 'bendahara_level' untuk multi-bendahara (opsional, jika dibutuhkan nanti)
    // Level 1 = Bendahara Utama, Level 2 = Bendahara Pembantu
    await db.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS bendahara_level INTEGER DEFAULT NULL
    `);
    console.log('  ✓ Kolom bendahara_level ditambahkan ke tabel users');

    console.log('✅ Migration add_bendahara_role selesai!');
  } catch (err) {
    console.error('❌ Migration gagal:', err.message);
    throw err;
  }
}

migrate()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
