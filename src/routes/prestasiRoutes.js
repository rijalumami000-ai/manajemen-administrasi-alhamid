const db = require('../../db');
const { getActiveTahunAjaran, syncSantriToActiveTahunAjaran } = require('../services/tahunAjaranService');
const { isUniqueViolation } = require('../utils/databaseErrors');
const { normalizeKelasJenis, normalizeText, normalizeYearCode, nullableInt } = require('../utils/normalizers');

function registerPrestasiRoutes(app) {
  // ===== PRESTASI API =====
  app.get('/api/prestasi', async (req, res) => {
    try {
      const result = await db.query(`
        SELECT p.*, s.nis, s.nama AS nama_santri
        FROM prestasi p
        LEFT JOIN santri s ON p.santri_id = s.id
        ORDER BY p.tanggal DESC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Gagal memuat data prestasi.' });
    }
  });
  
  app.post('/api/prestasi', async (req, res) => {
    const santri_id = req.body.santri_id ? parseInt(req.body.santri_id, 10) : null;
    const jenis = normalizeText(req.body.jenis);
    const tanggal = req.body.tanggal || null;
    const deskripsi = normalizeText(req.body.deskripsi);
    const penghargaan = normalizeText(req.body.penghargaan);
  
    if (!santri_id || !jenis || !tanggal) {
      return res.status(400).json({ error: 'Santri, jenis, dan tanggal wajib diisi.' });
    }
  
    try {
      const result = await db.query(
        `INSERT INTO prestasi (santri_id, jenis, tanggal, deskripsi, penghargaan)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [santri_id, jenis, tanggal, deskripsi, penghargaan]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      if (error.code === '23503') {
        return res.status(400).json({ error: 'Santri yang dipilih tidak valid.' });
      }
      res.status(500).json({ error: 'Gagal menyimpan data prestasi.' });
    }
  });
  
  app.put('/api/prestasi/:id', async (req, res) => {
    const { id } = req.params;
    const santri_id = req.body.santri_id ? parseInt(req.body.santri_id, 10) : null;
    const jenis = normalizeText(req.body.jenis);
    const tanggal = req.body.tanggal || null;
    const deskripsi = normalizeText(req.body.deskripsi);
    const penghargaan = normalizeText(req.body.penghargaan);
  
    if (!santri_id || !jenis || !tanggal) {
      return res.status(400).json({ error: 'Santri, jenis, dan tanggal wajib diisi.' });
    }
  
    try {
      const result = await db.query(
        `UPDATE prestasi 
         SET santri_id = $1, jenis = $2, tanggal = $3, deskripsi = $4, penghargaan = $5
         WHERE id = $6
         RETURNING *`,
        [santri_id, jenis, tanggal, deskripsi, penghargaan, id]
      );
  
      if (!result.rows.length) {
        return res.status(404).json({ error: 'Data prestasi tidak ditemukan.' });
      }
  
      res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      if (error.code === '23503') {
        return res.status(400).json({ error: 'Santri yang dipilih tidak valid.' });
      }
      res.status(500).json({ error: 'Gagal memperbarui data prestasi.' });
    }
  });
  
  app.delete('/api/prestasi/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const result = await db.query('DELETE FROM prestasi WHERE id = $1 RETURNING id', [id]);
      if (!result.rows.length) {
        return res.status(404).json({ error: 'Data prestasi tidak ditemukan.' });
      }
      res.json({ message: 'Data prestasi berhasil dihapus.' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Gagal menghapus data prestasi.' });
    }
  });
}

module.exports = registerPrestasiRoutes;
