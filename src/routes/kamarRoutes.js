const db = require('../../db');
const { getActiveTahunAjaran, syncSantriToActiveTahunAjaran } = require('../services/tahunAjaranService');
const { isUniqueViolation } = require('../utils/databaseErrors');
const { normalizeKelasJenis, normalizeText, normalizeYearCode, nullableInt } = require('../utils/normalizers');

function registerKamarRoutes(app) {
  // ===== KAMAR API =====
  app.get('/api/kamar', async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM kamar ORDER BY nama');
      res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Gagal memuat data kamar.' });
    }
  });
  
  app.post('/api/kamar', async (req, res) => {
    const nama = normalizeText(req.body.nama);
    const gedung = normalizeText(req.body.gedung);
    const lantai = req.body.lantai ? parseInt(req.body.lantai, 10) : null;
    const kapasitas = req.body.kapasitas ? parseInt(req.body.kapasitas, 10) : null;
    const terisi = req.body.terisi ? parseInt(req.body.terisi, 10) : 0;
    const jenis = normalizeText(req.body.jenis);
    const status = normalizeText(req.body.status) || 'Tersedia';
    const fasilitas = normalizeText(req.body.fasilitas);
    const keterangan = normalizeText(req.body.keterangan);
  
    if (!nama || !kapasitas || !jenis) {
      return res.status(400).json({ error: 'Nama kamar, kapasitas, dan jenis wajib diisi.' });
    }
  
    try {
      const result = await db.query(
        `INSERT INTO kamar (nama, gedung, lantai, kapasitas, terisi, jenis, status, fasilitas, keterangan)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [nama, gedung, lantai, kapasitas, terisi, jenis, status, fasilitas, keterangan]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      if (isUniqueViolation(error)) {
        return res.status(400).json({ error: 'Nama kamar sudah terdaftar.' });
      }
      res.status(500).json({ error: 'Gagal menyimpan data kamar.' });
    }
  });
  
  app.put('/api/kamar/:id', async (req, res) => {
    const { id } = req.params;
    const nama = normalizeText(req.body.nama);
    const gedung = normalizeText(req.body.gedung);
    const lantai = req.body.lantai ? parseInt(req.body.lantai, 10) : null;
    const kapasitas = req.body.kapasitas ? parseInt(req.body.kapasitas, 10) : null;
    const terisi = req.body.terisi ? parseInt(req.body.terisi, 10) : 0;
    const jenis = normalizeText(req.body.jenis);
    const status = normalizeText(req.body.status) || 'Tersedia';
    const fasilitas = normalizeText(req.body.fasilitas);
    const keterangan = normalizeText(req.body.keterangan);
  
    if (!nama || !kapasitas || !jenis) {
      return res.status(400).json({ error: 'Nama kamar, kapasitas, dan jenis wajib diisi.' });
    }
  
    try {
      const result = await db.query(
        `UPDATE kamar 
         SET nama = $1, gedung = $2, lantai = $3, kapasitas = $4, terisi = $5, 
             jenis = $6, status = $7, fasilitas = $8, keterangan = $9
         WHERE id = $10
         RETURNING *`,
        [nama, gedung, lantai, kapasitas, terisi, jenis, status, fasilitas, keterangan, id]
      );
  
      if (!result.rows.length) {
        return res.status(404).json({ error: 'Data kamar tidak ditemukan.' });
      }
  
      res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      if (isUniqueViolation(error)) {
        return res.status(400).json({ error: 'Nama kamar sudah terdaftar.' });
      }
      res.status(500).json({ error: 'Gagal memperbarui data kamar.' });
    }
  });
  
  app.delete('/api/kamar/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const result = await db.query('DELETE FROM kamar WHERE id = $1 RETURNING id', [id]);
      if (!result.rows.length) {
        return res.status(404).json({ error: 'Data kamar tidak ditemukan.' });
      }
      res.json({ message: 'Data kamar berhasil dihapus.' });
    } catch (error) {
      console.error(error);
      if (error.code === '23503') {
        return res.status(400).json({ error: 'Kamar tidak dapat dihapus karena sedang digunakan oleh santri.' });
      }
      res.status(500).json({ error: 'Gagal menghapus data kamar.' });
    }
  });
}

module.exports = registerKamarRoutes;
