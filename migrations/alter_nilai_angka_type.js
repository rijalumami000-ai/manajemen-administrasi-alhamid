const db = require('../db');

async function up() {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    console.log('📝 [1/1] Mengubah tipe data nilai_angka pada tabel nilai_santri ke NUMERIC(6,2)...');
    await client.query(`ALTER TABLE nilai_santri ALTER COLUMN nilai_angka TYPE NUMERIC(6,2)`);
    console.log('✅ Tipe data nilai_angka berhasil diubah ke NUMERIC(6,2).');

    await client.query('COMMIT');
    console.log('🎉 Migrasi selesai!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migrasi gagal:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function down() {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    console.log('📝 Rollback: Mengubah kembali tipe data nilai_angka ke NUMERIC(5,2)...');
    await client.query(`ALTER TABLE nilai_santri ALTER COLUMN nilai_angka TYPE NUMERIC(5,2)`);
    console.log('✅ Tipe data nilai_angka berhasil di-rollback ke NUMERIC(5,2).');

    await client.query('COMMIT');
    console.log('✅ Rollback selesai.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Rollback gagal:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  const command = process.argv[2] || 'up';
  if (command === 'up') {
    up().then(() => process.exit(0)).catch(() => process.exit(1));
  } else if (command === 'down') {
    down().then(() => process.exit(0)).catch(() => process.exit(1));
  } else {
    console.log('Usage: node alter_nilai_angka_type.js [up|down]');
    process.exit(1);
  }
}

module.exports = { up, down };
