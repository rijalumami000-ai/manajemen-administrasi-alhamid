const db = require('../../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Konfigurasi storage multer untuk foto santri
const fotoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../public/uploads/foto-santri');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const santriId = req.params.id;
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `santri_${santriId}_${Date.now()}${ext}`;
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
  limits: { fileSize: 2 * 1024 * 1024 }, // max 2MB
});

// Konfigurasi storage untuk aset kartu ujian (ttd, stempel, logo)
const asetStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../public/uploads/kartu-ujian');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const key = req.params.key;
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${key}_${Date.now()}${ext}`;
    cb(null, filename);
  },
});

const uploadAset = multer({
  storage: asetStorage,
  fileFilter: fotoFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

function registerBukuIndukRoutes(app) {

  // === BUKU INDUK: GET semua santri dikelompokkan per tahun_masuk ===
  app.get('/api/buku-induk', async (req, res) => {
    try {
      const { tahun_masuk, search } = req.query;
      let whereClause = [];
      let params = [];

      if (tahun_masuk) {
        params.push(tahun_masuk);
        whereClause.push(`s.tahun_masuk = $${params.length}`);
      }
      if (search) {
        params.push(`%${search}%`);
        whereClause.push(`(s.nama ILIKE $${params.length} OR s.nis ILIKE $${params.length})`);
      }

      const where = whereClause.length ? `WHERE ${whereClause.join(' AND ')}` : '';

      const result = await db.query(`
        SELECT
          s.id, s.nis, s.nik, s.nama, s.jenis_kelamin,
          s.tempat_lahir, s.tanggal_lahir, s.alamat,
          s.tahun_masuk, s.foto_url, s.created_at,
          kd.nama AS kelas_diniyah,
          o.nama_ayah, o.nama_ibu, o.no_hp_ayah, o.no_hp_ibu,
          o.pekerjaan_ayah, o.pekerjaan_ibu
        FROM santri s
        LEFT JOIN kelas kd ON s.kelas_diniyah_id = kd.id
        LEFT JOIN orangtua o ON s.orangtua_id = o.id
        LEFT JOIN alumni al ON al.santri_id = s.id
        ${where}
        ORDER BY s.tahun_masuk NULLS LAST, s.nama ASC
      `, params);

      res.json(result.rows);
    } catch (err) {
      console.error('Error GET /api/buku-induk:', err);
      res.status(500).json({ error: 'Gagal memuat data buku induk.' });
    }
  });

  // === BUKU INDUK: GET daftar tahun_masuk yang tersedia ===
  app.get('/api/buku-induk/tahun-masuk', async (req, res) => {
    try {
      const result = await db.query(`
        SELECT DISTINCT tahun_masuk
        FROM santri
        WHERE tahun_masuk IS NOT NULL
        ORDER BY tahun_masuk ASC
      `);
      const years = result.rows.map(r => r.tahun_masuk);
      res.json(years);
    } catch (err) {
      console.error('Error GET /api/buku-induk/tahun-masuk:', err);
      res.status(500).json({ error: 'Gagal memuat daftar tahun masuk.' });
    }
  });

  // === BUKU INDUK: UPDATE tahun_masuk santri ===
  app.patch('/api/buku-induk/:id/tahun-masuk', async (req, res) => {
    const { id } = req.params;
    const { tahun_masuk } = req.body;
    try {
      const result = await db.query(
        `UPDATE santri SET tahun_masuk = $1 WHERE id = $2 RETURNING id, nis, nama, tahun_masuk`,
        [tahun_masuk || null, id]
      );
      if (!result.rows.length) return res.status(404).json({ error: 'Santri tidak ditemukan.' });
      res.json(result.rows[0]);
    } catch (err) {
      console.error('Error PATCH tahun-masuk:', err);
      res.status(500).json({ error: 'Gagal memperbarui tahun masuk.' });
    }
  });

  // === BUKU INDUK: UPLOAD FOTO santri ===
  app.post('/api/buku-induk/:id/foto', uploadFoto.single('foto'), async (req, res) => {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ error: 'File foto tidak ditemukan.' });

    const fotoUrl = `/uploads/foto-santri/${req.file.filename}`;
    try {
      // Hapus foto lama jika ada
      const old = await db.query('SELECT foto_url FROM santri WHERE id = $1', [id]);
      if (old.rows[0]?.foto_url) {
        const oldPath = path.join(__dirname, '../../public', old.rows[0].foto_url);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      const result = await db.query(
        `UPDATE santri SET foto_url = $1 WHERE id = $2 RETURNING id, nama, foto_url`,
        [fotoUrl, id]
      );
      if (!result.rows.length) return res.status(404).json({ error: 'Santri tidak ditemukan.' });
      res.json({ ...result.rows[0], foto_url: fotoUrl });
    } catch (err) {
      console.error('Error upload foto:', err);
      res.status(500).json({ error: 'Gagal menyimpan foto santri.' });
    }
  });

  // === BUKU INDUK: DELETE FOTO santri ===
  app.delete('/api/buku-induk/:id/foto', async (req, res) => {
    const { id } = req.params;
    try {
      const old = await db.query('SELECT foto_url FROM santri WHERE id = $1', [id]);
      if (old.rows[0]?.foto_url) {
        const oldPath = path.join(__dirname, '../../public', old.rows[0].foto_url);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      await db.query(`UPDATE santri SET foto_url = NULL WHERE id = $1`, [id]);
      res.json({ message: 'Foto berhasil dihapus.' });
    } catch (err) {
      console.error('Error delete foto:', err);
      res.status(500).json({ error: 'Gagal menghapus foto.' });
    }
  });

  // === KARTU UJIAN: Upload aset (logo, stempel, ttd) ===
  app.post('/api/kartu-ujian/upload-aset/:key', uploadAset.single('file'), async (req, res) => {
    const { key } = req.params;
    const allowedKeys = ['kartu_ujian_logo_url', 'kartu_ujian_stempel_url', 'kartu_ujian_ttd_url'];
    if (!allowedKeys.includes(key)) return res.status(400).json({ error: 'Key tidak valid.' });
    if (!req.file) return res.status(400).json({ error: 'File tidak ditemukan.' });

    const fileUrl = `/uploads/kartu-ujian/${req.file.filename}`;
    try {
      // Hapus file lama
      const old = await db.query('SELECT value FROM system_settings WHERE key = $1', [key]);
      if (old.rows[0]?.value) {
        const oldPath = path.join(__dirname, '../../public', old.rows[0].value);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      await db.query(
        `INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2`,
        [key, fileUrl]
      );
      res.json({ key, url: fileUrl });
    } catch (err) {
      console.error('Error upload aset:', err);
      res.status(500).json({ error: 'Gagal menyimpan aset.' });
    }
  });
}

module.exports = registerBukuIndukRoutes;
