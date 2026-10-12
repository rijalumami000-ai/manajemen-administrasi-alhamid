const db = require('../../db');
const { normalizeText } = require('../utils/normalizers');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for PDF uploads
const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads', 'sidang');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'sidang-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Hanya file PDF yang diizinkan.'), false);
    }
  },
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB max
});

function registerMateriSidangRoutes(app) {

  // GET all materi sidang (filterable by tahun_masehi and kategori)
  app.get('/api/materi-sidang', async (req, res) => {
    try {
      const { tahun_masehi, kategori } = req.query;
      let query = 'SELECT * FROM materi_sidang WHERE 1=1';
      const params = [];
      let paramIdx = 1;

      if (tahun_masehi) {
        query += ` AND tahun_masehi = $${paramIdx++}`;
        params.push(tahun_masehi);
      }
      if (kategori) {
        query += ` AND kategori = $${paramIdx++}`;
        params.push(kategori);
      }
      query += ' ORDER BY kategori ASC, tanggal DESC, id DESC';

      const result = await db.query(query, params);
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching materi sidang:', error);
      res.status(500).json({ error: 'Gagal memuat data materi sidang.' });
    }
  });

  // GET distinct tahun_masehi options
  app.get('/api/materi-sidang/tahun-options', async (req, res) => {
    try {
      const result = await db.query(
        `SELECT DISTINCT tahun_masehi FROM materi_sidang ORDER BY tahun_masehi DESC`
      );
      res.json(result.rows.map(r => r.tahun_masehi));
    } catch (error) {
      console.error('Error fetching tahun options:', error);
      res.status(500).json({ error: 'Gagal memuat opsi tahun.' });
    }
  });

  // POST – create new materi sidang with optional PDF upload
  app.post('/api/materi-sidang', upload.single('file'), async (req, res) => {
    const { tahun_masehi, kategori, judul, no_surat, tanggal, halaman, ukuran, status, pengesah, ringkasan } = req.body;

    if (!tahun_masehi || !kategori || !judul) {
      return res.status(400).json({ error: 'Tahun, kategori, dan judul wajib diisi.' });
    }

    const file_url = req.file ? `/uploads/sidang/${req.file.filename}` : null;

    try {
      const result = await db.query(
        `INSERT INTO materi_sidang (tahun_masehi, kategori, judul, no_surat, tanggal, halaman, ukuran, status, pengesah, ringkasan, file_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
        [tahun_masehi, kategori, normalizeText(judul), normalizeText(no_surat), tanggal || null, halaman || 0, ukuran, normalizeText(status), normalizeText(pengesah), normalizeText(ringkasan), file_url]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error adding materi sidang:', error);
      res.status(500).json({ error: 'Gagal menambahkan materi sidang.' });
    }
  });

  // PUT – update materi sidang
  app.put('/api/materi-sidang/:id', upload.single('file'), async (req, res) => {
    const { id } = req.params;
    const { tahun_masehi, kategori, judul, no_surat, tanggal, halaman, ukuran, status, pengesah, ringkasan } = req.body;

    try {
      // Get existing record to check if there's an old file
      const existing = await db.query('SELECT file_url FROM materi_sidang WHERE id = $1', [id]);
      if (!existing.rows.length) return res.status(404).json({ error: 'Data tidak ditemukan.' });

      let file_url = existing.rows[0].file_url;
      if (req.file) {
        // Delete old file if exists
        if (file_url) {
          const oldPath = path.join(__dirname, '..', '..', 'public', file_url);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
        file_url = `/uploads/sidang/${req.file.filename}`;
      }

      const result = await db.query(
        `UPDATE materi_sidang 
         SET tahun_masehi = $1, kategori = $2, judul = $3, no_surat = $4, tanggal = $5, 
             halaman = $6, ukuran = $7, status = $8, pengesah = $9, ringkasan = $10, 
             file_url = $11, updated_at = NOW()
         WHERE id = $12 RETURNING *`,
        [tahun_masehi, kategori, normalizeText(judul), normalizeText(no_surat), tanggal || null, halaman || 0, ukuran, normalizeText(status), normalizeText(pengesah), normalizeText(ringkasan), file_url, id]
      );
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating materi sidang:', error);
      res.status(500).json({ error: 'Gagal memperbarui materi sidang.' });
    }
  });

  // DELETE
  app.delete('/api/materi-sidang/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const existing = await db.query('SELECT file_url FROM materi_sidang WHERE id = $1', [id]);
      if (!existing.rows.length) return res.status(404).json({ error: 'Data tidak ditemukan.' });

      // Delete file if exists
      if (existing.rows[0].file_url) {
        const filePath = path.join(__dirname, '..', '..', 'public', existing.rows[0].file_url);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }

      await db.query('DELETE FROM materi_sidang WHERE id = $1', [id]);
      res.json({ message: 'Materi sidang berhasil dihapus.' });
    } catch (error) {
      console.error('Error deleting materi sidang:', error);
      res.status(500).json({ error: 'Gagal menghapus materi sidang.' });
    }
  });
}

module.exports = registerMateriSidangRoutes;
