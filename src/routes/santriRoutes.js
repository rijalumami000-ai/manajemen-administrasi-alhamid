const db = require('../../db');
const { getActiveTahunAjaran, syncSantriToActiveTahunAjaran, syncSantriToSpecificTahunAjaran } = require('../services/tahunAjaranService');
const { isUniqueViolation } = require('../utils/databaseErrors');
const { normalizeKelasJenis, normalizeText, normalizeYearCode, nullableInt, normalizeGender } = require('../utils/normalizers');
const multer = require('multer');
const santriExcelService = require('../services/santriExcelService');

const upload = multer({ storage: multer.memoryStorage() });


function registerSantriRoutes(app) {
  // ===== SANTRI API =====
  app.get('/api/santri', async (req, res) => {
    try {
      const { kelas_id, tahun_ajaran_id } = req.query;
      const params = [];
      let taJoin = 'JOIN tahun_ajaran ta ON ta.is_active = TRUE';
      let staJoin = 'LEFT JOIN santri_tahun_ajaran sta ON sta.santri_id = s.id AND sta.tahun_ajaran_id = ta.id';

      if (tahun_ajaran_id) {
        params.push(tahun_ajaran_id);
        taJoin = `JOIN tahun_ajaran ta ON ta.id = $${params.length}`;
        staJoin = `LEFT JOIN santri_tahun_ajaran sta ON sta.santri_id = s.id AND sta.tahun_ajaran_id = $${params.length}`;
      }

      let kelasWhere = '';
      if (kelas_id) {
        params.push(kelas_id);
        kelasWhere = `AND (COALESCE(sta.kelas_diniyah_id, s.kelas_diniyah_id) = $${params.length} OR COALESCE(sta.kelas_sekolah_id, s.kelas_sekolah_id) = $${params.length})`;
      }

      let alumniWhere = '';
      if (kelas_id || tahun_ajaran_id) {
        alumniWhere = `WHERE COALESCE(sta.status, 'aktif') IN ('aktif', 'draft', 'tidak_naik', 'lulus', 'alumni')`;
      } else {
        alumniWhere = `
          WHERE NOT EXISTS (
            SELECT 1 FROM alumni a WHERE a.santri_id = s.id OR a.nis = COALESCE(sta.nis, s.nis)
          )
            AND COALESCE(sta.status, 'aktif') IN ('aktif', 'draft', 'tidak_naik')
        `;
      }

      const result = await db.query(`
        SELECT
          s.id,
          s.foto_url,
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
          COALESCE(sta.no_hp_ayah, o.no_hp_ayah) AS no_hp_ayah,
          COALESCE(sta.no_hp_ibu, o.no_hp_ibu) AS no_hp_ibu,
          o.nik_ayah,
          o.nik_ibu,
          s.tahun_masuk,
          s.anak_ke,
          s.agama,
          s.status_keluarga,
          s.status_masuk,
          s.pesantren_sebelumnya,
          s.sekolah_asal_nama,
          s.sekolah_asal_alamat,
          s.diterima_kelas_madin,
          s.diterima_tanggal_madin,
          s.keluar_madin_tanggal,
          s.keluar_madin_status,
          s.keluar_pondok_tanggal,
          s.keluar_pondok_status,
          s.keluar_sekolah_tingkat,
          s.keluar_sekolah_tanggal,
          s.keluar_sekolah_status
        FROM santri s
        ${taJoin}
        ${staJoin}
        LEFT JOIN kelas kd ON COALESCE(sta.kelas_diniyah_id, s.kelas_diniyah_id) = kd.id
        LEFT JOIN kelas ks ON COALESCE(sta.kelas_sekolah_id, s.kelas_sekolah_id) = ks.id
        LEFT JOIN kamar k ON COALESCE(sta.kamar_id, s.kamar_id) = k.id
        LEFT JOIN orangtua o ON s.orangtua_id = o.id
        ${alumniWhere}
          ${kelasWhere}
        ORDER BY s.nama
      `, params);
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
        [nis, nik || null, nama, normalizeGender(jenis_kelamin), nullableInt(kelas_diniyah_id), nullableInt(kelas_sekolah_id), nullableInt(kamar_id), tempat_lahir || null, tanggal_lahir || null, alamat || null, orangtuaId]
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
        [nis, nik || null, nama, normalizeGender(jenis_kelamin), nullableInt(kelas_diniyah_id), nullableInt(kelas_sekolah_id), nullableInt(kamar_id), tempat_lahir || null, tanggal_lahir || null, alamat || null, orangtuaId, id]
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
      const parsedTahunAjaranId = Number(tahun_ajaran_id);
      if (!tahun_ajaran_id || isNaN(parsedTahunAjaranId) || parsedTahunAjaranId <= 0) {
        return res.status(400).json({ error: 'Tahun ajaran wajib dipilih dan harus valid.' });
      }

      const stats = await santriExcelService.importFromExcel(req.file.buffer, parsedTahunAjaranId);

      res.json(stats);
    } catch (error) {
      console.error('Import error:', error);
      res.status(500).json({ error: 'Gagal mengimpor data santri: ' + error.message });
    }
  });

  // ===== STATISTIK SISWA MADRASAH DINIYAH =====
  // ===== STATISTIK SISWA MADRASAH DINIYAH =====
  app.get('/api/santri/statistik-diniyah', async (req, res) => {
    try {
      let { tahun_ajaran_id, semester } = req.query;

      // 1. Ambil active_semester dari system_settings (Ganjil / Genap)
      const semSettingRes = await db.query("SELECT value FROM system_settings WHERE key = 'active_semester' LIMIT 1");
      const systemActiveSemester = semSettingRes.rows.length > 0 && semSettingRes.rows[0].value
        ? semSettingRes.rows[0].value
        : 'Ganjil';

      // 2. Ambil Tahun Ajaran Aktif
      const activeTaRes = await db.query('SELECT * FROM tahun_ajaran WHERE is_active = TRUE LIMIT 1');
      const activeTaRow = activeTaRes.rows[0] || null;

      let selectedTa = null;
      if (!tahun_ajaran_id) {
        if (activeTaRow) {
          selectedTa = activeTaRow;
          tahun_ajaran_id = selectedTa.id;
        } else {
          const firstTa = await db.query('SELECT * FROM tahun_ajaran ORDER BY id DESC LIMIT 1');
          if (firstTa.rows.length > 0) {
            selectedTa = firstTa.rows[0];
            tahun_ajaran_id = selectedTa.id;
          }
        }
      } else {
        const taRes = await db.query('SELECT * FROM tahun_ajaran WHERE id = $1', [tahun_ajaran_id]);
        if (taRes.rows.length > 0) {
          selectedTa = taRes.rows[0];
        }
      }

      if (!tahun_ajaran_id || !selectedTa) {
        return res.status(404).json({ error: 'Tahun ajaran belum tersedia.' });
      }

      const isCurrentActiveYear = activeTaRow && Number(activeTaRow.id) === Number(tahun_ajaran_id);

      // Status tiap semester pada tahun ajaran yang dipilih:
      // 'berjalan' | 'selesai' | 'akan_datang'
      let ganjilStatus = 'selesai';
      let genapStatus = 'selesai';

      if (isCurrentActiveYear) {
        if (systemActiveSemester.toLowerCase() === 'ganjil') {
          ganjilStatus = 'berjalan';
          genapStatus = 'akan_datang';
        } else {
          ganjilStatus = 'selesai';
          genapStatus = 'berjalan';
        }
      } else if (activeTaRow && selectedTa.tahun_mulai) {
        if (selectedTa.tahun_mulai > activeTaRow.tahun_mulai) {
          ganjilStatus = 'akan_datang';
          genapStatus = 'akan_datang';
        } else {
          ganjilStatus = 'selesai';
          genapStatus = 'selesai';
        }
      }

      // Filter query santri:
      // Realita: Jika saat ini di Semester Ganjil, Semester Genap belum berjalan (akan datang).
      // Data santri aktif di tahun ajaran aktif secara default mencerminkan Semester Ganjil.
      let semesterCondition = '';
      if (semester === 'ganjil') {
        semesterCondition = ganjilStatus === 'akan_datang' ? 'AND 1=0' : 'AND sta.aktif_ganjil = TRUE';
      } else if (semester === 'genap') {
        semesterCondition = genapStatus === 'akan_datang' ? 'AND 1=0' : 'AND sta.aktif_genap = TRUE';
      } else {
        // 'semua' atau default
        if (isCurrentActiveYear) {
          if (systemActiveSemester.toLowerCase() === 'ganjil') {
            semesterCondition = 'AND sta.aktif_ganjil = TRUE';
          } else {
            semesterCondition = 'AND sta.aktif_genap = TRUE';
          }
        } else if (ganjilStatus === 'akan_datang') {
          semesterCondition = 'AND 1=0';
        } else {
          semesterCondition = '';
        }
      }

      // Summary
      const summaryRes = await db.query(`
        SELECT
          COUNT(s.id)::int AS total,
          COUNT(CASE WHEN COALESCE(sta.jenis_kelamin, s.jenis_kelamin) IN ('L', 'Putra', 'Laki-laki') THEN 1 END)::int AS putra,
          COUNT(CASE WHEN COALESCE(sta.jenis_kelamin, s.jenis_kelamin) IN ('P', 'Putri', 'Perempuan') THEN 1 END)::int AS putri
        FROM santri s
        JOIN santri_tahun_ajaran sta ON sta.santri_id = s.id AND sta.tahun_ajaran_id = $1
        WHERE COALESCE(sta.kelas_diniyah_id, s.kelas_diniyah_id) IS NOT NULL
          AND COALESCE(sta.status, 'aktif') IN ('aktif', 'draft', 'tidak_naik', 'lulus', 'alumni')
          ${semesterCondition}
      `, [tahun_ajaran_id]);

      // Hitung santri per semester (Ganjil & Genap) pada tahun ajaran ini
      const semCountsRes = await db.query(`
        SELECT
          COUNT(CASE WHEN sta.aktif_ganjil = TRUE THEN 1 END)::int AS total_ganjil,
          COUNT(CASE WHEN sta.aktif_genap = TRUE THEN 1 END)::int AS total_genap
        FROM santri s
        JOIN santri_tahun_ajaran sta ON sta.santri_id = s.id AND sta.tahun_ajaran_id = $1
        WHERE COALESCE(sta.kelas_diniyah_id, s.kelas_diniyah_id) IS NOT NULL
          AND COALESCE(sta.status, 'aktif') IN ('aktif', 'draft', 'tidak_naik', 'lulus', 'alumni')
      `, [tahun_ajaran_id]);

      const semCounts = semCountsRes.rows[0] || { total_ganjil: 0, total_genap: 0 };
      const summaryTotal = summaryRes.rows[0]?.total || 0;

      const summaryData = {
        total: summaryTotal,
        putra: summaryRes.rows[0]?.putra || 0,
        putri: summaryRes.rows[0]?.putri || 0,
        total_ganjil: ganjilStatus === 'akan_datang' ? 0 : semCounts.total_ganjil,
        total_genap: genapStatus === 'akan_datang' ? 0 : semCounts.total_genap,
        raw_total_genap: semCounts.total_genap,
        ganjil_status: ganjilStatus,
        genap_status: genapStatus
      };

      // Per Tingkat (Termasuk Tingkat SP yang dipisahkan secara khusus dari Tingkat 1)
      const tingkatRes = await db.query(`
        SELECT
          CASE WHEN k.nama = 'SP' THEN 99 ELSE k.tingkat END AS tingkat,
          CASE 
            WHEN k.nama = 'SP' THEN 'Tingkat SP'
            WHEN k.tingkat = 0 THEN 'Tingkat Sifir'
            ELSE CONCAT('Tingkat ', k.tingkat)
          END AS nama_tingkat,
          COUNT(s.id)::int AS total,
          COUNT(CASE WHEN s.id IS NOT NULL AND COALESCE(sta.jenis_kelamin, s.jenis_kelamin) IN ('L', 'Putra', 'Laki-laki') THEN 1 END)::int AS putra,
          COUNT(CASE WHEN s.id IS NOT NULL AND COALESCE(sta.jenis_kelamin, s.jenis_kelamin) IN ('P', 'Putri', 'Perempuan') THEN 1 END)::int AS putri
        FROM kelas k
        LEFT JOIN santri_tahun_ajaran sta ON sta.kelas_diniyah_id = k.id 
          AND sta.tahun_ajaran_id = $1 
          AND COALESCE(sta.status, 'aktif') IN ('aktif', 'draft', 'tidak_naik', 'lulus', 'alumni')
          ${semesterCondition}
        LEFT JOIN santri s ON s.id = sta.santri_id 
        WHERE k.jenis = 'Diniyah'
          AND (
            EXISTS (SELECT 1 FROM kelas_tahun_ajaran kta WHERE kta.kelas_id = k.id AND kta.tahun_ajaran_id = $1)
            OR EXISTS (SELECT 1 FROM santri_tahun_ajaran sta2 WHERE sta2.kelas_diniyah_id = k.id AND sta2.tahun_ajaran_id = $1)
          )
        GROUP BY 
          CASE WHEN k.nama = 'SP' THEN 99 ELSE k.tingkat END,
          CASE 
            WHEN k.nama = 'SP' THEN 'Tingkat SP'
            WHEN k.tingkat = 0 THEN 'Tingkat Sifir'
            ELSE CONCAT('Tingkat ', k.tingkat)
          END
        ORDER BY 
          CASE 
            WHEN (CASE WHEN k.nama = 'SP' THEN 99 ELSE k.tingkat END) = 0 THEN 0
            WHEN (CASE WHEN k.nama = 'SP' THEN 99 ELSE k.tingkat END) = 99 THEN 0.5
            ELSE (CASE WHEN k.nama = 'SP' THEN 99 ELSE k.tingkat END)
          END ASC
      `, [tahun_ajaran_id]);

      // Per Kelas
      const kelasRes = await db.query(`
        SELECT
          k.id AS kelas_id,
          k.nama AS nama_kelas,
          CASE WHEN k.nama = 'SP' THEN 99 ELSE k.tingkat END AS tingkat,
          COUNT(s.id)::int AS total,
          COUNT(CASE WHEN s.id IS NOT NULL AND COALESCE(sta.jenis_kelamin, s.jenis_kelamin) IN ('L', 'Putra', 'Laki-laki') THEN 1 END)::int AS putra,
          COUNT(CASE WHEN s.id IS NOT NULL AND COALESCE(sta.jenis_kelamin, s.jenis_kelamin) IN ('P', 'Putri', 'Perempuan') THEN 1 END)::int AS putri
        FROM kelas k
        LEFT JOIN santri_tahun_ajaran sta ON sta.kelas_diniyah_id = k.id 
          AND sta.tahun_ajaran_id = $1 
          AND COALESCE(sta.status, 'aktif') IN ('aktif', 'draft', 'tidak_naik', 'lulus', 'alumni')
          ${semesterCondition}
        LEFT JOIN santri s ON s.id = sta.santri_id 
        WHERE k.jenis = 'Diniyah'
          AND (
            EXISTS (SELECT 1 FROM kelas_tahun_ajaran kta WHERE kta.kelas_id = k.id AND kta.tahun_ajaran_id = $1)
            OR EXISTS (SELECT 1 FROM santri_tahun_ajaran sta2 WHERE sta2.kelas_diniyah_id = k.id AND sta2.tahun_ajaran_id = $1)
          )
        GROUP BY k.id, k.nama, k.tingkat
        ORDER BY 
          CASE 
            WHEN k.nama = 'SP' THEN 0.5
            WHEN k.tingkat = 0 THEN 0
            ELSE k.tingkat 
          END ASC, 
          k.nama ASC
      `, [tahun_ajaran_id]);

      // Tren Per Tahun Ajaran (Akurat & Valid: mencakup seluruh santri terdaftar di tahun ajaran tersebut)
      const trenRes = await db.query(`
        SELECT
          ta.id AS tahun_ajaran_id,
          ta.kode,
          ta.is_active,
          COUNT(s.id)::int AS total_diniyah,
          COUNT(CASE WHEN s.id IS NOT NULL AND COALESCE(sta.jenis_kelamin, s.jenis_kelamin) IN ('L', 'Putra', 'Laki-laki') THEN 1 END)::int AS putra,
          COUNT(CASE WHEN s.id IS NOT NULL AND COALESCE(sta.jenis_kelamin, s.jenis_kelamin) IN ('P', 'Putri', 'Perempuan') THEN 1 END)::int AS putri,
          COUNT(CASE WHEN s.id IS NOT NULL AND sta.aktif_ganjil = TRUE THEN 1 END)::int AS ganjil,
          COUNT(CASE WHEN s.id IS NOT NULL AND sta.aktif_genap = TRUE THEN 1 END)::int AS genap
        FROM tahun_ajaran ta
        LEFT JOIN santri_tahun_ajaran sta ON sta.tahun_ajaran_id = ta.id 
          AND sta.kelas_diniyah_id IS NOT NULL 
          AND COALESCE(sta.status, 'aktif') IN ('aktif', 'draft', 'tidak_naik', 'lulus', 'alumni')
        LEFT JOIN santri s ON s.id = sta.santri_id 
        WHERE EXISTS (
          SELECT 1 FROM santri_tahun_ajaran sta_chk 
          WHERE sta_chk.tahun_ajaran_id = ta.id AND sta_chk.kelas_diniyah_id IS NOT NULL
        ) OR ta.is_active = TRUE
        GROUP BY ta.id, ta.kode, ta.is_active, ta.tahun_mulai
        ORDER BY ta.tahun_mulai ASC
      `);

      res.json({
        tahun_ajaran: selectedTa,
        active_semester: systemActiveSemester,
        is_current_active_year: isCurrentActiveYear,
        semester_status: {
          ganjil: ganjilStatus,
          genap: genapStatus
        },
        semester: semester || 'semua',
        summary: summaryData,
        per_tingkat: tingkatRes.rows,
        per_kelas: kelasRes.rows,
        tren_tahun_ajaran: trenRes.rows
      });
    } catch (error) {
      console.error('Error fetching statistik diniyah:', error);
      res.status(500).json({ error: 'Gagal memuat statistik siswa madrasah diniyah.' });
    }
  });
}

module.exports = registerSantriRoutes;
