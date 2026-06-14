const db = require('./db');

async function run() {
  try {
    console.log('🚀 Starting kelas_tahun_ajaran migration...');
    
    // 1. Create table
    await db.query(`
      CREATE TABLE IF NOT EXISTS kelas_tahun_ajaran (
        id SERIAL PRIMARY KEY,
        kelas_id INTEGER NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
        tahun_ajaran_id INTEGER NOT NULL REFERENCES tahun_ajaran(id) ON DELETE CASCADE,
        mustahiq_id INTEGER REFERENCES guru(id) ON DELETE SET NULL,
        muhafadzoh_mapel_id INTEGER REFERENCES mata_pelajaran(id) ON DELETE SET NULL,
        qiroatul_mapel_id INTEGER REFERENCES mata_pelajaran(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (kelas_id, tahun_ajaran_id)
      );
    `);
    console.log('✅ Created kelas_tahun_ajaran table (if not existed)');

    // 2. Migrate existing data for active academic year
    const activeYearRes = await db.query('SELECT id, kode FROM tahun_ajaran WHERE is_active = TRUE');
    if (activeYearRes.rows.length === 0) {
      console.log('⚠️ No active academic year found. Skipping data copy.');
      return;
    }
    const activeYear = activeYearRes.rows[0];
    console.log(`ℹ️ Active academic year found: ${activeYear.kode} (ID: ${activeYear.id})`);

    const copyResult = await db.query(`
      INSERT INTO kelas_tahun_ajaran (kelas_id, tahun_ajaran_id, mustahiq_id, muhafadzoh_mapel_id, qiroatul_mapel_id)
      SELECT k.id, $1, k.mustahiq_id, k.muhafadzoh_mapel_id, k.qiroatul_mapel_id
      FROM kelas k
      WHERE (k.mustahiq_id IS NOT NULL OR k.muhafadzoh_mapel_id IS NOT NULL OR k.qiroatul_mapel_id IS NOT NULL)
      ON CONFLICT (kelas_id, tahun_ajaran_id) DO NOTHING
      RETURNING id;
    `, [activeYear.id]);

    console.log(`✅ Copied ${copyResult.rows.length} class settings to kelas_tahun_ajaran for active year`);
    console.log('🎉 Migration successful!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await db.pool.end();
  }
}

run();
