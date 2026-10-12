const db = require('../../db');
const { normalizeText } = require('../utils/normalizers');

function registerRomadhonRoutes(app) {

  // ═══════════════════════════════════════════════════════════════
  // JADWAL KAJIAN BALAGH ROMADHON
  // ═══════════════════════════════════════════════════════════════

  // GET all kajian balagh by tahun_ajaran_id
  app.get('/api/romadhon/kajian-balagh', async (req, res) => {
    try {
      const { tahun_ajaran_id } = req.query;
      let query = `
        SELECT * FROM jadwal_kajian_balagh
      `;
      const params = [];
      if (tahun_ajaran_id) {
        query += ' WHERE tahun_ajaran_id = $1';
        params.push(tahun_ajaran_id);
      }
      query += ' ORDER BY kelas ASC, no_urut ASC, id ASC';
      const result = await db.query(query, params);
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching kajian balagh:', error);
      res.status(500).json({ error: 'Gagal memuat data kajian balagh.' });
    }
  });

  // POST – add one entry
  app.post('/api/romadhon/kajian-balagh', async (req, res) => {
    const { tahun_ajaran_id, kelas, waktu, qori, kitab, tempat, no_urut } = req.body;

    if (!tahun_ajaran_id || !kelas || !waktu || !qori || !kitab) {
      return res.status(400).json({ error: 'Tahun ajaran, kelas, waktu, qori, dan kitab wajib diisi.' });
    }

    try {
      const result = await db.query(
        `INSERT INTO jadwal_kajian_balagh (tahun_ajaran_id, kelas, waktu, qori, kitab, tempat, no_urut)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [tahun_ajaran_id, normalizeText(kelas), normalizeText(waktu), normalizeText(qori), normalizeText(kitab), normalizeText(tempat), no_urut || 0]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error adding kajian balagh:', error);
      res.status(500).json({ error: 'Gagal menambahkan jadwal kajian.' });
    }
  });

  // PUT – update entry
  app.put('/api/romadhon/kajian-balagh/:id', async (req, res) => {
    const { id } = req.params;
    const { kelas, waktu, qori, kitab, tempat, no_urut } = req.body;

    try {
      const result = await db.query(
        `UPDATE jadwal_kajian_balagh 
         SET kelas = $1, waktu = $2, qori = $3, kitab = $4, tempat = $5, no_urut = $6, updated_at = NOW()
         WHERE id = $7 RETURNING *`,
        [normalizeText(kelas), normalizeText(waktu), normalizeText(qori), normalizeText(kitab), normalizeText(tempat), no_urut || 0, id]
      );
      if (!result.rows.length) return res.status(404).json({ error: 'Data tidak ditemukan.' });
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating kajian balagh:', error);
      res.status(500).json({ error: 'Gagal memperbarui data.' });
    }
  });

  // DELETE
  app.delete('/api/romadhon/kajian-balagh/:id', async (req, res) => {
    try {
      const result = await db.query('DELETE FROM jadwal_kajian_balagh WHERE id = $1 RETURNING id', [req.params.id]);
      if (!result.rows.length) return res.status(404).json({ error: 'Data tidak ditemukan.' });
      res.json({ message: 'Data berhasil dihapus.' });
    } catch (error) {
      console.error('Error deleting kajian balagh:', error);
      res.status(500).json({ error: 'Gagal menghapus data.' });
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // JADWAL IMAM TARAWIH & BILAL
  // ═══════════════════════════════════════════════════════════════

  // GET all
  app.get('/api/romadhon/imam-tarawih', async (req, res) => {
    try {
      const { tahun_ajaran_id } = req.query;
      let query = `SELECT * FROM jadwal_imam_tarawih`;
      const params = [];
      if (tahun_ajaran_id) {
        query += ' WHERE tahun_ajaran_id = $1';
        params.push(tahun_ajaran_id);
      }
      query += ' ORDER BY malam ASC, no_urut ASC';
      const result = await db.query(query, params);
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching imam tarawih:', error);
      res.status(500).json({ error: 'Gagal memuat jadwal imam tarawih.' });
    }
  });

  // POST
  app.post('/api/romadhon/imam-tarawih', async (req, res) => {
    const { tahun_ajaran_id, malam, imam, bilal, tempat, no_urut } = req.body;

    if (!tahun_ajaran_id || !malam || !imam) {
      return res.status(400).json({ error: 'Tahun ajaran, malam, dan imam wajib diisi.' });
    }

    try {
      const result = await db.query(
        `INSERT INTO jadwal_imam_tarawih (tahun_ajaran_id, malam, imam, bilal, tempat, no_urut)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [tahun_ajaran_id, malam, normalizeText(imam), normalizeText(bilal), normalizeText(tempat), no_urut || 0]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error adding imam tarawih:', error);
      res.status(500).json({ error: 'Gagal menambahkan jadwal imam tarawih.' });
    }
  });

  // PUT
  app.put('/api/romadhon/imam-tarawih/:id', async (req, res) => {
    const { id } = req.params;
    const { malam, imam, bilal, tempat, no_urut } = req.body;

    try {
      const result = await db.query(
        `UPDATE jadwal_imam_tarawih 
         SET malam = $1, imam = $2, bilal = $3, tempat = $4, no_urut = $5, updated_at = NOW()
         WHERE id = $6 RETURNING *`,
        [malam, normalizeText(imam), normalizeText(bilal), normalizeText(tempat), no_urut || 0, id]
      );
      if (!result.rows.length) return res.status(404).json({ error: 'Data tidak ditemukan.' });
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating imam tarawih:', error);
      res.status(500).json({ error: 'Gagal memperbarui data.' });
    }
  });

  // DELETE
  app.delete('/api/romadhon/imam-tarawih/:id', async (req, res) => {
    try {
      const result = await db.query('DELETE FROM jadwal_imam_tarawih WHERE id = $1 RETURNING id', [req.params.id]);
      if (!result.rows.length) return res.status(404).json({ error: 'Data tidak ditemukan.' });
      res.json({ message: 'Data berhasil dihapus.' });
    } catch (error) {
      console.error('Error deleting imam tarawih:', error);
      res.status(500).json({ error: 'Gagal menghapus data.' });
    }
  });
}

module.exports = registerRomadhonRoutes;
