const db = require('../../db');
const { normalizeText } = require('../utils/normalizers');

function registerInventarisRoutes(app) {
  // GET /api/inventaris/rekap - Rekapitulasi inventaris
  app.get('/api/inventaris/rekap', async (req, res) => {
    try {
      const summaryResult = await db.query(`
        SELECT
          kategori,
          COUNT(*)::int AS total_item,
          COALESCE(SUM(jumlah), 0)::int AS total_kuantitas,
          COALESCE(SUM(CASE WHEN kondisi = 'Baik' THEN jumlah ELSE 0 END), 0)::int AS baik,
          COALESCE(SUM(CASE WHEN kondisi = 'Rusak Ringan' THEN jumlah ELSE 0 END), 0)::int AS rusak_ringan,
          COALESCE(SUM(CASE WHEN kondisi = 'Rusak Berat' THEN jumlah ELSE 0 END), 0)::int AS rusak_berat
        FROM inventaris
        GROUP BY kategori
      `);

      const totalResult = await db.query(`
        SELECT
          COUNT(*)::int AS total_item,
          COALESCE(SUM(jumlah), 0)::int AS total_kuantitas,
          COALESCE(SUM(CASE WHEN kondisi = 'Baik' THEN jumlah ELSE 0 END), 0)::int AS baik,
          COALESCE(SUM(CASE WHEN kondisi = 'Rusak Ringan' THEN jumlah ELSE 0 END), 0)::int AS rusak_ringan,
          COALESCE(SUM(CASE WHEN kondisi = 'Rusak Berat' THEN jumlah ELSE 0 END), 0)::int AS rusak_berat
        FROM inventaris
      `);

      res.json({
        total: totalResult.rows[0] || {
          total_item: 0,
          total_kuantitas: 0,
          baik: 0,
          rusak_ringan: 0,
          rusak_berat: 0
        },
        kategori: summaryResult.rows
      });
    } catch (error) {
      console.error('Error fetching inventaris rekap:', error);
      res.status(500).json({ error: 'Gagal memuat rekapitulasi inventaris.' });
    }
  });

  // GET /api/inventaris - List inventaris dengan filter
  app.get('/api/inventaris', async (req, res) => {
    try {
      const { kategori, kondisi, search } = req.query;
      const conditions = [];
      const params = [];

      if (kategori) {
        params.push(kategori.toLowerCase());
        conditions.push(`LOWER(kategori) = $${params.length}`);
      }

      if (kondisi) {
        params.push(kondisi);
        conditions.push(`kondisi = $${params.length}`);
      }

      if (search) {
        params.push(`%${search.toLowerCase()}%`);
        conditions.push(`(
          LOWER(nama_barang) LIKE $${params.length} OR
          LOWER(COALESCE(kode_barang, '')) LIKE $${params.length} OR
          LOWER(COALESCE(lokasi, '')) LIKE $${params.length} OR
          LOWER(COALESCE(penanggung_jawab, '')) LIKE $${params.length}
        )`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const query = `
        SELECT *
        FROM inventaris
        ${whereClause}
        ORDER BY kategori, nama_barang ASC
      `;

      const result = await db.query(query, params);
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching inventaris:', error);
      res.status(500).json({ error: 'Gagal memuat data inventaris.' });
    }
  });

  // POST /api/inventaris - Tambah data inventaris
  app.post('/api/inventaris', async (req, res) => {
    try {
      const kategori = normalizeText(req.body.kategori)?.toLowerCase();
      const nama_barang = normalizeText(req.body.nama_barang);
      const kode_barang = normalizeText(req.body.kode_barang);
      const jumlah = req.body.jumlah ? parseInt(req.body.jumlah, 10) : 1;
      const satuan = normalizeText(req.body.satuan) || 'Unit';
      const kondisi = normalizeText(req.body.kondisi) || 'Baik';
      const lokasi = normalizeText(req.body.lokasi);
      const penanggung_jawab = normalizeText(req.body.penanggung_jawab);
      const keterangan = normalizeText(req.body.keterangan);

      if (!kategori || !['pondok', 'madin', 'pmq'].includes(kategori)) {
        return res.status(400).json({ error: 'Kategori harus pondok, madin, atau pmq.' });
      }

      if (!nama_barang) {
        return res.status(400).json({ error: 'Nama barang wajib diisi.' });
      }

      const result = await db.query(
        `INSERT INTO inventaris (
          kategori, nama_barang, kode_barang, jumlah, satuan, kondisi, lokasi, penanggung_jawab, keterangan, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        RETURNING *`,
        [kategori, nama_barang, kode_barang, jumlah, satuan, kondisi, lokasi, penanggung_jawab, keterangan]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating inventaris:', error);
      res.status(500).json({ error: 'Gagal menyimpan data inventaris.' });
    }
  });

  // PUT /api/inventaris/:id - Update data inventaris
  app.put('/api/inventaris/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const kategori = normalizeText(req.body.kategori)?.toLowerCase();
      const nama_barang = normalizeText(req.body.nama_barang);
      const kode_barang = normalizeText(req.body.kode_barang);
      const jumlah = req.body.jumlah ? parseInt(req.body.jumlah, 10) : 1;
      const satuan = normalizeText(req.body.satuan) || 'Unit';
      const kondisi = normalizeText(req.body.kondisi) || 'Baik';
      const lokasi = normalizeText(req.body.lokasi);
      const penanggung_jawab = normalizeText(req.body.penanggung_jawab);
      const keterangan = normalizeText(req.body.keterangan);

      if (!nama_barang) {
        return res.status(400).json({ error: 'Nama barang wajib diisi.' });
      }

      const result = await db.query(
        `UPDATE inventaris
         SET kategori = COALESCE($1, kategori),
             nama_barang = $2,
             kode_barang = $3,
             jumlah = $4,
             satuan = $5,
             kondisi = $6,
             lokasi = $7,
             penanggung_jawab = $8,
             keterangan = $9,
             updated_at = NOW()
         WHERE id = $10
         RETURNING *`,
        [kategori, nama_barang, kode_barang, jumlah, satuan, kondisi, lokasi, penanggung_jawab, keterangan, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Data inventaris tidak ditemukan.' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating inventaris:', error);
      res.status(500).json({ error: 'Gagal memperbarui data inventaris.' });
    }
  });

  // DELETE /api/inventaris/:id - Hapus data inventaris
  app.delete('/api/inventaris/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const result = await db.query('DELETE FROM inventaris WHERE id = $1 RETURNING id', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Data inventaris tidak ditemukan.' });
      }
      res.json({ message: 'Data inventaris berhasil dihapus.' });
    } catch (error) {
      console.error('Error deleting inventaris:', error);
      res.status(500).json({ error: 'Gagal menghapus data inventaris.' });
    }
  });
}

module.exports = registerInventarisRoutes;
