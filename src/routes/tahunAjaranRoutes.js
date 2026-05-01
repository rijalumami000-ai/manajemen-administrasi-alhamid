const db = require('../../db');
const { getActiveTahunAjaran, syncSantriToActiveTahunAjaran } = require('../services/tahunAjaranService');
const { isUniqueViolation } = require('../utils/databaseErrors');
const { normalizeKelasJenis, normalizeText, normalizeYearCode, nullableInt } = require('../utils/normalizers');

function registerTahunAjaranRoutes(app) {
  // ===== TAHUN AJARAN API =====
  app.get('/api/tahun-ajaran', async (req, res) => {
    try {
      const result = await db.query(`
        SELECT
          ta.*,
          COUNT(sta.id)::INTEGER AS jumlah_santri
        FROM tahun_ajaran ta
        LEFT JOIN santri_tahun_ajaran sta ON sta.tahun_ajaran_id = ta.id
        GROUP BY ta.id
        ORDER BY ta.tahun_mulai
      `);
      res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Gagal memuat tahun ajaran.' });
    }
  });
  
  app.get('/api/tahun-ajaran/active', async (req, res) => {
    try {
      const activeYear = await getActiveTahunAjaran();
      if (!activeYear) {
        return res.status(404).json({ error: 'Tahun ajaran berjalan belum disetel.' });
      }
      res.json(activeYear);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Gagal memuat tahun ajaran berjalan.' });
    }
  });
  
  app.get('/api/tahun-ajaran/:id/santri', async (req, res) => {
    const { id } = req.params;
  
    try {
      const result = await db.query(`
        SELECT
          s.id,
          s.orangtua_id,
          s.created_at,
          sta.id AS santri_tahun_ajaran_id,
          sta.tahun_ajaran_id,
          ta.kode AS tahun_ajaran,
          ta.is_active AS tahun_ajaran_aktif,
          sta.status AS status_tahun_ajaran,
          sta.catatan AS catatan_tahun_ajaran,
          sta.nis,
          sta.nik,
          sta.nama,
          sta.jenis_kelamin,
          sta.kelas_diniyah_id,
          sta.kelas_sekolah_id,
          sta.kamar_id,
          sta.tempat_lahir,
          sta.tanggal_lahir,
          sta.alamat,
          sta.nama_ayah,
          sta.nama_ibu,
          sta.pekerjaan_ayah,
          sta.pekerjaan_ibu,
          sta.no_hp_ayah,
          sta.no_hp_ibu,
          kd.nama AS nama_diniyah,
          ks.nama AS nama_sekolah,
          k.nama AS nama_kamar,
          k.gedung AS kamar_gedung,
          k.lantai AS kamar_lantai
        FROM santri_tahun_ajaran sta
        JOIN tahun_ajaran ta ON sta.tahun_ajaran_id = ta.id
        JOIN santri s ON sta.santri_id = s.id
        LEFT JOIN kelas kd ON sta.kelas_diniyah_id = kd.id
        LEFT JOIN kelas ks ON sta.kelas_sekolah_id = ks.id
        LEFT JOIN kamar k ON sta.kamar_id = k.id
        WHERE sta.tahun_ajaran_id = $1
        ORDER BY sta.nama
      `, [id]);
      res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Gagal memuat data santri tahun ajaran.' });
    }
  });
  
  app.post('/api/tahun-ajaran/migrate', async (req, res) => {
    const targetKode = normalizeYearCode(req.body.target_kode);
    const client = await db.pool.connect();
  
    try {
      await client.query('BEGIN');
  
      const source = await getActiveTahunAjaran(client);
      if (!source) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Tahun ajaran berjalan belum disetel.' });
      }
  
      const nextKode = targetKode || `${source.tahun_selesai}-${source.tahun_selesai + 1}`;
      const targetResult = await client.query('SELECT * FROM tahun_ajaran WHERE kode = $1', [nextKode]);
      if (!targetResult.rows.length) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: `Tahun ajaran ${nextKode} belum tersedia.` });
      }
  
      const target = targetResult.rows[0];
      if (target.id === source.id) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Target migrasi tidak boleh sama dengan tahun ajaran berjalan.' });
      }
  
      const copyResult = await client.query(`
        INSERT INTO santri_tahun_ajaran (
          tahun_ajaran_id, santri_id, kelas_diniyah_id, kelas_sekolah_id, kamar_id, status, catatan,
          nis, nik, nama, jenis_kelamin, tempat_lahir, tanggal_lahir, alamat,
          nama_ayah, nama_ibu, pekerjaan_ayah, pekerjaan_ibu, no_hp_ayah, no_hp_ibu
        )
        SELECT
          $2, sta.santri_id, sta.kelas_diniyah_id, sta.kelas_sekolah_id, sta.kamar_id,
          'aktif',
          CONCAT('Migrasi dari ', $3, '. Review kelas jika ada santri tidak naik.'),
          sta.nis, sta.nik, sta.nama, sta.jenis_kelamin, sta.tempat_lahir, sta.tanggal_lahir, sta.alamat,
          sta.nama_ayah, sta.nama_ibu, sta.pekerjaan_ayah, sta.pekerjaan_ibu, sta.no_hp_ayah, sta.no_hp_ibu
        FROM santri_tahun_ajaran sta
        WHERE sta.tahun_ajaran_id = $1
          AND sta.status IN ('aktif', 'draft', 'tidak_naik')
          AND NOT EXISTS (
            SELECT 1 FROM alumni a WHERE a.santri_id = sta.santri_id
          )
        ON CONFLICT (tahun_ajaran_id, santri_id) DO NOTHING
        RETURNING id
      `, [source.id, target.id, source.kode]);
  
      await client.query('UPDATE tahun_ajaran SET status = $1, is_active = FALSE WHERE id = $2', ['arsip', source.id]);
      await client.query('UPDATE tahun_ajaran SET status = $1, is_active = TRUE WHERE id = $2', ['berjalan', target.id]);
  
      await client.query('COMMIT');
      res.json({
        message: `Migrasi ke tahun ajaran ${target.kode} berhasil.`,
        source,
        target,
        migrated: copyResult.rowCount,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(error);
      res.status(500).json({ error: 'Gagal migrasi tahun ajaran.' });
    } finally {
      client.release();
    }
  });
}

module.exports = registerTahunAjaranRoutes;
