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
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file PDF yang diizinkan.'), false);
    }
  },
  limits: { fileSize: 30 * 1024 * 1024 } // 30MB max
});

// Middleware with friendly error response
function uploadPdfMiddleware(req, res, next) {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Ukuran file PDF terlalu besar. Maksimal 30MB.' });
      }
      return res.status(400).json({ error: err.message || 'Gagal mengunggah file PDF.' });
    }
    next();
  });
}

function registerMateriSidangRoutes(app) {

  // GET all materi sidang (filterable by tahun_ajaran_id, tahun_masehi, and kategori)
  app.get('/api/materi-sidang', async (req, res) => {
    try {
      const { tahun_ajaran_id, tahun_masehi, kategori } = req.query;
      let query = `
        SELECT m.*, ta.kode AS tahun_ajaran_kode
        FROM materi_sidang m
        LEFT JOIN tahun_ajaran ta ON m.tahun_ajaran_id = ta.id
        WHERE 1=1
      `;
      const params = [];
      let paramIdx = 1;

      if (tahun_ajaran_id) {
        query += ` AND (m.tahun_ajaran_id = $${paramIdx++} OR m.tahun_masehi = (SELECT kode FROM tahun_ajaran WHERE id = $${paramIdx - 1}))`;
        params.push(parseInt(tahun_ajaran_id, 10));
      } else if (tahun_masehi) {
        query += ` AND m.tahun_masehi = $${paramIdx++}`;
        params.push(tahun_masehi);
      }
      if (kategori) {
        query += ` AND m.kategori = $${paramIdx++}`;
        params.push(kategori);
      }
      query += ' ORDER BY m.kategori ASC, m.tanggal DESC, m.id DESC';

      const result = await db.query(query, params);
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching materi sidang:', error);
      res.status(500).json({ error: 'Gagal memuat data materi sidang.' });
    }
  });

  // GET distinct tahun options
  app.get('/api/materi-sidang/tahun-options', async (req, res) => {
    try {
      const result = await db.query(
        `SELECT DISTINCT COALESCE(ta.kode, m.tahun_masehi) AS kode, m.tahun_ajaran_id 
         FROM materi_sidang m
         LEFT JOIN tahun_ajaran ta ON m.tahun_ajaran_id = ta.id
         WHERE COALESCE(ta.kode, m.tahun_masehi) IS NOT NULL
         ORDER BY kode DESC`
      );
      res.json(result.rows.map(r => r.kode));
    } catch (error) {
      console.error('Error fetching tahun options:', error);
      res.status(500).json({ error: 'Gagal memuat opsi tahun.' });
    }
  });

  // POST – create new materi sidang with optional PDF upload
  app.post('/api/materi-sidang', uploadPdfMiddleware, async (req, res) => {
    let { tahun_ajaran_id, tahun_masehi, kategori, judul, no_surat, tanggal, halaman, ukuran, status, pengesah, ringkasan } = req.body;

    if (!kategori || !judul) {
      return res.status(400).json({ error: 'Kategori dan judul wajib diisi.' });
    }

    if (tahun_ajaran_id) {
      tahun_ajaran_id = parseInt(tahun_ajaran_id, 10);
      if (!tahun_masehi) {
        const taRow = await db.query('SELECT kode FROM tahun_ajaran WHERE id = $1', [tahun_ajaran_id]);
        if (taRow.rows.length) tahun_masehi = taRow.rows[0].kode;
      }
    } else {
      const activeTa = await db.query('SELECT id, kode FROM tahun_ajaran WHERE is_active = true LIMIT 1');
      if (activeTa.rows.length) {
        tahun_ajaran_id = activeTa.rows[0].id;
        if (!tahun_masehi) tahun_masehi = activeTa.rows[0].kode;
      }
    }

    const file_url = req.file ? `/uploads/sidang/${req.file.filename}` : null;
    const finalUkuran = req.file 
      ? `${(req.file.size / (1024 * 1024)).toFixed(1)} MB` 
      : (ukuran || null);
    const validTanggal = (tanggal && typeof tanggal === 'string' && tanggal.trim().length > 0) ? tanggal.trim() : null;
    const validHalaman = (halaman ? parseInt(halaman, 10) : 0) || 0;

    try {
      const result = await db.query(
        `INSERT INTO materi_sidang (tahun_ajaran_id, tahun_masehi, kategori, judul, no_surat, tanggal, halaman, ukuran, status, pengesah, ringkasan, file_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
        [
          tahun_ajaran_id || null, 
          tahun_masehi || null, 
          kategori, 
          normalizeText(judul), 
          normalizeText(no_surat), 
          validTanggal, 
          validHalaman, 
          finalUkuran, 
          normalizeText(status), 
          normalizeText(pengesah), 
          normalizeText(ringkasan), 
          file_url
        ]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error adding materi sidang:', error);
      res.status(500).json({ error: 'Gagal menambahkan materi sidang: ' + (error.message || '') });
    }
  });

  // PUT – update materi sidang
  app.put('/api/materi-sidang/:id', uploadPdfMiddleware, async (req, res) => {
    const { id } = req.params;
    let { tahun_ajaran_id, tahun_masehi, kategori, judul, no_surat, tanggal, halaman, ukuran, status, pengesah, ringkasan } = req.body;

    if (tahun_ajaran_id) {
      tahun_ajaran_id = parseInt(tahun_ajaran_id, 10);
      if (!tahun_masehi) {
        const taRow = await db.query('SELECT kode FROM tahun_ajaran WHERE id = $1', [tahun_ajaran_id]);
        if (taRow.rows.length) tahun_masehi = taRow.rows[0].kode;
      }
    }

    try {
      // Get existing record to check if there's an old file
      const existing = await db.query('SELECT file_url, tahun_ajaran_id, tahun_masehi, ukuran FROM materi_sidang WHERE id = $1', [id]);
      if (!existing.rows.length) return res.status(404).json({ error: 'Data tidak ditemukan.' });

      let file_url = existing.rows[0].file_url;
      let finalUkuran = ukuran || existing.rows[0].ukuran;

      if (req.file) {
        // Delete old file if exists
        if (file_url) {
          const oldPath = path.join(__dirname, '..', '..', 'public', file_url);
          if (fs.existsSync(oldPath)) {
            try { fs.unlinkSync(oldPath); } catch (_) {}
          }
        }
        file_url = `/uploads/sidang/${req.file.filename}`;
        finalUkuran = `${(req.file.size / (1024 * 1024)).toFixed(1)} MB`;
      }

      const finalTaId = tahun_ajaran_id || existing.rows[0].tahun_ajaran_id;
      const finalTaMasehi = tahun_masehi || existing.rows[0].tahun_masehi;
      const validTanggal = (tanggal && typeof tanggal === 'string' && tanggal.trim().length > 0) ? tanggal.trim() : null;
      const validHalaman = (halaman ? parseInt(halaman, 10) : 0) || 0;

      const result = await db.query(
        `UPDATE materi_sidang 
         SET tahun_ajaran_id = $1, tahun_masehi = $2, kategori = $3, judul = $4, no_surat = $5, tanggal = $6, 
             halaman = $7, ukuran = $8, status = $9, pengesah = $10, ringkasan = $11, 
             file_url = $12, updated_at = NOW()
         WHERE id = $13 RETURNING *`,
        [
          finalTaId, 
          finalTaMasehi, 
          kategori, 
          normalizeText(judul), 
          normalizeText(no_surat), 
          validTanggal, 
          validHalaman, 
          finalUkuran, 
          normalizeText(status), 
          normalizeText(pengesah), 
          normalizeText(ringkasan), 
          file_url, 
          id
        ]
      );
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating materi sidang:', error);
      res.status(500).json({ error: 'Gagal memperbarui materi sidang: ' + (error.message || '') });
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
        if (fs.existsSync(filePath)) {
          try { fs.unlinkSync(filePath); } catch (_) {}
        }
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
