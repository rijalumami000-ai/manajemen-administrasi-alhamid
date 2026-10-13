const db = require('../../db');

const VALID_TYPES = [
  'madrasah_diniyah', 'panitia_ujian',
  'pmq', 'pondok_putra', 'pondok_putri',
  'panitia_sambangan', 'panitia_haflah', 'panitia_psb'
];

function registerStrukturRoutes(app) {
  // GET /api/struktur/:tipe
  app.get('/api/struktur/:tipe', async (req, res) => {
    const typeParam = req.params.tipe;
    if (!VALID_TYPES.includes(typeParam)) {
      return res.status(400).json({ error: `Tipe struktur tidak valid. Gunakan salah satu: ${VALID_TYPES.join(', ')}` });
    }

    const { tahun_ajaran_id } = req.query;

    try {
      let query = `
        SELECT 
          s.id,
          s.tipe,
          s.jabatan,
          s.guru_id,
          s.nama_custom,
          s.keterangan,
          s.no_urut,
          s.tahun_ajaran_id,
          g.nama AS guru_nama,
          g.no_hp AS guru_no_hp,
          g.foto_url AS guru_foto_url
        FROM struktur_organisasi s
        LEFT JOIN guru g ON s.guru_id = g.id
        WHERE s.tipe = $1
      `;
      const params = [typeParam];

      if (tahun_ajaran_id) {
        query += ` AND (s.tahun_ajaran_id = $2 OR s.tahun_ajaran_id IS NULL)`;
        params.push(parseInt(tahun_ajaran_id, 10));
      }

      query += ` ORDER BY s.no_urut ASC, s.id ASC`;

      const result = await db.query(query, params);
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching struktur:', error);
      res.status(500).json({ error: 'Gagal memuat data struktur organisasi.' });
    }
  });

  // POST /api/struktur
  app.post('/api/struktur', async (req, res) => {
    const { id, guru_id, nama_custom, keterangan, tahun_ajaran_id } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'ID struktur wajib disertakan.' });
    }

    const parsedGuruId = guru_id ? Number(guru_id) : null;
    const parsedNamaCustom = nama_custom ? nama_custom.trim() : null;
    const parsedTaId = tahun_ajaran_id ? Number(tahun_ajaran_id) : null;

    try {
      const result = await db.query(`
        UPDATE struktur_organisasi
        SET 
          guru_id = $1,
          nama_custom = $2,
          keterangan = $3,
          tahun_ajaran_id = COALESCE($4, tahun_ajaran_id),
          updated_at = NOW()
        WHERE id = $5
        RETURNING *
      `, [parsedGuruId, parsedNamaCustom, keterangan, parsedTaId, id]);

      if (!result.rows.length) {
        return res.status(404).json({ error: 'Jabatan/struktur tidak ditemukan.' });
      }

      // Fetch the updated record with guru info
      const fullRecord = await db.query(`
        SELECT 
          s.id,
          s.tipe,
          s.jabatan,
          s.guru_id,
          s.nama_custom,
          s.keterangan,
          s.no_urut,
          s.tahun_ajaran_id,
          g.nama AS guru_nama,
          g.no_hp AS guru_no_hp,
          g.foto_url AS guru_foto_url
        FROM struktur_organisasi s
        LEFT JOIN guru g ON s.guru_id = g.id
        WHERE s.id = $1
      `, [id]);

      res.json(fullRecord.rows[0]);
    } catch (error) {
      console.error('Error updating struktur:', error);
      res.status(500).json({ error: 'Gagal memperbarui data struktur organisasi.' });
    }
  });

  // POST /api/struktur/add (For multiple roles like TU)
  app.post('/api/struktur/add', async (req, res) => {
    const { tipe, jabatan, guru_id, nama_custom, keterangan, no_urut, tahun_ajaran_id } = req.body;

    if (!tipe || !jabatan) {
      return res.status(400).json({ error: 'Tipe dan Jabatan wajib diisi.' });
    }

    const parsedGuruId = guru_id ? Number(guru_id) : null;
    const parsedNamaCustom = nama_custom ? nama_custom.trim() : null;
    const parsedNoUrut = no_urut ? Number(no_urut) : 99;
    const parsedTaId = tahun_ajaran_id ? Number(tahun_ajaran_id) : null;

    try {
      const result = await db.query(`
        INSERT INTO struktur_organisasi (tipe, jabatan, guru_id, nama_custom, keterangan, no_urut, tahun_ajaran_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [tipe, jabatan, parsedGuruId, parsedNamaCustom, keterangan, parsedNoUrut, parsedTaId]);

      // Fetch full row with joined details
      const fullRow = await db.query(`
        SELECT 
          s.id,
          s.tipe,
          s.jabatan,
          s.guru_id,
          s.nama_custom,
          s.keterangan,
          s.no_urut,
          s.tahun_ajaran_id,
          g.nama AS guru_nama,
          g.no_hp AS guru_no_hp,
          g.foto_url AS guru_foto_url
        FROM struktur_organisasi s
        LEFT JOIN guru g ON s.guru_id = g.id
        WHERE s.id = $1
      `, [result.rows[0].id]);

      res.status(201).json(fullRow.rows[0]);
    } catch (error) {
      console.error('Error adding to struktur:', error);
      res.status(500).json({ error: 'Gagal menambahkan personel baru.' });
    }
  });

  // DELETE /api/struktur/:id
  app.delete('/api/struktur/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const result = await db.query('DELETE FROM struktur_organisasi WHERE id = $1 RETURNING id', [id]);
      if (!result.rows.length) {
        return res.status(404).json({ error: 'Personel tidak ditemukan.' });
      }
      res.json({ message: 'Personel berhasil dihapus.' });
    } catch (error) {
      console.error('Error deleting from struktur:', error);
      res.status(500).json({ error: 'Gagal menghapus personel.' });
    }
  });

  // POST /api/struktur/reset
  app.post('/api/struktur/reset', async (req, res) => {
    const { tipe, tahun_ajaran_id } = req.body;
    if (!VALID_TYPES.includes(tipe)) {
      return res.status(400).json({ error: 'Tipe struktur tidak valid.' });
    }

    try {
      // 1. Set all guru_id and nama_custom to null for seeded positions
      let resetQuery = `
        UPDATE struktur_organisasi
        SET 
          guru_id = NULL,
          nama_custom = NULL,
          keterangan = NULL,
          updated_at = NOW()
        WHERE tipe = $1 AND no_urut <= 7
      `;
      const resetParams = [tipe];
      if (tahun_ajaran_id) {
        resetQuery += ` AND (tahun_ajaran_id = $2 OR tahun_ajaran_id IS NULL)`;
        resetParams.push(parseInt(tahun_ajaran_id, 10));
      }
      await db.query(resetQuery, resetParams);

      // 2. Delete any extra custom positions
      let deleteQuery = `DELETE FROM struktur_organisasi WHERE tipe = $1 AND no_urut > 7`;
      const deleteParams = [tipe];
      if (tahun_ajaran_id) {
        deleteQuery += ` AND (tahun_ajaran_id = $2 OR tahun_ajaran_id IS NULL)`;
        deleteParams.push(parseInt(tahun_ajaran_id, 10));
      }
      await db.query(deleteQuery, deleteParams);

      res.json({ message: 'Struktur organisasi berhasil dikosongkan.' });
    } catch (error) {
      console.error('Error resetting struktur:', error);
      res.status(500).json({ error: 'Gagal mengosongkan data struktur organisasi.' });
    }
  });
}

module.exports = registerStrukturRoutes;
