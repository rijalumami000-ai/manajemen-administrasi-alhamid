const db = require('../../db');
const { getActiveTahunAjaran } = require('../services/tahunAjaranService');
const { nullableInt } = require('../utils/normalizers');

function registerJadwalPelajaranRoutes(app) {
  // GET /api/jadwal-pelajaran
  app.get('/api/jadwal-pelajaran', async (req, res) => {
    let tahun_ajaran_id = nullableInt(req.query.tahun_ajaran_id);
    const kelas_id = nullableInt(req.query.kelas_id);

    try {
      if (!tahun_ajaran_id) {
        const activeYear = await getActiveTahunAjaran();
        if (activeYear) {
          tahun_ajaran_id = activeYear.id;
        }
      }

      if (!tahun_ajaran_id) {
        return res.status(400).json({ error: 'Tahun ajaran aktif tidak ditemukan dan tahun_ajaran_id tidak disediakan.' });
      }

      let query = `
        SELECT 
          j.id,
          j.tahun_ajaran_id,
          j.kelas_id,
          j.malam,
          j.jam_ke,
          j.mata_pelajaran_id,
          j.guru_id,
          mp.nama AS mata_pelajaran_nama,
          g.nama AS guru_nama
        FROM jadwal_pelajaran_harian j
        LEFT JOIN mata_pelajaran mp ON j.mata_pelajaran_id = mp.id
        LEFT JOIN guru g ON j.guru_id = g.id
        WHERE j.tahun_ajaran_id = $1
      `;
      const params = [tahun_ajaran_id];

      if (kelas_id) {
        query += ` AND j.kelas_id = $2`;
        params.push(kelas_id);
      }

      query += ` ORDER BY j.kelas_id, j.malam, j.jam_ke`;

      const result = await db.query(query, params);
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching jadwal pelajaran:', error);
      res.status(500).json({ error: 'Gagal memuat data jadwal pelajaran.' });
    }
  });

  // POST /api/jadwal-pelajaran
  app.post('/api/jadwal-pelajaran', async (req, res) => {
    let { tahun_ajaran_id, kelas_id, malam, jam_ke, mata_pelajaran_id, guru_id } = req.body;

    const parsedKelasId = nullableInt(kelas_id);
    const parsedJamKe = Number(jam_ke);
    const parsedMapelId = nullableInt(mata_pelajaran_id);
    const parsedGuruId = nullableInt(guru_id);
    let parsedTahunAjaranId = nullableInt(tahun_ajaran_id);

    if (!parsedKelasId || !malam || !parsedJamKe) {
      return res.status(400).json({ error: 'Kelas, Malam, dan Jam Ke wajib diisi.' });
    }

    if (parsedJamKe !== 1 && parsedJamKe !== 2) {
      return res.status(400).json({ error: 'Jam Ke harus 1 atau 2.' });
    }

    try {
      if (!parsedTahunAjaranId) {
        const activeYear = await getActiveTahunAjaran();
        if (activeYear) {
          parsedTahunAjaranId = activeYear.id;
        }
      }

      if (!parsedTahunAjaranId) {
        return res.status(400).json({ error: 'Tahun ajaran tidak ditemukan.' });
      }

      // If both mapel and guru are null, we should delete this entry from DB to keep it clean
      if (parsedMapelId === null && parsedGuruId === null) {
        await db.query(`
          DELETE FROM jadwal_pelajaran_harian
          WHERE tahun_ajaran_id = $1 AND kelas_id = $2 AND malam = $3 AND jam_ke = $4
        `, [parsedTahunAjaranId, parsedKelasId, malam, parsedJamKe]);
        
        return res.json({ message: 'Slot jadwal berhasil dikosongkan.', deleted: true });
      }

      const result = await db.query(`
        INSERT INTO jadwal_pelajaran_harian (tahun_ajaran_id, kelas_id, malam, jam_ke, mata_pelajaran_id, guru_id, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT (tahun_ajaran_id, kelas_id, malam, jam_ke)
        DO UPDATE SET 
          mata_pelajaran_id = EXCLUDED.mata_pelajaran_id,
          guru_id = EXCLUDED.guru_id,
          updated_at = NOW()
        RETURNING *
      `, [parsedTahunAjaranId, parsedKelasId, malam, parsedJamKe, parsedMapelId, parsedGuruId]);

      // Fetch full row with joined details
      const fullRow = await db.query(`
        SELECT 
          j.id,
          j.tahun_ajaran_id,
          j.kelas_id,
          j.malam,
          j.jam_ke,
          j.mata_pelajaran_id,
          j.guru_id,
          mp.nama AS mata_pelajaran_nama,
          g.nama AS guru_nama
        FROM jadwal_pelajaran_harian j
        LEFT JOIN mata_pelajaran mp ON j.mata_pelajaran_id = mp.id
        LEFT JOIN guru g ON j.guru_id = g.id
        WHERE j.id = $1
      `, [result.rows[0].id]);

      res.json(fullRow.rows[0]);
    } catch (error) {
      console.error('Error saving jadwal pelajaran:', error);
      res.status(500).json({ error: 'Gagal menyimpan jadwal pelajaran.' });
    }
  });

  // DELETE /api/jadwal-pelajaran/:id
  app.delete('/api/jadwal-pelajaran/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const result = await db.query('DELETE FROM jadwal_pelajaran_harian WHERE id = $1 RETURNING id', [id]);
      if (!result.rows.length) {
        return res.status(404).json({ error: 'Slot jadwal tidak ditemukan.' });
      }
      res.json({ message: 'Slot jadwal berhasil dihapus.' });
    } catch (error) {
      console.error('Error deleting jadwal pelajaran:', error);
      res.status(500).json({ error: 'Gagal menghapus slot jadwal.' });
    }
  });
}

module.exports = registerJadwalPelajaranRoutes;
