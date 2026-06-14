/**
 * ============================================================
 *  MASTER MIGRATION RUNNER — jalankan sekali di VPS sebelum
 *  menyalakan production server untuk pertama kali.
 *
 *  Perintah:
 *    node migrate-all.js
 *
 *  Aman dijalankan berulang (idempotent — semua pakai IF NOT EXISTS).
 * ============================================================
 */

require('dotenv').config();
const db = require('./db');

const migrations = [
  { name: 'add_face_recognition_tables',         fn: require('./migrations/add_face_recognition_tables') },
  { name: 'add_biometric_fields_to_santri',      fn: require('./migrations/add_biometric_fields_to_santri') },
  { name: 'add_semester_status_to_santri',       fn: require('./migrations/add_semester_status_to_santri') },
  { name: 'add_tahun_ajaran_semester_to_absensi',fn: require('./migrations/add_tahun_ajaran_semester_to_absensi') },
  { name: 'add_tingkat_to_kelas',                fn: require('./migrations/add_tingkat_to_kelas') },
  { name: 'add_type_and_year_to_alumni',         fn: require('./migrations/add_type_and_year_to_alumni') },
  { name: 'add_buku_induk_kartu_ujian',          fn: require('./migrations/add_buku_induk_kartu_ujian') },
  { name: 'alter_nilai_angka_type',              fn: require('./migrations/alter_nilai_angka_type') },
];

async function runAll() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║       MASTER MIGRATION RUNNER            ║');
  console.log('╚══════════════════════════════════════════╝\n');

  let passed = 0;
  let failed = 0;
  const errors = [];

  for (const migration of migrations) {
    console.log(`\n▶  Running: ${migration.name}`);
    console.log('   ' + '─'.repeat(50));
    try {
      await migration.fn.up();
      console.log(`   ✅  ${migration.name} — DONE`);
      passed++;
    } catch (err) {
      console.error(`   ❌  ${migration.name} — FAILED`);
      console.error(`   Error: ${err.message}`);
      errors.push({ name: migration.name, error: err.message });
      failed++;
      // Continue dengan migration berikutnya (tidak stop)
    }
  }

  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║             MIGRATION SUMMARY            ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`  ✅ Passed : ${passed}`);
  console.log(`  ❌ Failed : ${failed}`);

  if (errors.length > 0) {
    console.log('\n⚠️  Failed migrations:');
    errors.forEach(e => {
      console.log(`  - ${e.name}: ${e.error}`);
    });
    console.log('\nPeriksa error di atas sebelum menjalankan production server.');
    process.exit(1);
  } else {
    console.log('\n🎉  Semua migration berhasil! Server siap dijalankan.\n');
    process.exit(0);
  }
}

runAll().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
