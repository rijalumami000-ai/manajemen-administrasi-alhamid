const db = require('../db');

async function run() {
  try {
    console.log('Altering setting_kriteria_nilai...');
    await db.query(`
      ALTER TABLE setting_kriteria_nilai 
      ADD COLUMN IF NOT EXISTS kategori_evaluasi_id INTEGER,
      ADD COLUMN IF NOT EXISTS tahun_ajaran_id INTEGER;
    `);
    
    console.log('Altering mapel_tingkat...');
    await db.query(`
      ALTER TABLE mapel_tingkat 
      ADD COLUMN IF NOT EXISTS kategori_evaluasi_id INTEGER,
      ADD COLUMN IF NOT EXISTS tahun_ajaran_id INTEGER;
    `);
    
    console.log('Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

run();
