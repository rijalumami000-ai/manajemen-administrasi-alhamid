const db = require('../../db');
const { getActiveTahunAjaran, syncSantriToActiveTahunAjaran } = require('../services/tahunAjaranService');
const { isUniqueViolation } = require('../utils/databaseErrors');
const { normalizeKelasJenis, normalizeText, normalizeYearCode, nullableInt } = require('../utils/normalizers');

function registerKelasRoutes(app) {
  // ===== KELAS API =====
  app.get('/api/kelas', async (req, res) => {
    try {
      const result = await db.query(`
        SELECT k.*, g.nama as mustahiq_nama, m.nama as muhafadzoh_nama, q.nama as qiroatul_nama 
        FROM kelas k
        LEFT JOIN guru g ON k.mustahiq_id = g.id
        LEFT JOIN mata_pelajaran m ON k.muhafadzoh_mapel_id = m.id
        LEFT JOIN mata_pelajaran q ON k.qiroatul_mapel_id = q.id
        ORDER BY k.jenis, k.nama
      `);
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
      const result = await db.query(
        'INSERT INTO kelas (jenis, nama, tingkat, mustahiq_id, muhafadzoh_mapel_id, qiroatul_mapel_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [jenis, nama, tingkat, mustahiq_id, muhafadzoh_mapel_id, qiroatul_mapel_id]
      );
      console.log(`✅ Kelas created successfully:`, result.rows[0]);
      res.status(201).json(result.rows[0]);
    } catch (error) {
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
    console.log('📦 IDs:', { mustahiq_id, muhafadzoh_mapel_id, qiroatul_mapel_id });
    console.log('📦 Raw Request body:', req.body);

    try {
      const result = await db.query(
        'UPDATE kelas SET jenis = $1, nama = $2, tingkat = $3, mustahiq_id = $4, muhafadzoh_mapel_id = $5, qiroatul_mapel_id = $6 WHERE id = $7 RETURNING *',
        [jenis, nama, tingkat, mustahiq_id, muhafadzoh_mapel_id, qiroatul_mapel_id, id]
      );

      if (!result.rows.length) {
        return res.status(404).json({ error: 'Data kelas tidak ditemukan.' });
      }

      console.log(`✅ Kelas updated successfully:`, result.rows[0]);
      res.json(result.rows[0]);
    } catch (error) {
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
