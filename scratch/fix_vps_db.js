const db = require('../db');

async function fix() {
  try {
    await db.query("ALTER TABLE setting_kriteria_nilai ADD COLUMN IF NOT EXISTS tahun_ajaran_id INTEGER");
    await db.query("ALTER TABLE setting_kriteria_nilai ADD COLUMN IF NOT EXISTS kategori_evaluasi_id INTEGER");
    
    await db.query("ALTER TABLE mapel_tingkat ADD COLUMN IF NOT EXISTS tahun_ajaran_id INTEGER");
    await db.query("ALTER TABLE mapel_tingkat ADD COLUMN IF NOT EXISTS kategori_evaluasi_id INTEGER");
    
    await db.query("ALTER TABLE nilai_santri ADD COLUMN IF NOT EXISTS kategori_evaluasi_id INTEGER");
    
    console.log('✓ Database on VPS updated successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Failed to update database:', err);
    process.exit(1);
  }
}

fix();
