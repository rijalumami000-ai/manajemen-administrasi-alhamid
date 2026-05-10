const db = require('../db');

async function run() {
  try {
    console.log('Dropping old constraint...');
    await db.query('ALTER TABLE mapel_tingkat DROP CONSTRAINT IF EXISTS mapel_tingkat_tingkat_mata_pelajaran_id_key');
    
    console.log('Adding new constraint including year and semester...');
    await db.query(`
      ALTER TABLE mapel_tingkat 
      ADD CONSTRAINT mapel_tingkat_tingkat_mapel_ta_kat_key 
      UNIQUE (tingkat, mata_pelajaran_id, tahun_ajaran_id, kategori_evaluasi_id)
    `);
    
    console.log('Constraint updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to update constraint:', error);
    process.exit(1);
  }
}

run();
