const db = require('../../db');
const { getActiveTahunAjaran, syncSantriToActiveTahunAjaran } = require('../services/tahunAjaranService');
const { isUniqueViolation } = require('../utils/databaseErrors');
const { normalizeKelasJenis, normalizeText, normalizeYearCode, nullableInt } = require('../utils/normalizers');

function registerMataPelajaranRoutes(app) {
  // ===== MATA PELAJARAN API =====
  app.get('/api/mata-pelajaran', async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM mata_pelajaran ORDER BY nama');
      res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Gagal memuat data mata pelajaran.' });
    }
  });
  
  app.post('/api/mata-pelajaran', async (req, res) => {
    const nama = normalizeText(req.body.nama);
  
    if (!nama) {
      return res.status(400).json({ error: 'Nama mata pelajaran wajib diisi.' });
    }
  
    try {
      const result = await db.query(
        'INSERT INTO mata_pelajaran (nama) VALUES ($1) RETURNING *',
        [nama]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      if (isUniqueViolation(error)) {
        return res.status(400).json({ error: 'Mata pelajaran sudah terdaftar.' });
      }
      res.status(500).json({ error: 'Gagal menyimpan data mata pelajaran.' });
    }
  });
  
  app.put('/api/mata-pelajaran/:id', async (req, res) => {
    const { id } = req.params;
    const nama = normalizeText(req.body.nama);
  
    if (!nama) {
      return res.status(400).json({ error: 'Nama mata pelajaran wajib diisi.' });
    }
  
    try {
      const result = await db.query(
        'UPDATE mata_pelajaran SET nama = $1 WHERE id = $2 RETURNING *',
        [nama, id]
      );
  
      if (!result.rows.length) {
        return res.status(404).json({ error: 'Data mata pelajaran tidak ditemukan.' });
      }
  
      res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      if (isUniqueViolation(error)) {
        return res.status(400).json({ error: 'Mata pelajaran sudah terdaftar.' });
      }
      res.status(500).json({ error: 'Gagal memperbarui data mata pelajaran.' });
    }
  });
  
  app.delete('/api/mata-pelajaran/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const result = await db.query('DELETE FROM mata_pelajaran WHERE id = $1 RETURNING id', [id]);
      if (!result.rows.length) {
        return res.status(404).json({ error: 'Data mata pelajaran tidak ditemukan.' });
      }
      res.json({ message: 'Data mata pelajaran berhasil dihapus.' });
    } catch (error) {
      console.error(error);
      if (error.code === '23503') {
        return res.status(400).json({ error: 'Mata pelajaran tidak dapat dihapus karena sedang digunakan oleh data guru.' });
      }
      res.status(500).json({ error: 'Gagal menghapus data mata pelajaran.' });
    }
  });
}

module.exports = registerMataPelajaranRoutes;
