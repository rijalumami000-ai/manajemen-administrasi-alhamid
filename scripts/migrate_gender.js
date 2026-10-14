const db = require('../db');

async function run() {
  console.log('--- STARTING GENDER MIGRATION ---');

  // 1. Update santri table
  const r1 = await db.query(`
    UPDATE santri 
    SET jenis_kelamin = 'L' 
    WHERE jenis_kelamin IN ('Laki-laki', 'Putra', 'laki-laki', 'putra', 'L');
  `);
  console.log('Santri L updated:', r1.rowCount);

  const r2 = await db.query(`
    UPDATE santri 
    SET jenis_kelamin = 'P' 
    WHERE jenis_kelamin IN ('Perempuan', 'Putri', 'perempuan', 'putri', 'P');
  `);
  console.log('Santri P updated:', r2.rowCount);

  // Specific missing students
  const r3 = await db.query(`UPDATE santri SET jenis_kelamin = 'L' WHERE id = 617`);
  console.log('Santri id 617 (Idris - 2B Putra) set to L:', r3.rowCount);

  const r4 = await db.query(`UPDATE santri SET jenis_kelamin = 'P' WHERE id = 618`);
  console.log('Santri id 618 (Novanka - 2D Putri) set to P:', r4.rowCount);

  // 2. Update santri_tahun_ajaran table
  const r5 = await db.query(`
    UPDATE santri_tahun_ajaran 
    SET jenis_kelamin = 'L' 
    WHERE jenis_kelamin IN ('Laki-laki', 'Putra', 'laki-laki', 'putra');
  `);
  console.log('Santri tahun ajaran L updated:', r5.rowCount);

  const r6 = await db.query(`
    UPDATE santri_tahun_ajaran 
    SET jenis_kelamin = 'P' 
    WHERE jenis_kelamin IN ('Perempuan', 'Putri', 'perempuan', 'putri');
  `);
  console.log('Santri tahun ajaran P updated:', r6.rowCount);

  // Sync any remaining nulls or mismatches from santri
  const r7 = await db.query(`
    UPDATE santri_tahun_ajaran sta
    SET jenis_kelamin = s.jenis_kelamin
    FROM santri s
    WHERE sta.santri_id = s.id
      AND (sta.jenis_kelamin IS NULL OR sta.jenis_kelamin = '' OR sta.jenis_kelamin NOT IN ('L', 'P'));
  `);
  console.log('Santri tahun ajaran synced from santri table:', r7.rowCount);

  // Verification checks
  const checkSantri = await db.query(`
    SELECT jenis_kelamin, COUNT(*) 
    FROM santri 
    GROUP BY jenis_kelamin;
  `);
  console.log('\n--- VERIFICATION: SANTRI TABLE ---');
  console.table(checkSantri.rows);

  const checkSta = await db.query(`
    SELECT jenis_kelamin, COUNT(*) 
    FROM santri_tahun_ajaran 
    GROUP BY jenis_kelamin;
  `);
  console.log('\n--- VERIFICATION: SANTRI_TAHUN_AJARAN TABLE ---');
  console.table(checkSta.rows);

  console.log('\n--- GENDER MIGRATION FINISHED SUCCESSFULLY ---');
  process.exit(0);
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
