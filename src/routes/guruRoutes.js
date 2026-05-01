const db = require('../../db');
const { getActiveTahunAjaran, syncSantriToActiveTahunAjaran } = require('../services/tahunAjaranService');
const { isUniqueViolation } = require('../utils/databaseErrors');
const { normalizeKelasJenis, normalizeText, normalizeYearCode, nullableInt } = require('../utils/normalizers');

function registerGuruRoutes(app) {
  // ===== GURU API =====
  app.get('/api/guru', async (req, res) => {
    try {
      const result = await db.query(`
        SELECT
          g.id,
          g.nip,
          g.nama,
          g.mata_pelajaran_id,
          mp.nama AS mata_pelajaran,
          g.jabatan_id,
          j.nama AS jabatan,
          g.no_hp,
          g.alamat,
          g.status,
          g.created_at
        FROM guru g
        LEFT JOIN mata_pelajaran mp ON g.mata_pelajaran_id = mp.id
        LEFT JOIN jabatan j ON g.jabatan_id = j.id
        ORDER BY g.nama
      `);
      res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Gagal memuat data guru.' });
    }
  });
  
  app.post('/api/guru', async (req, res) => {
    const nip = normalizeText(req.body.nip);
    const nama = normalizeText(req.body.nama);
    const mata_pelajaran_id = req.body.mata_pelajaran_id ? Number(req.body.mata_pelajaran_id) : null;
    const jabatan_id = req.body.jabatan_id ? Number(req.body.jabatan_id) : null;
    const no_hp = normalizeText(req.body.no_hp);
    const alamat = normalizeText(req.body.alamat);
    const status = normalizeText(req.body.status);
  
    if (!nama || !mata_pelajaran_id || !jabatan_id || !no_hp || !alamat || !status) {
      return res.status(400).json({
        error: 'Nama, mata pelajaran, jabatan, no HP, alamat, dan status wajib diisi.',
      });
    }
  
    try {
      const result = await db.query(
        `INSERT INTO guru (nip, nama, mata_pelajaran_id, jabatan_id, alamat, no_hp, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [nip, nama, mata_pelajaran_id, jabatan_id, alamat, no_hp, status]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      if (isUniqueViolation(error)) {
        return res.status(400).json({
          error: nip ? 'NIP sudah terdaftar.' : 'Data guru sudah terdaftar.',
        });
      }
      if (error.code === '23503') {
        return res.status(400).json({
          error: 'Mata pelajaran atau jabatan yang dipilih tidak valid.',
        });
      }
      res.status(500).json({ error: 'Gagal menyimpan data guru.' });
    }
  });
  
  app.put('/api/guru/:id', async (req, res) => {
    const { id } = req.params;
    const nip = normalizeText(req.body.nip);
    const nama = normalizeText(req.body.nama);
    const mata_pelajaran_id = req.body.mata_pelajaran_id ? Number(req.body.mata_pelajaran_id) : null;
    const jabatan_id = req.body.jabatan_id ? Number(req.body.jabatan_id) : null;
    const no_hp = normalizeText(req.body.no_hp);
    const alamat = normalizeText(req.body.alamat);
    const status = normalizeText(req.body.status);
  
    if (!nama || !mata_pelajaran_id || !jabatan_id || !no_hp || !alamat || !status) {
      return res.status(400).json({
        error: 'Nama, mata pelajaran, jabatan, no HP, alamat, dan status wajib diisi.',
      });
    }
  
    try {
      const result = await db.query(
        `UPDATE guru
         SET nip = $1, nama = $2, mata_pelajaran_id = $3, jabatan_id = $4, alamat = $5, no_hp = $6, status = $7
         WHERE id = $8
         RETURNING *`,
        [nip, nama, mata_pelajaran_id, jabatan_id, alamat, no_hp, status, id]
      );
  
      if (!result.rows.length) {
        return res.status(404).json({ error: 'Data guru tidak ditemukan.' });
      }
  
      res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      if (isUniqueViolation(error)) {
        return res.status(400).json({
          error: nip ? 'NIP sudah terdaftar.' : 'Data guru sudah terdaftar.',
        });
      }
      if (error.code === '23503') {
        return res.status(400).json({
          error: 'Mata pelajaran atau jabatan yang dipilih tidak valid.',
        });
      }
      res.status(500).json({ error: 'Gagal memperbarui data guru.' });
    }
  });
  
  app.delete('/api/guru/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const result = await db.query('DELETE FROM guru WHERE id = $1 RETURNING id', [id]);
      if (!result.rows.length) {
        return res.status(404).json({ error: 'Data guru tidak ditemukan.' });
      }
      res.json({ message: 'Data guru berhasil dihapus.' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Gagal menghapus data guru.' });
    }
  });
}

module.exports = registerGuruRoutes;
