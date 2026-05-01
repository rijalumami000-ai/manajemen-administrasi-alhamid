const db = require('../../db');
const { getActiveTahunAjaran, syncSantriToActiveTahunAjaran } = require('../services/tahunAjaranService');
const { isUniqueViolation } = require('../utils/databaseErrors');
const { normalizeKelasJenis, normalizeText, normalizeYearCode, nullableInt } = require('../utils/normalizers');

function registerPelanggaranRoutes(app) {
  // ===== PELANGGARAN API =====
  app.get('/api/pelanggaran', async (req, res) => {
    try {
      const result = await db.query(`
        SELECT p.*, s.nis, s.nama AS nama_santri
        FROM pelanggaran p
        LEFT JOIN santri s ON p.santri_id = s.id
        ORDER BY p.tanggal DESC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Gagal memuat data pelanggaran.' });
    }
  });
  
  app.post('/api/pelanggaran', async (req, res) => {
    const santri_id = req.body.santri_id ? parseInt(req.body.santri_id, 10) : null;
    const jenis = normalizeText(req.body.jenis);
    const tanggal = req.body.tanggal || null;
    const deskripsi = normalizeText(req.body.deskripsi);
    const sanksi = normalizeText(req.body.sanksi);
  
    if (!santri_id || !jenis || !tanggal) {
      return res.status(400).json({ error: 'Santri, jenis, dan tanggal wajib diisi.' });
    }
  
    try {
      const result = await db.query(
        `INSERT INTO pelanggaran (santri_id, jenis, tanggal, deskripsi, sanksi)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [santri_id, jenis, tanggal, deskripsi, sanksi]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      if (error.code === '23503') {
        return res.status(400).json({ error: 'Santri yang dipilih tidak valid.' });
      }
      res.status(500).json({ error: 'Gagal menyimpan data pelanggaran.' });
    }
  });
  
  app.put('/api/pelanggaran/:id', async (req, res) => {
    const { id } = req.params;
    const santri_id = req.body.santri_id ? parseInt(req.body.santri_id, 10) : null;
    const jenis = normalizeText(req.body.jenis);
    const tanggal = req.body.tanggal || null;
    const deskripsi = normalizeText(req.body.deskripsi);
    const sanksi = normalizeText(req.body.sanksi);
  
    if (!santri_id || !jenis || !tanggal) {
      return res.status(400).json({ error: 'Santri, jenis, dan tanggal wajib diisi.' });
    }
  
    try {
      const result = await db.query(
        `UPDATE pelanggaran 
         SET santri_id = $1, jenis = $2, tanggal = $3, deskripsi = $4, sanksi = $5
         WHERE id = $6
         RETURNING *`,
        [santri_id, jenis, tanggal, deskripsi, sanksi, id]
      );
  
      if (!result.rows.length) {
        return res.status(404).json({ error: 'Data pelanggaran tidak ditemukan.' });
      }
  
      res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      if (error.code === '23503') {
        return res.status(400).json({ error: 'Santri yang dipilih tidak valid.' });
      }
      res.status(500).json({ error: 'Gagal memperbarui data pelanggaran.' });
    }
  });
  
  app.delete('/api/pelanggaran/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const result = await db.query('DELETE FROM pelanggaran WHERE id = $1 RETURNING id', [id]);
      if (!result.rows.length) {
        return res.status(404).json({ error: 'Data pelanggaran tidak ditemukan.' });
      }
      res.json({ message: 'Data pelanggaran berhasil dihapus.' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Gagal menghapus data pelanggaran.' });
    }
  });
}

module.exports = registerPelanggaranRoutes;
