const db = require('../../db');

function registerStrukturRoutes(app) {
  // GET /api/struktur/:tipe
  app.get('/api/struktur/:tipe', async (req, res) => {
    const { tipe } = db.query; // wait, let's use req.params
    const typeParam = req.params.tipe;
    if (typeParam !== 'madrasah_diniyah' && typeParam !== 'panitia_ujian') {
      return res.status(400).json({ error: 'Tipe struktur tidak valid. Gunakan: madrasah_diniyah atau panitia_ujian' });
    }

    try {
      const result = await db.query(`
        SELECT 
          s.id,
          s.tipe,
          s.jabatan,
          s.guru_id,
          s.nama_custom,
          s.keterangan,
          s.no_urut,
          g.nama AS guru_nama,
          g.no_hp AS guru_no_hp,
          g.foto_url AS guru_foto_url
        FROM struktur_organisasi s
        LEFT JOIN guru g ON s.guru_id = g.id
        WHERE s.tipe = $1
        ORDER BY s.no_urut ASC, s.id ASC
      `, [typeParam]);

      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching struktur:', error);
      res.status(500).json({ error: 'Gagal memuat data struktur organisasi.' });
    }
  });

  // POST /api/struktur
  app.post('/api/struktur', async (req, res) => {
    const { id, guru_id, nama_custom, keterangan } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'ID struktur wajib disertakan.' });
    }

    const parsedGuruId = guru_id ? Number(guru_id) : null;
    const parsedNamaCustom = nama_custom ? nama_custom.trim() : null;

    try {
      const result = await db.query(`
        UPDATE struktur_organisasi
        SET 
          guru_id = $1,
          nama_custom = $2,
          keterangan = $3,
          updated_at = NOW()
        WHERE id = $4
        RETURNING *
      `, [parsedGuruId, parsedNamaCustom, keterangan, id]);

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
    const { tipe, jabatan, guru_id, nama_custom, keterangan, no_urut } = req.body;

    if (!tipe || !jabatan) {
      return res.status(400).json({ error: 'Tipe dan Jabatan wajib diisi.' });
    }

    const parsedGuruId = guru_id ? Number(guru_id) : null;
    const parsedNamaCustom = nama_custom ? nama_custom.trim() : null;
    const parsedNoUrut = no_urut ? Number(no_urut) : 99; // Default to high number so it displays at bottom

    try {
      const result = await db.query(`
        INSERT INTO struktur_organisasi (tipe, jabatan, guru_id, nama_custom, keterangan, no_urut)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [tipe, jabatan, parsedGuruId, parsedNamaCustom, keterangan, parsedNoUrut]);

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
    const { tipe } = req.body;
    if (tipe !== 'madrasah_diniyah' && tipe !== 'panitia_ujian') {
      return res.status(400).json({ error: 'Tipe struktur tidak valid.' });
    }

    try {
      // 1. Set all guru_id and nama_custom to null for seeded positions
      await db.query(`
        UPDATE struktur_organisasi
        SET 
          guru_id = NULL,
          nama_custom = NULL,
          keterangan = NULL,
          updated_at = NOW()
        WHERE tipe = $1 AND no_urut <= 7
      `, [tipe]);

      // 2. Delete any extra custom positions (e.g. extra TUs that were added)
      await db.query(`
        DELETE FROM struktur_organisasi
        WHERE tipe = $1 AND no_urut > 7
      `, [tipe]);

      res.json({ message: 'Struktur organisasi berhasil dikosongkan.' });
    } catch (error) {
      console.error('Error resetting struktur:', error);
      res.status(500).json({ error: 'Gagal mengosongkan data struktur organisasi.' });
    }
  });
}

module.exports = registerStrukturRoutes;
