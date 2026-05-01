const db = require('../../db');
const { getActiveTahunAjaran, syncSantriToActiveTahunAjaran } = require('../services/tahunAjaranService');
const { isUniqueViolation } = require('../utils/databaseErrors');
const { normalizeKelasJenis, normalizeText, normalizeYearCode, nullableInt } = require('../utils/normalizers');

function registerOrangtuaRoutes(app) {
  // ===== ORANGTUA API =====
  app.post('/api/orangtua', async (req, res) => {
    const {
      nama_ayah,
      nama_ibu,
      pekerjaan_ayah,
      pekerjaan_ibu,
      no_hp_ayah,
      no_hp_ibu,
    } = req.body;
  
    try {
      const result = await db.query(
        `INSERT INTO orangtua (nama_ayah, nama_ibu, pekerjaan_ayah, pekerjaan_ibu, no_hp_ayah, no_hp_ibu)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [nama_ayah, nama_ibu, pekerjaan_ayah, pekerjaan_ibu, no_hp_ayah, no_hp_ibu]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Gagal menyimpan data orang tua.' });
    }
  });
}

module.exports = registerOrangtuaRoutes;
