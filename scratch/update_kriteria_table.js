const db = require('../db');

async function updateTable() {
  try {
    console.log('Updating setting_kriteria_nilai table...');
    
    // Drop unique constraint if exists
    await db.query(`
      ALTER TABLE setting_kriteria_nilai 
      DROP CONSTRAINT IF EXISTS setting_kriteria_nilai_kelas_id_mata_pelajaran_id_key
    `);

    // Add new columns
    await db.query(`
      ALTER TABLE setting_kriteria_nilai 
      ADD COLUMN IF NOT EXISTS tingkat INTEGER,
      ADD COLUMN IF NOT EXISTS jenis_mapel VARCHAR(50)
    `);

    // Allow NULLs
    await db.query(`
      ALTER TABLE setting_kriteria_nilai 
      ALTER COLUMN kelas_id DROP NOT NULL,
      ALTER COLUMN mata_pelajaran_id DROP NOT NULL
    `);

    console.log('Table updated successfully.');
  } catch (err) {
    console.error('Error updating table:', err);
  } finally {
    process.exit();
  }
}

updateTable();
