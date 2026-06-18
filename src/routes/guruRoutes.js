const db = require('../../db');
const { getActiveTahunAjaran, syncSantriToActiveTahunAjaran } = require('../services/tahunAjaranService');
const { isUniqueViolation } = require('../utils/databaseErrors');
const { normalizeKelasJenis, normalizeText, normalizeYearCode, nullableInt } = require('../utils/normalizers');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ttdStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../public/uploads/ttd-guru');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const guruId = req.params.id;
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `guru_${guruId}_${Date.now()}${ext}`;
    cb(null, filename);
  },
});

const ttdFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Format file tidak didukung. Gunakan JPG, PNG, atau WEBP.'));
  }
};

const uploadTtd = multer({
  storage: ttdStorage,
  fileFilter: ttdFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // max 2MB
});

// ===== GURU PHOTO STORAGE CONFIG =====
const fotoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../public/uploads/foto-guru');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const guruId = req.params.id;
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `guru_foto_${guruId}_${Date.now()}${ext}`;
    cb(null, filename);
  },
});

const fotoFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Format file tidak didukung. Gunakan JPG, PNG, atau WEBP.'));
  }
};

const uploadFoto = multer({
  storage: fotoStorage,
  fileFilter: fotoFilter,
  limits: { fileSize: 4 * 1024 * 1024 }, // max 4MB
});

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
          g.ttd_url,
          g.foto_url,
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

  // ===== GURU TTD UPLOAD =====
  app.post('/api/guru/:id/ttd', uploadTtd.single('ttd'), async (req, res) => {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ error: 'File tanda tangan tidak ditemukan.' });

    const ttdUrl = `/uploads/ttd-guru/${req.file.filename}`;
    try {
      // Hapus ttd lama jika ada
      const old = await db.query('SELECT ttd_url FROM guru WHERE id = $1', [id]);
      if (old.rows[0]?.ttd_url) {
        const oldPath = path.join(__dirname, '../../public', old.rows[0].ttd_url);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      const result = await db.query(
        `UPDATE guru SET ttd_url = $1 WHERE id = $2 RETURNING id, nama, ttd_url`,
        [ttdUrl, id]
      );
      
      if (!result.rows.length) return res.status(404).json({ error: 'Data guru tidak ditemukan.' });
      res.json({ ...result.rows[0], ttd_url: ttdUrl });
    } catch (err) {
      console.error('Error upload ttd guru:', err);
      res.status(500).json({ error: 'Gagal menyimpan tanda tangan guru.' });
    }
  });

  app.delete('/api/guru/:id/ttd', async (req, res) => {
    const { id } = req.params;
    try {
      const old = await db.query('SELECT ttd_url FROM guru WHERE id = $1', [id]);
      if (old.rows[0]?.ttd_url) {
        const oldPath = path.join(__dirname, '../../public', old.rows[0].ttd_url);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      await db.query(`UPDATE guru SET ttd_url = NULL WHERE id = $1`, [id]);
      res.json({ message: 'Tanda tangan berhasil dihapus.' });
    } catch (err) {
      console.error('Error delete ttd guru:', err);
      res.status(500).json({ error: 'Gagal menghapus tanda tangan guru.' });
    }
  });

  // ===== GURU PHOTO UPLOAD =====
  app.post('/api/guru/:id/foto', uploadFoto.single('foto'), async (req, res) => {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ error: 'File foto tidak ditemukan.' });

    const fotoUrl = `/uploads/foto-guru/${req.file.filename}`;
    try {
      // Hapus foto lama jika ada
      const old = await db.query('SELECT foto_url FROM guru WHERE id = $1', [id]);
      if (old.rows[0]?.foto_url) {
        const oldPath = path.join(__dirname, '../../public', old.rows[0].foto_url);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      const result = await db.query(
        `UPDATE guru SET foto_url = $1 WHERE id = $2 RETURNING id, nama, foto_url`,
        [fotoUrl, id]
      );
      
      if (!result.rows.length) return res.status(404).json({ error: 'Data guru tidak ditemukan.' });
      res.json({ ...result.rows[0], foto_url: fotoUrl });
    } catch (err) {
      console.error('Error upload foto guru:', err);
      res.status(500).json({ error: 'Gagal menyimpan foto guru.' });
    }
  });

  app.delete('/api/guru/:id/foto', async (req, res) => {
    const { id } = req.params;
    try {
      const old = await db.query('SELECT foto_url FROM guru WHERE id = $1', [id]);
      if (old.rows[0]?.foto_url) {
        const oldPath = path.join(__dirname, '../../public', old.rows[0].foto_url);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      await db.query(`UPDATE guru SET foto_url = NULL WHERE id = $1`, [id]);
      res.json({ message: 'Foto guru berhasil dihapus.' });
    } catch (err) {
      console.error('Error delete foto guru:', err);
      res.status(500).json({ error: 'Gagal menghapus foto guru.' });
    }
  });
}

module.exports = registerGuruRoutes;
