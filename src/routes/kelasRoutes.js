const db = require('../../db');
const { getActiveTahunAjaran, syncSantriToActiveTahunAjaran } = require('../services/tahunAjaranService');
const { isUniqueViolation } = require('../utils/databaseErrors');
const { normalizeKelasJenis, normalizeText, normalizeYearCode, nullableInt } = require('../utils/normalizers');

function registerKelasRoutes(app) {
  // ===== KELAS API =====
  app.get('/api/kelas', async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM kelas ORDER BY jenis, nama');
      res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Gagal memuat data kelas.' });
    }
  });
  
  app.post('/api/kelas', async (req, res) => {
    const jenis = normalizeKelasJenis(req.body.jenis);
    const nama = normalizeText(req.body.nama);
  
    if (!jenis || !nama) {
      return res.status(400).json({ error: 'Jenis kelas dan nama kelas wajib diisi.' });
    }
  
    try {
      const result = await db.query(
        'INSERT INTO kelas (jenis, nama) VALUES ($1, $2) RETURNING *',
        [jenis, nama]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      if (isUniqueViolation(error)) {
        return res.status(400).json({ error: `Kelas ${jenis} dengan nama tersebut sudah terdaftar.` });
      }
      res.status(500).json({ error: 'Gagal menyimpan data kelas.' });
    }
  });
  
  app.put('/api/kelas/:id', async (req, res) => {
    const { id } = req.params;
    const jenis = normalizeKelasJenis(req.body.jenis);
    const nama = normalizeText(req.body.nama);
  
    if (!jenis || !nama) {
      return res.status(400).json({ error: 'Jenis kelas dan nama kelas wajib diisi.' });
    }
  
    try {
      const result = await db.query(
        'UPDATE kelas SET jenis = $1, nama = $2 WHERE id = $3 RETURNING *',
        [jenis, nama, id]
      );
  
      if (!result.rows.length) {
        return res.status(404).json({ error: 'Data kelas tidak ditemukan.' });
      }
  
      res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      if (isUniqueViolation(error)) {
        return res.status(400).json({ error: `Kelas ${jenis} dengan nama tersebut sudah terdaftar.` });
      }
      res.status(500).json({ error: 'Gagal memperbarui data kelas.' });
    }
  });
  
  app.delete('/api/kelas/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const result = await db.query('DELETE FROM kelas WHERE id = $1 RETURNING id', [id]);
      if (!result.rows.length) {
        return res.status(404).json({ error: 'Data kelas tidak ditemukan.' });
      }
      res.json({ message: 'Data kelas berhasil dihapus.' });
    } catch (error) {
      console.error(error);
      if (error.code === '23503') {
        return res.status(400).json({ error: 'Kelas tidak dapat dihapus karena sedang digunakan oleh santri.' });
      }
      res.status(500).json({ error: 'Gagal menghapus data kelas.' });
    }
  });
}

module.exports = registerKelasRoutes;
