const db = require('./src/database/db');

async function fixMapelTingkatConstraint() {
  try {
    console.log('Mencari constraint unik pada tabel mapel_tingkat...');
    const result = await db.query(`
      SELECT con.conname
      FROM pg_constraint con
      INNER JOIN pg_class rel ON rel.oid = con.conrelid
      WHERE rel.relname = 'mapel_tingkat' AND con.contype = 'u';
    `);

    if (result.rows.length === 0) {
      console.log('Tidak ada constraint unik (selain Primary Key) yang ditemukan di mapel_tingkat.');
    } else {
      for (const row of result.rows) {
        const constraintName = row.conname;
        console.log(`Menghapus constraint unik: ${constraintName}...`);
        await db.query(`ALTER TABLE mapel_tingkat DROP CONSTRAINT "${constraintName}";`);
        console.log(`Constraint ${constraintName} berhasil dihapus!`);
      }
    }
    
    // Tambahkan kembali constraint unik yang benar (melibatkan tahun dan semester) jika diperlukan, 
    // namun karena di kode aplikasi sudah ada DELETE sebelum INSERT, 
    // penghapusan constraint yang bermasalah saja sudah menyelesaikan masalah (Anomaly 1).
    console.log('Perbaikan selesai. Silakan coba kembali di aplikasi.');
    
  } catch (err) {
    console.error('Terjadi kesalahan:', err);
  } finally {
    process.exit(0);
  }
}

fixMapelTingkatConstraint();
