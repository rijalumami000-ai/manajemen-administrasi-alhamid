const db = require('../../db');
const { getActiveTahunAjaran, syncSantriToActiveTahunAjaran } = require('../services/tahunAjaranService');
const { isUniqueViolation } = require('../utils/databaseErrors');
const { normalizeKelasJenis, normalizeText, normalizeYearCode, nullableInt } = require('../utils/normalizers');

function registerKelasRoutes(app) {
  // ===== KELAS API =====
  app.get('/api/kelas', async (req, res) => {
    try {
      let tahun_ajaran_id = nullableInt(req.query.tahun_ajaran_id);
      if (!tahun_ajaran_id) {
        const activeYear = await getActiveTahunAjaran();
        if (activeYear) {
          tahun_ajaran_id = activeYear.id;
        }
      }

      let result;
      if (tahun_ajaran_id) {
        result = await db.query(`
          SELECT k.id, k.jenis, k.nama, k.tingkat, k.created_at,
                 COALESCE(kta.mustahiq_id, k.mustahiq_id) as mustahiq_id,
                 COALESCE(kta.muhafadzoh_mapel_id, k.muhafadzoh_mapel_id) as muhafadzoh_mapel_id,
                 COALESCE(kta.qiroatul_mapel_id, k.qiroatul_mapel_id) as qiroatul_mapel_id,
                 g.nama as mustahiq_nama, m.nama as muhafadzoh_nama, q.nama as qiroatul_nama 
          FROM kelas k
          LEFT JOIN kelas_tahun_ajaran kta ON k.id = kta.kelas_id AND kta.tahun_ajaran_id = $1
          LEFT JOIN guru g ON COALESCE(kta.mustahiq_id, k.mustahiq_id) = g.id
          LEFT JOIN mata_pelajaran m ON COALESCE(kta.muhafadzoh_mapel_id, k.muhafadzoh_mapel_id) = m.id
          LEFT JOIN mata_pelajaran q ON COALESCE(kta.qiroatul_mapel_id, k.qiroatul_mapel_id) = q.id
          ORDER BY k.jenis, k.nama
        `, [tahun_ajaran_id]);
      } else {
        result = await db.query(`
          SELECT k.id, k.jenis, k.nama, k.tingkat, k.created_at,
                 k.mustahiq_id, k.muhafadzoh_mapel_id, k.qiroatul_mapel_id,
                 g.nama as mustahiq_nama, m.nama as muhafadzoh_nama, q.nama as qiroatul_nama 
          FROM kelas k
          LEFT JOIN guru g ON k.mustahiq_id = g.id
          LEFT JOIN mata_pelajaran m ON k.muhafadzoh_mapel_id = m.id
          LEFT JOIN mata_pelajaran q ON k.qiroatul_mapel_id = q.id
          ORDER BY k.jenis, k.nama
        `);
      }
      res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Gagal memuat data kelas.' });
    }
  });

  app.post('/api/kelas', async (req, res) => {
    const jenis = normalizeKelasJenis(req.body.jenis);
    const nama = normalizeText(req.body.nama);
    const mustahiq_id = nullableInt(req.body.mustahiq_id);
    const muhafadzoh_mapel_id = nullableInt(req.body.muhafadzoh_mapel_id);
    const qiroatul_mapel_id = nullableInt(req.body.qiroatul_mapel_id);
    const tahun_ajaran_id = nullableInt(req.body.tahun_ajaran_id);

    if (!jenis || !nama) {
      return res.status(400).json({ error: 'Jenis kelas dan nama kelas wajib diisi.' });
    }

    // Auto-detect tingkat from nama
    let tingkat = null;

    // Extract tingkat from nama
    if (nama.toLowerCase().includes('sifir')) {
      tingkat = 0;
    } else if (nama.toLowerCase().includes('sp')) {
      tingkat = 1; // Special Program
    } else {
      // Extract number from nama (e.g., "1A" -> 1, "Kelas 2" -> 2, "11-IPA" -> 11)
      const match = nama.match(/(\d+)/);
      if (match) {
        tingkat = parseInt(match[1], 10);
      }
    }

    if (tingkat === null) {
      return res.status(400).json({
        error: 'Tidak dapat mendeteksi tingkat kelas dari nama. Gunakan format: "1A", "Kelas 2", "Sifir", "SP", dll.'
      });
    }

    console.log(`📝 Creating kelas: jenis=${jenis}, nama=${nama}, tingkat=${tingkat}`);

    try {
      await db.query('BEGIN');

      const result = await db.query(
        'INSERT INTO kelas (jenis, nama, tingkat, mustahiq_id, muhafadzoh_mapel_id, qiroatul_mapel_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [jenis, nama, tingkat, mustahiq_id, muhafadzoh_mapel_id, qiroatul_mapel_id]
      );
      const newKelas = result.rows[0];

      if (tahun_ajaran_id) {
        await db.query(
          `INSERT INTO kelas_tahun_ajaran (kelas_id, tahun_ajaran_id, mustahiq_id, muhafadzoh_mapel_id, qiroatul_mapel_id)
           VALUES ($1, $2, $3, $4, $5)`,
          [newKelas.id, tahun_ajaran_id, mustahiq_id, muhafadzoh_mapel_id, qiroatul_mapel_id]
        );
      }

      await db.query('COMMIT');
      console.log(`✅ Kelas created successfully:`, newKelas);
      res.status(201).json(newKelas);
    } catch (error) {
      await db.query('ROLLBACK');
      console.error('❌ Error creating kelas:', error);
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
    const mustahiq_id = nullableInt(req.body.mustahiq_id);
    const muhafadzoh_mapel_id = nullableInt(req.body.muhafadzoh_mapel_id);
    const qiroatul_mapel_id = nullableInt(req.body.qiroatul_mapel_id);
    const tahun_ajaran_id = nullableInt(req.body.tahun_ajaran_id);

    if (!jenis || !nama) {
      return res.status(400).json({ error: 'Jenis kelas dan nama kelas wajib diisi.' });
    }

    // Auto-detect tingkat from nama
    let tingkat = null;

    // Extract tingkat from nama
    if (nama.toLowerCase().includes('sifir')) {
      tingkat = 0;
    } else if (nama.toLowerCase().includes('sp')) {
      tingkat = 1; // Special Program
    } else {
      // Extract number from nama (e.g., "1A" -> 1, "Kelas 2" -> 2, "11-IPA" -> 11)
      const match = nama.match(/(\d+)/);
      if (match) {
        tingkat = parseInt(match[1], 10);
      }
    }

    if (tingkat === null) {
      return res.status(400).json({
        error: 'Tidak dapat mendeteksi tingkat kelas dari nama. Gunakan format: "1A", "Kelas 2", "Sifir", "SP", dll.'
      });
    }

    console.log(`📝 Updating kelas ${id}: jenis=${jenis}, nama=${nama}, tingkat=${tingkat}`);
    console.log('📦 IDs:', { mustahiq_id, muhafadzoh_mapel_id, qiroatul_mapel_id, tahun_ajaran_id });
    console.log('📦 Raw Request body:', req.body);

    try {
      await db.query('BEGIN');

      // 1. Update basic global kelas info in kelas table
      const result = await db.query(
        'UPDATE kelas SET jenis = $1, nama = $2, tingkat = $3 WHERE id = $4 RETURNING *',
        [jenis, nama, tingkat, id]
      );

      if (!result.rows.length) {
        await db.query('ROLLBACK');
        return res.status(404).json({ error: 'Data kelas tidak ditemukan.' });
      }

      const updatedKelas = result.rows[0];

      // 2. Save settings to kelas_tahun_ajaran if a year is provided
      if (tahun_ajaran_id) {
        await db.query(
          `INSERT INTO kelas_tahun_ajaran (kelas_id, tahun_ajaran_id, mustahiq_id, muhafadzoh_mapel_id, qiroatul_mapel_id)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (kelas_id, tahun_ajaran_id)
           DO UPDATE SET mustahiq_id = EXCLUDED.mustahiq_id,
                         muhafadzoh_mapel_id = EXCLUDED.muhafadzoh_mapel_id,
                         qiroatul_mapel_id = EXCLUDED.qiroatul_mapel_id`,
          [id, tahun_ajaran_id, mustahiq_id, muhafadzoh_mapel_id, qiroatul_mapel_id]
        );
      } else {
        // Fallback updates on the kelas table directly (legacy behavior)
        await db.query(
          'UPDATE kelas SET mustahiq_id = $1, muhafadzoh_mapel_id = $2, qiroatul_mapel_id = $3 WHERE id = $4',
          [mustahiq_id, muhafadzoh_mapel_id, qiroatul_mapel_id, id]
        );
      }

      await db.query('COMMIT');
      console.log(`✅ Kelas updated successfully:`, updatedKelas);
      res.json({
        ...updatedKelas,
        mustahiq_id,
        muhafadzoh_mapel_id,
        qiroatul_mapel_id
      });
    } catch (error) {
      await db.query('ROLLBACK');
      console.error('❌ Error updating kelas:', error);
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
