const db = require('../../db');

function registerLembarUjianRoutes(app) {
  // ===== LEMBAR UJIAN API =====
  
  // Get all lembar ujian with optional filters
  app.get('/api/lembar-ujian', async (req, res) => {
    try {
      const { tahun_ajaran_id, semester, tingkat, is_her } = req.query;
      let query = 'SELECT * FROM lembar_ujian WHERE 1=1';
      const params = [];
      let paramCount = 1;

      if (tahun_ajaran_id) {
        query += ` AND tahun_ajaran_id = $${paramCount++}`;
        params.push(tahun_ajaran_id);
      }
      if (semester) {
        query += ` AND semester = $${paramCount++}`;
        params.push(semester);
      }
      if (tingkat) {
        query += ` AND tingkat = $${paramCount++}`;
        params.push(tingkat);
      }
      if (is_her !== undefined) {
        query += ` AND is_her = $${paramCount++}`;
        params.push(is_her === 'true');
      }

      query += ' ORDER BY created_at DESC';

      const result = await db.query(query, params);
      res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Gagal memuat data lembar ujian.' });
    }
  });

  // Get specific lembar ujian
  app.get('/api/lembar-ujian/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const result = await db.query('SELECT * FROM lembar_ujian WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Lembar ujian tidak ditemukan.' });
      }
      res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Gagal memuat data lembar ujian.' });
    }
  });

  // Save or Update lembar ujian
  app.post('/api/lembar-ujian', async (req, res) => {
    const {
      tahun_ajaran_id,
      semester,
      tingkat,
      pelajaran,
      judul,
      sub_judul,
      alamat,
      hari_tanggal,
      instruksi,
      soal,
      is_her
    } = req.body;

    if (!tahun_ajaran_id || !semester || !tingkat || !pelajaran || !soal) {
      return res.status(400).json({ error: 'Data wajib diisi (Tahun Ajaran, Semester, Tingkat, Pelajaran, Soal).' });
    }

    const isHerValue = is_her === true || is_her === 'true';

    try {
      // Check if already exists for this combo to update or insert
      const existing = await db.query(
        'SELECT id FROM lembar_ujian WHERE tahun_ajaran_id = $1 AND semester = $2 AND tingkat = $3 AND pelajaran = $4 AND is_her = $5',
        [tahun_ajaran_id, semester, tingkat, pelajaran, isHerValue]
      );

      let result;
      if (existing.rows.length > 0) {
        // Update
        result = await db.query(
          `UPDATE lembar_ujian 
           SET judul = $1, sub_judul = $2, alamat = $3, hari_tanggal = $4, instruksi = $5, soal = $6, updated_at = CURRENT_TIMESTAMP
           WHERE id = $7 RETURNING *`,
          [judul, sub_judul, alamat, hari_tanggal, instruksi, JSON.stringify(soal), existing.rows[0].id]
        );
      } else {
        // Insert
        result = await db.query(
          `INSERT INTO lembar_ujian (tahun_ajaran_id, semester, tingkat, pelajaran, judul, sub_judul, alamat, hari_tanggal, instruksi, soal, is_her)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
          [tahun_ajaran_id, semester, tingkat, pelajaran, judul, sub_judul, alamat, hari_tanggal, instruksi, JSON.stringify(soal), isHerValue]
        );
      }

      res.status(existing.rows.length > 0 ? 200 : 201).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Gagal menyimpan data lembar ujian.' });
    }
  });

  // Delete lembar ujian
  app.delete('/api/lembar-ujian/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const result = await db.query('DELETE FROM lembar_ujian WHERE id = $1 RETURNING *', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Lembar ujian tidak ditemukan.' });
      }
      res.json({ message: 'Lembar ujian berhasil dihapus.' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Gagal menghapus lembar ujian.' });
    }
  });

  // ===== SETTINGS API =====
  
  // Get setting
  app.get('/api/lembar-ujian-settings/:key', async (req, res) => {
    const { key } = req.params;
    try {
      const result = await db.query('SELECT value FROM settings WHERE key = $1', [key]);
      if (result.rows.length === 0) {
        return res.json({ value: null });
      }
      res.json({ value: result.rows[0].value });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Gagal memuat setting.' });
    }
  });

  // Save setting
  app.post('/api/lembar-ujian-settings', async (req, res) => {
    const { key, value } = req.body;
    try {
      await db.query(
        'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP',
        [key, value]
      );
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Gagal menyimpan setting.' });
    }
  });
}

module.exports = registerLembarUjianRoutes;
