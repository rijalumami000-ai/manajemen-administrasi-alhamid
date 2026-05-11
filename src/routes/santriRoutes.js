const db = require('../../db');
const { getActiveTahunAjaran, syncSantriToActiveTahunAjaran, syncSantriToSpecificTahunAjaran } = require('../services/tahunAjaranService');
const { isUniqueViolation } = require('../utils/databaseErrors');
const { normalizeKelasJenis, normalizeText, normalizeYearCode, nullableInt } = require('../utils/normalizers');
const multer = require('multer');
const santriExcelService = require('../services/santriExcelService');

const upload = multer({ storage: multer.memoryStorage() });


function registerSantriRoutes(app) {
  // ===== SANTRI API =====
  app.get('/api/santri', async (req, res) => {
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
          COALESCE(sta.status, 'aktif') AS status_tahun_ajaran,
          sta.catatan AS catatan_tahun_ajaran,
          sta.aktif_ganjil,
          sta.aktif_genap,
          COALESCE(sta.nis, s.nis) AS nis,
          COALESCE(sta.nik, s.nik) AS nik,
          COALESCE(sta.nama, s.nama) AS nama,
          COALESCE(sta.jenis_kelamin, s.jenis_kelamin) AS jenis_kelamin,
          COALESCE(sta.kelas_diniyah_id, s.kelas_diniyah_id) AS kelas_diniyah_id,
          COALESCE(sta.kelas_sekolah_id, s.kelas_sekolah_id) AS kelas_sekolah_id,
          COALESCE(sta.kamar_id, s.kamar_id) AS kamar_id,
          COALESCE(sta.tempat_lahir, s.tempat_lahir) AS tempat_lahir,
          COALESCE(sta.tanggal_lahir, s.tanggal_lahir) AS tanggal_lahir,
          COALESCE(sta.alamat, s.alamat) AS alamat,
          kd.nama AS nama_diniyah,
          ks.nama AS nama_sekolah,
          k.nama AS nama_kamar,
          k.gedung AS kamar_gedung,
          k.lantai AS kamar_lantai,
          COALESCE(sta.nama_ayah, o.nama_ayah) AS nama_ayah,
          COALESCE(sta.nama_ibu, o.nama_ibu) AS nama_ibu,
          COALESCE(sta.pekerjaan_ayah, o.pekerjaan_ayah) AS pekerjaan_ayah,
          COALESCE(sta.pekerjaan_ibu, o.pekerjaan_ibu) AS pekerjaan_ibu,
          COALESCE(sta.no_hp_ayah, o.no_hp_ayah) AS no_hp_ayah,
          COALESCE(sta.no_hp_ibu, o.no_hp_ibu) AS no_hp_ibu
        FROM santri s
        JOIN tahun_ajaran ta ON ta.is_active = TRUE
        LEFT JOIN santri_tahun_ajaran sta ON sta.santri_id = s.id AND sta.tahun_ajaran_id = ta.id
        LEFT JOIN kelas kd ON COALESCE(sta.kelas_diniyah_id, s.kelas_diniyah_id) = kd.id
        LEFT JOIN kelas ks ON COALESCE(sta.kelas_sekolah_id, s.kelas_sekolah_id) = ks.id
        LEFT JOIN kamar k ON COALESCE(sta.kamar_id, s.kamar_id) = k.id
        LEFT JOIN orangtua o ON s.orangtua_id = o.id
        WHERE NOT EXISTS (
          SELECT 1 FROM alumni a WHERE a.santri_id = s.id
        )
          AND COALESCE(sta.status, 'aktif') IN ('aktif', 'draft', 'tidak_naik')
        ORDER BY s.nama
      `);
      res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Gagal memuat data santri.' });
    }
  });

  app.post('/api/santri', async (req, res) => {
    const {
      nis,
      nik,
      nama,
      jenis_kelamin,
      kelas_diniyah_id,
      kelas_sekolah_id,
      kamar_id,
      tempat_lahir,
      tanggal_lahir,
      alamat,
      nama_ayah,
      nama_ibu,
      pekerjaan_ayah,
      pekerjaan_ibu,
      no_hp_ayah,
      no_hp_ibu,
      status_tahun_ajaran,
      catatan_tahun_ajaran,
      tahun_ajaran_id, // Support adding to specific year
    } = req.body;

    console.log('📝 POST /api/santri - Received data:', {
      nis,
      nama,
      tahun_ajaran_id,
      tahun_ajaran_id_type: typeof tahun_ajaran_id
    });

    if (!nis || !nama) {
      return res.status(400).json({ error: 'NIS dan nama santri wajib diisi.' });
    }

    try {
      let orangtuaId = null;
      if (nama_ayah || nama_ibu) {
        const orangtuaResult = await db.query(
          `INSERT INTO orangtua (nama_ayah, nama_ibu, pekerjaan_ayah, pekerjaan_ibu, no_hp_ayah, no_hp_ibu)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [nama_ayah || null, nama_ibu || null, pekerjaan_ayah || null, pekerjaan_ibu || null, no_hp_ayah || null, no_hp_ibu || null]
        );
        orangtuaId = orangtuaResult.rows[0].id;
      }

      const result = await db.query(
        `INSERT INTO santri (nis, nik, nama, jenis_kelamin, kelas_diniyah_id, kelas_sekolah_id, kamar_id, tempat_lahir, tanggal_lahir, alamat, orangtua_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [nis, nik || null, nama, jenis_kelamin || null, nullableInt(kelas_diniyah_id), nullableInt(kelas_sekolah_id), nullableInt(kamar_id), tempat_lahir || null, tanggal_lahir || null, alamat || null, orangtuaId]
      );

      const santriId = result.rows[0].id;
      console.log('✅ Santri created with ID:', santriId);

      // If tahun_ajaran_id is provided, sync to that year, otherwise sync to active year
      if (tahun_ajaran_id) {
        console.log(`🔄 Syncing to specific tahun_ajaran_id: ${tahun_ajaran_id}`);
        await syncSantriToSpecificTahunAjaran(santriId, Number(tahun_ajaran_id), { status_tahun_ajaran, catatan_tahun_ajaran });
        console.log(`✅ Synced to tahun_ajaran_id: ${tahun_ajaran_id}`);
      } else {
        console.log('🔄 Syncing to active tahun ajaran');
        await syncSantriToActiveTahunAjaran(santriId, { status_tahun_ajaran, catatan_tahun_ajaran });
        console.log('✅ Synced to active tahun ajaran');
      }

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('❌ Error in POST /api/santri:', error);
      res.status(500).json({ error: 'Gagal menyimpan data santri.' });
    }
  });

  app.put('/api/santri/:id', async (req, res) => {
    const { id } = req.params;
    const {
      nis,
      nik,
      nama,
      jenis_kelamin,
      kelas_diniyah_id,
      kelas_sekolah_id,
      kamar_id,
      tempat_lahir,
      tanggal_lahir,
      alamat,
      nama_ayah,
      nama_ibu,
      pekerjaan_ayah,
      pekerjaan_ibu,
      no_hp_ayah,
      no_hp_ibu,
      status_tahun_ajaran,
      catatan_tahun_ajaran,
    } = req.body;

    if (!nis || !nama) {
      return res.status(400).json({ error: 'NIS dan nama santri wajib diisi.' });
    }

    try {
      const existing = await db.query('SELECT orangtua_id FROM santri WHERE id = $1', [id]);
      if (!existing.rows.length) {
        return res.status(404).json({ error: 'Santri tidak ditemukan.' });
      }

      let orangtuaId = existing.rows[0].orangtua_id;
      if (orangtuaId) {
        await db.query(
          `UPDATE orangtua SET nama_ayah = $1, nama_ibu = $2, pekerjaan_ayah = $3, pekerjaan_ibu = $4, no_hp_ayah = $5, no_hp_ibu = $6
           WHERE id = $7`,
          [nama_ayah || null, nama_ibu || null, pekerjaan_ayah || null, pekerjaan_ibu || null, no_hp_ayah || null, no_hp_ibu || null, orangtuaId]
        );
      } else if (nama_ayah || nama_ibu || pekerjaan_ayah || pekerjaan_ibu || no_hp_ayah || no_hp_ibu) {
        const orangtuaResult = await db.query(
          `INSERT INTO orangtua (nama_ayah, nama_ibu, pekerjaan_ayah, pekerjaan_ibu, no_hp_ayah, no_hp_ibu)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [nama_ayah || null, nama_ibu || null, pekerjaan_ayah || null, pekerjaan_ibu || null, no_hp_ayah || null, no_hp_ibu || null]
        );
        orangtuaId = orangtuaResult.rows[0].id;
      }

      const result = await db.query(
        `UPDATE santri SET nis = $1, nik = $2, nama = $3, jenis_kelamin = $4, kelas_diniyah_id = $5, kelas_sekolah_id = $6,
           kamar_id = $7, tempat_lahir = $8, tanggal_lahir = $9, alamat = $10, orangtua_id = $11
         WHERE id = $12 RETURNING *`,
        [nis, nik || null, nama, jenis_kelamin || null, nullableInt(kelas_diniyah_id), nullableInt(kelas_sekolah_id), nullableInt(kamar_id), tempat_lahir || null, tanggal_lahir || null, alamat || null, orangtuaId, id]
      );
      await syncSantriToActiveTahunAjaran(id, { status_tahun_ajaran, catatan_tahun_ajaran });

      res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Gagal memperbarui data santri.' });
    }
  });

  app.patch('/api/santri/:id/semester-status', async (req, res) => {
    const { id } = req.params;
    const { aktif_ganjil, aktif_genap, tahun_ajaran_id } = req.body;

    try {
      let yearId = tahun_ajaran_id;
      if (!yearId) {
        const activeYear = await getActiveTahunAjaran();
        if (!activeYear) {
          return res.status(400).json({ error: 'Tidak ada tahun ajaran aktif.' });
        }
        yearId = activeYear.id;
      }

      const result = await db.query(
        `UPDATE santri_tahun_ajaran 
         SET aktif_ganjil = COALESCE($1, aktif_ganjil),
             aktif_genap = COALESCE($2, aktif_genap)
         WHERE santri_id = $3 AND tahun_ajaran_id = $4
         RETURNING *`,
        [aktif_ganjil !== undefined ? aktif_ganjil : null, aktif_genap !== undefined ? aktif_genap : null, id, yearId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Data santri di tahun ajaran ini tidak ditemukan.' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Gagal memperbarui status semester.' });
    }
  });

  app.delete('/api/santri/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const existing = await db.query('SELECT orangtua_id FROM santri WHERE id = $1', [id]);
      if (!existing.rows.length) {
        return res.status(404).json({ error: 'Santri tidak ditemukan.' });
      }

      const orangtuaId = existing.rows[0].orangtua_id;
      await db.query('DELETE FROM santri WHERE id = $1', [id]);
      if (orangtuaId) {
        await db.query('DELETE FROM orangtua WHERE id = $1', [orangtuaId]);
      }

      res.json({ message: 'Data santri berhasil dihapus.' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Gagal menghapus data santri.' });
    }
  });

  // ===== IMPORT EXCEL =====
  app.post('/api/santri/import', upload.single('file'), async (req, res) => {
    try {
      const { tahun_ajaran_id } = req.body;
      if (!req.file) {
        return res.status(400).json({ error: 'File tidak ditemukan.' });
      }
      if (!tahun_ajaran_id) {
        return res.status(400).json({ error: 'Tahun ajaran wajib dipilih.' });
      }

      const stats = await santriExcelService.importFromExcel(req.file.buffer, Number(tahun_ajaran_id));
      res.json(stats);
    } catch (error) {
      console.error('Import error:', error);
      res.status(500).json({ error: 'Gagal mengimpor data santri: ' + error.message });
    }
  });
}

module.exports = registerSantriRoutes;
