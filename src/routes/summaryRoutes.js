const db = require('../../db');
const { getActiveTahunAjaran, syncSantriToActiveTahunAjaran } = require('../services/tahunAjaranService');
const { isUniqueViolation } = require('../utils/databaseErrors');
const { normalizeKelasJenis, normalizeText, normalizeYearCode, nullableInt } = require('../utils/normalizers');
const { cacheMiddleware, cacheKeyGenerators } = require('../middleware/cacheMiddleware');

function registerSummaryRoutes(app) {
  // Cache summary for 5 minutes
  app.get('/api/summary',
    cacheMiddleware(300, cacheKeyGenerators.summary),
    async (req, res) => {
      try {
        const santriCount = await db.query(`
          SELECT COUNT(*)
          FROM santri_tahun_ajaran sta
          JOIN tahun_ajaran ta ON sta.tahun_ajaran_id = ta.id
          WHERE ta.is_active = TRUE
            AND sta.status IN ('aktif', 'draft', 'tidak_naik')
            AND NOT EXISTS (
              SELECT 1 FROM alumni a WHERE a.santri_id = sta.santri_id
            )
        `);
        const guruCount = await db.query('SELECT COUNT(*) FROM guru');
        const alumniCount = await db.query('SELECT COUNT(*) FROM alumni');
        const kelasCount = await db.query('SELECT COUNT(*) FROM kelas');
        
        res.json({
          santri: parseInt(santriCount.rows[0].count, 10),
          guru: parseInt(guruCount.rows[0].count, 10),
          alumni: parseInt(alumniCount.rows[0].count, 10),
          kelas: parseInt(kelasCount.rows[0].count, 10),
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Gagal mengambil ringkasan data.' });
      }
    }
  );
}

module.exports = registerSummaryRoutes;
