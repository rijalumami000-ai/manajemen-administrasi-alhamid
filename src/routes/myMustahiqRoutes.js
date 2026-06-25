const express = require('express');
const db = require('../../db');
const { getActiveTahunAjaran } = require('../services/tahunAjaranService');
const { authenticateToken } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../utils/errorHandler');

function registerMyMustahiqRoutes(app) {
  const router = express.Router();

  // --- PUBLIC ENDPOINTS ---
  router.post('/login', asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username dan password wajib diisi.' });
    }

    // Cari guru berdasarkan username MyMustahiq atau NIP
    const result = await db.query(
      `SELECT id, nip, nama, no_hp, status, mymustahiq_username, mymustahiq_password 
       FROM guru 
       WHERE LOWER(mymustahiq_username) = LOWER($1) OR LOWER(nip) = LOWER($1)`,
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Username/NIP atau password salah.' });
    }

    const guru = result.rows[0];

    // Cek keaktifan guru
    if (guru.status && guru.status.toLowerCase() !== 'aktif') {
      return res.status(403).json({ error: 'Akses ditolak. Status guru tidak aktif.' });
    }

    // Cek apakah kredensial login MyMustahiq sudah dibuat
    if (!guru.mymustahiq_password) {
      return res.status(403).json({ error: 'Akses login MyMustahiq belum diaktifkan oleh Administrator.' });
    }

    // Bandingkan password menggunakan bcrypt
    const { comparePassword } = require('../utils/authUtils');
    const isMatch = await comparePassword(password, guru.mymustahiq_password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Username/NIP atau password salah.' });
    }

    // Buat JWT Token payload (gunakan guru_id untuk kompatibilitas endpoint)
    const { generateAccessToken, generateRefreshToken } = require('../utils/authUtils');
    const payload = {
      id: guru.id,
      guru_id: guru.id,
      username: guru.mymustahiq_username || guru.nip,
      full_name: guru.nama,
      role: 'guru'
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken({ id: guru.id, role: 'guru' });

    res.json({
      user: payload,
      accessToken,
      refreshToken
    });
  }));

  // All endpoints here require token authentication
  router.use(authenticateToken);

  /**
   * GET /api/my-mustahiq/dashboard
   * Returns teacher overview, homeroom class (if mustahiq), student stats, and teaching schedule.
   */
  router.get('/dashboard', asyncHandler(async (req, res) => {
    const guruId = req.user.guru_id;
    const activeYear = await getActiveTahunAjaran();

    if (!activeYear) {
      return res.status(404).json({ error: 'Tahun ajaran aktif tidak ditemukan.' });
    }

    const semResult = await db.query("SELECT value FROM system_settings WHERE key = 'active_semester' LIMIT 1");
    const activeSemester = semResult.rows[0] ? semResult.rows[0].value : 'Ganjil';

    let dashboardData = {
      user: {
        id: req.user.id,
        username: req.user.username,
        full_name: req.user.full_name,
        role: req.user.role
      },
      tahunAjaran: {
        id: activeYear.id,
        kode: activeYear.kode,
        semester: activeSemester
      },
      guruInfo: null,
      kelasMustahiq: null,
      totalSantriKelas: 0,
      jadwalMengajar: []
    };

    if (guruId) {
      // 1. Get teacher profile details
      const guruResult = await db.query(`
        SELECT g.id, g.nip, g.nama, g.no_hp, g.status, g.foto_url, j.nama AS jabatan
        FROM guru g
        LEFT JOIN jabatan j ON g.jabatan_id = j.id
        WHERE g.id = $1
      `, [guruId]);

      if (guruResult.rows.length > 0) {
        dashboardData.guruInfo = guruResult.rows[0];
      }

      // 2. Get homeroom class (kelas mustahiq) for active year
      const mustahiqResult = await db.query(`
        SELECT kta.kelas_id, k.nama AS kelas_nama, k.tingkat
        FROM kelas_tahun_ajaran kta
        JOIN kelas k ON kta.kelas_id = k.id
        WHERE kta.mustahiq_id = $1 AND kta.tahun_ajaran_id = $2
      `, [guruId, activeYear.id]);

      if (mustahiqResult.rows.length > 0) {
        const kelasId = mustahiqResult.rows[0].kelas_id;
        dashboardData.kelasMustahiq = {
          id: kelasId,
          nama: mustahiqResult.rows[0].kelas_nama,
          tingkat: mustahiqResult.rows[0].tingkat
        };

        // 3. Count total students in this class for the active year (filtered by active semester checklist)
        const isGenap = activeSemester.toLowerCase().includes('genap');
        let countQuery = `
          SELECT COUNT(*) AS total
          FROM santri_tahun_ajaran
          WHERE kelas_diniyah_id = $1 AND tahun_ajaran_id = $2 AND status = 'aktif'
        `;
        if (isGenap) {
          countQuery += ` AND aktif_genap = TRUE`;
        } else {
          countQuery += ` AND aktif_ganjil = TRUE`;
        }
        const countResult = await db.query(countQuery, [kelasId, activeYear.id]);
        
        dashboardData.totalSantriKelas = parseInt(countResult.rows[0].total, 10);
      }

      // 4. Get teacher's own teaching schedule
      const jadwalResult = await db.query(`
        SELECT 
          j.id,
          j.malam,
          j.jam_ke,
          k.nama AS kelas_nama,
          mp.nama AS mata_pelajaran_nama
        FROM jadwal_pelajaran_harian j
        JOIN kelas k ON j.kelas_id = k.id
        JOIN mata_pelajaran mp ON j.mata_pelajaran_id = mp.id
        WHERE j.guru_id = $1 AND j.tahun_ajaran_id = $2
        ORDER BY 
          CASE 
            WHEN j.malam = 'Malam Ahad' THEN 1
            WHEN j.malam = 'Malam Senin' THEN 2
            WHEN j.malam = 'Malam Selasa' THEN 3
            WHEN j.malam = 'Malam Rabu' THEN 4
            WHEN j.malam = 'Malam Kamis' THEN 5
            WHEN j.malam = 'Malam Sabtu' THEN 6
            WHEN j.malam = 'Malam Jumat' THEN 7
            ELSE 8
          END,
          j.jam_ke
      `, [guruId, activeYear.id]);

      dashboardData.jadwalMengajar = jadwalResult.rows;
    }

    res.json(dashboardData);
  }));

  /**
   * GET /api/my-mustahiq/santri
   * List students filtered by kelas_id.
   * If kelas_id is not provided, defaults to the teacher's mustahiq class, or returns all active classes list.
   */
  router.get('/santri', asyncHandler(async (req, res) => {
    const { kelas_id, tahun_ajaran_id, semester, force_classes } = req.query;

    const parsedTahunAjaranId = tahun_ajaran_id && tahun_ajaran_id !== 'null' && tahun_ajaran_id !== 'undefined' ? parseInt(tahun_ajaran_id, 10) : null;
    const activeYear = parsedTahunAjaranId
      ? (await db.query('SELECT id, kode FROM tahun_ajaran WHERE id = $1', [parsedTahunAjaranId])).rows[0]
      : await getActiveTahunAjaran();

    if (!activeYear) {
      return res.status(404).json({ error: 'Tahun ajaran tidak ditemukan.' });
    }

    const semResult = await db.query("SELECT value FROM system_settings WHERE key = 'active_semester' LIMIT 1");
    const activeSemester = semester || (semResult.rows[0] ? semResult.rows[0].value : 'Ganjil');

    let kelasId = kelas_id && kelas_id !== 'null' && kelas_id !== 'undefined' ? parseInt(kelas_id, 10) : null;
    const guruId = req.user.guru_id;
    const isForceClasses = force_classes === 'true';

    // If no class filter, try to fall back to the mustahiq class of this teacher
    if (!kelasId && guruId && !isForceClasses) {
      const mustahiqResult = await db.query(`
        SELECT kelas_id FROM kelas_tahun_ajaran 
        WHERE mustahiq_id = $1 AND tahun_ajaran_id = $2
      `, [guruId, activeYear.id]);
      if (mustahiqResult.rows.length > 0) {
        kelasId = mustahiqResult.rows[0].kelas_id;
      }
    }

    // If still no class is found/specified, or if isForceClasses is true, return the class list
    if (!kelasId || isForceClasses) {
      const classesResult = await db.query(`
        SELECT DISTINCT k.id, k.nama,
          CASE WHEN k.nama = 'SP' AND k.tingkat = 1 THEN 99 ELSE k.tingkat END AS tingkat,
          CASE 
            WHEN k.nama = 'SP' AND k.tingkat = 1 THEN 3
            WHEN k.tingkat = 0 THEN 1
            WHEN k.tingkat = 1 THEN 2
            WHEN k.tingkat = 99 THEN 3
            WHEN k.tingkat = 2 THEN 4
            WHEN k.tingkat = 3 THEN 5
            WHEN k.tingkat = 4 THEN 6
            WHEN k.tingkat = 5 THEN 7
            WHEN k.tingkat = 6 THEN 8
            ELSE 9
          END AS tingkat_order
        FROM kelas k
        JOIN kelas_tahun_ajaran kta ON kta.kelas_id = k.id
        WHERE kta.tahun_ajaran_id = $1 AND k.jenis = 'Diniyah'
        ORDER BY tingkat_order, k.nama
      `, [activeYear.id]);

      if (isForceClasses) {
        return res.json({
          tahunAjaran: activeYear.kode,
          tahunAjaranId: activeYear.id,
          semester: activeSemester,
          classes: classesResult.rows
        });
      }
      
      return res.json({
        requires_class_selection: true,
        tahunAjaran: activeYear.kode,
        tahunAjaranId: activeYear.id,
        semester: activeSemester,
        classes: classesResult.rows
      });
    }

    // Get class details
    const classDetail = await db.query('SELECT id, nama FROM kelas WHERE id = $1', [kelasId]);
    if (classDetail.rows.length === 0) {
      return res.status(404).json({ error: 'Kelas tidak ditemukan.' });
    }

    // Fetch students in this class for the selected year (filtered by active semester checklist)
    const isGenap = activeSemester.toLowerCase().includes('genap');
    let queryStr = `
      SELECT 
        sta.santri_id AS id, 
        sta.nis, 
        sta.nama, 
        sta.jenis_kelamin, 
        s.foto_url,
        k.nama AS kamar_nama
      FROM santri_tahun_ajaran sta
      JOIN santri s ON sta.santri_id = s.id
      LEFT JOIN kamar k ON sta.kamar_id = k.id
      WHERE sta.kelas_diniyah_id = $1 AND sta.tahun_ajaran_id = $2 AND sta.status = 'aktif'
    `;
    if (isGenap) {
      queryStr += ` AND sta.aktif_genap = TRUE`;
    } else {
      queryStr += ` AND sta.aktif_ganjil = TRUE`;
    }
    queryStr += ` ORDER BY sta.nama`;

    const studentsResult = await db.query(queryStr, [kelasId, activeYear.id]);

    res.json({
      kelas: classDetail.rows[0],
      tahunAjaran: activeYear.kode,
      tahunAjaranId: activeYear.id,
      semester: activeSemester,
      santri: studentsResult.rows
    });
  }));

  /**
   * GET /api/my-mustahiq/santri/:id/detail
   * Returns a detailed profile of a student including grades (Muhafadzoh, Qiroatul Kitab, etc.), achievements, and violations.
   */
  router.get('/santri/:id/detail', asyncHandler(async (req, res) => {
    const santriId = parseInt(req.params.id, 10);
    const { tahun_ajaran_id, semester } = req.query;

    const parsedTahunAjaranId = tahun_ajaran_id && tahun_ajaran_id !== 'null' && tahun_ajaran_id !== 'undefined' ? parseInt(tahun_ajaran_id, 10) : null;
    const activeYear = parsedTahunAjaranId
      ? (await db.query('SELECT id, kode FROM tahun_ajaran WHERE id = $1', [parsedTahunAjaranId])).rows[0]
      : await getActiveTahunAjaran();

    if (!activeYear) {
      return res.status(404).json({ error: 'Tahun ajaran tidak ditemukan.' });
    }

    const semResult = await db.query("SELECT value FROM system_settings WHERE key = 'active_semester' LIMIT 1");
    const activeSemester = semester || (semResult.rows[0] ? semResult.rows[0].value : 'Ganjil');

    // Dynamic category lookup (prevent hardcoded ID issue if DB IDs differ)
    const katResult = await db.query(
      "SELECT id FROM kategori_evaluasi WHERE LOWER(nama) LIKE $1 LIMIT 1",
      [`%semester ${activeSemester.toLowerCase()}%`]
    );
    const kategoriId = katResult.rows[0] ? katResult.rows[0].id : (activeSemester.toLowerCase().includes('genap') ? 2 : 1);

    // 1. Fetch student snapshot for selected academic year
    const profileResult = await db.query(`
      SELECT 
        sta.santri_id AS id,
        sta.nis,
        sta.nik,
        sta.nama,
        sta.jenis_kelamin,
        sta.tempat_lahir,
        sta.tanggal_lahir,
        sta.alamat,
        sta.status,
        sta.catatan,
        sta.nama_ayah,
        sta.nama_ibu,
        sta.no_hp_ayah,
        sta.no_hp_ibu,
        kd.nama AS kelas_diniyah,
        ks.nama AS kelas_sekolah,
        kam.nama AS kamar_nama,
        kam.gedung AS kamar_gedung,
        s.foto_url,
        kta.muhafadzoh_mapel_id,
        kta.qiroatul_mapel_id
      FROM santri_tahun_ajaran sta
      JOIN santri s ON sta.santri_id = s.id
      LEFT JOIN kelas kd ON sta.kelas_diniyah_id = kd.id
      LEFT JOIN kelas ks ON sta.kelas_sekolah_id = ks.id
      LEFT JOIN kamar kam ON sta.kamar_id = kam.id
      LEFT JOIN kelas_tahun_ajaran kta ON kta.kelas_id = sta.kelas_diniyah_id AND kta.tahun_ajaran_id = sta.tahun_ajaran_id
      WHERE sta.santri_id = $1 AND sta.tahun_ajaran_id = $2
    `, [santriId, activeYear.id]);

    if (profileResult.rows.length === 0) {
      return res.status(404).json({ error: 'Santri tidak ditemukan pada tahun ajaran ini.' });
    }

    const profile = profileResult.rows[0];

    // Extract mapping config
    const muhafadzohMapelId = profile.muhafadzoh_mapel_id;
    const qiroatulMapelId = profile.qiroatul_mapel_id;

    // 2. Fetch grades for selected year and semester (kategori_evaluasi_id)
    const gradesResult = await db.query(`
      SELECT 
        n.id,
        n.mata_pelajaran_id,
        mp.nama AS mata_pelajaran,
        mp.jenis AS mapel_jenis,
        ke.nama AS kategori_evaluasi,
        ke.jenis AS kategori_jenis,
        n.nilai_angka,
        n.predikat,
        n.capaian
      FROM nilai_santri n
      JOIN mata_pelajaran mp ON n.mata_pelajaran_id = mp.id
      JOIN kategori_evaluasi ke ON n.kategori_evaluasi_id = ke.id
      WHERE n.santri_id = $1 AND n.tahun_ajaran_id = $2 AND n.kategori_evaluasi_id = $3
      ORDER BY mp.nama, ke.nama
    `, [santriId, activeYear.id, kategoriId]);

    // Categorize grades (especially Muhafadzoh and Qiroatul Kitab under Opsi A)
    const grades = gradesResult.rows.map(g => {
      let type = 'Lainnya';
      if (g.mata_pelajaran_id === muhafadzohMapelId || g.mapel_jenis === 'Muhafadzoh') {
        type = 'Muhafadzoh';
      } else if (g.mata_pelajaran_id === qiroatulMapelId || g.mapel_jenis === 'Qiroah') {
        type = 'Qiroatul Kitab';
      } else if (g.mapel_jenis === 'Taftisyul Kutub' || (g.mata_pelajaran || '').toLowerCase().includes('taftisy') || g.mapel_jenis === 'Taftisy') {
        type = 'Taftisyul Kutub';
      } else if (g.kategori_jenis === 'Semester' || (g.kategori_evaluasi || '').toLowerCase().includes('ujian')) {
        type = 'Ujian Tulis';
      }

      return {
        ...g,
        tipe_kategori: type
      };
    });

    // 3. Fetch achievements
    const achievementsResult = await db.query(`
      SELECT id, jenis, tanggal, deskripsi, penghargaan 
      FROM prestasi 
      WHERE santri_id = $1 
      ORDER BY tanggal DESC
    `, [santriId]);

    // 4. Fetch violations
    const violationsResult = await db.query(`
      SELECT id, jenis, tanggal, deskripsi, sanksi 
      FROM pelanggaran 
      WHERE santri_id = $1 
      ORDER BY tanggal DESC
    `, [santriId]);

    res.json({
      tahunAjaran: activeYear.kode,
      tahunAjaranId: activeYear.id,
      semester: activeSemester,
      profile: {
        id: profile.id,
        nis: profile.nis,
        nik: profile.nik,
        nama: profile.nama,
        jenis_kelamin: profile.jenis_kelamin,
        tempat_lahir: profile.tempat_lahir,
        tanggal_lahir: profile.tanggal_lahir,
        alamat: profile.alamat,
        status: profile.status,
        catatan: profile.catatan,
        foto_url: profile.foto_url,
        kelas_diniyah: profile.kelas_diniyah,
        kelas_sekolah: profile.kelas_sekolah,
        kamar: profile.kamar_nama ? `${profile.kamar_nama} (${profile.kamar_gedung || ''})` : '-',
        orangtua: {
          nama_ayah: profile.nama_ayah || '-',
          nama_ibu: profile.nama_ibu || '-',
          no_hp_ayah: profile.no_hp_ayah || '-',
          no_hp_ibu: profile.no_hp_ibu || '-'
        }
      },
      nilai: grades,
      prestasi: achievementsResult.rows,
      pelanggaran: violationsResult.rows
    });
  }));

  /**
   * GET /api/my-mustahiq/jadwal
   * Returns daily schedule for a class or teacher
   */
  router.get('/jadwal', asyncHandler(async (req, res) => {
    const { kelas_id, tahun_ajaran_id, semester } = req.query;
    
    const parsedTahunAjaranId = tahun_ajaran_id && tahun_ajaran_id !== 'null' && tahun_ajaran_id !== 'undefined' ? parseInt(tahun_ajaran_id, 10) : null;
    const activeTahunAjaran = parsedTahunAjaranId
      ? (await db.query('SELECT id, kode FROM tahun_ajaran WHERE id = $1', [parsedTahunAjaranId])).rows[0]
      : await getActiveTahunAjaran();

    if (!activeTahunAjaran) {
      return res.status(404).json({ error: 'Tahun ajaran tidak ditemukan.' });
    }

    const kelasId = kelas_id && kelas_id !== 'null' && kelas_id !== 'undefined' ? parseInt(kelas_id, 10) : null;
    if (!kelasId) {
      return res.status(400).json({ error: 'Parameter kelas_id wajib disertakan.' });
    }

    const scheduleResult = await db.query(`
      SELECT 
        j.id,
        j.malam,
        j.jam_ke,
        mp.nama AS mata_pelajaran_nama,
        g.nama AS guru_nama
      FROM jadwal_pelajaran_harian j
      LEFT JOIN mata_pelajaran mp ON j.mata_pelajaran_id = mp.id
      LEFT JOIN guru g ON j.guru_id = g.id
      WHERE j.kelas_id = $1 AND j.tahun_ajaran_id = $2
      ORDER BY 
        CASE 
          WHEN j.malam = 'Malam Ahad' THEN 1
          WHEN j.malam = 'Malam Senin' THEN 2
          WHEN j.malam = 'Malam Selasa' THEN 3
          WHEN j.malam = 'Malam Rabu' THEN 4
          WHEN j.malam = 'Malam Kamis' THEN 5
          WHEN j.malam = 'Malam Sabtu' THEN 6
          WHEN j.malam = 'Malam Jumat' THEN 7
          ELSE 8
        END,
        j.jam_ke
    `, [kelasId, activeTahunAjaran.id]);

    const semResult = await db.query("SELECT value FROM system_settings WHERE key = 'active_semester' LIMIT 1");
    const activeSemester = semester || (semResult.rows[0] ? semResult.rows[0].value : 'Ganjil');

    res.json({
      kelas_id: kelasId,
      tahun_ajaran: activeTahunAjaran.kode,
      tahunAjaranId: activeTahunAjaran.id,
      semester: activeSemester,
      jadwal: scheduleResult.rows
    });
  }));

  /**
   * GET /api/my-mustahiq/struktur
   * Returns organizational structure based on type (madrasah_diniyah / panitia_ujian)
   */
  router.get('/struktur', asyncHandler(async (req, res) => {
    const tipe = req.query.tipe || 'madrasah_diniyah';
    if (tipe !== 'madrasah_diniyah' && tipe !== 'panitia_ujian') {
      return res.status(400).json({ error: 'Tipe struktur tidak valid. Gunakan: madrasah_diniyah atau panitia_ujian' });
    }

    const result = await db.query(`
      SELECT 
        s.id,
        s.tipe,
        s.jabatan,
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
    `, [tipe]);

    res.json(result.rows);
  }));

  /**
   * POST /api/my-mustahiq/change-password
   * Mengganti password ustadz saat ini (Authenticated).
   */
  router.post('/change-password', asyncHandler(async (req, res) => {
    const guruId = req.user.guru_id;
    const { oldPassword, newPassword } = req.body;

    if (!guruId) {
      return res.status(400).json({ error: 'Data guru tidak ditemukan dalam sesi Anda.' });
    }
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Password lama dan password baru wajib diisi.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password baru minimal 6 karakter.' });
    }

    // Ambil data guru dari database
    const result = await db.query(
      'SELECT mymustahiq_password FROM guru WHERE id = $1',
      [guruId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ustadz tidak ditemukan.' });
    }

    const currentHashed = result.rows[0].mymustahiq_password;
    if (!currentHashed) {
      return res.status(400).json({ error: 'Akun Anda belum diset passwordnya oleh Administrator.' });
    }

    // Bandingkan password lama
    const { comparePassword, hashPassword } = require('../utils/authUtils');
    const isMatch = await comparePassword(oldPassword, currentHashed);
    if (!isMatch) {
      return res.status(400).json({ error: 'Password lama yang Anda masukkan salah.' });
    }

    // Hash dan simpan password baru
    const newHashed = await hashPassword(newPassword);
    await db.query(
      'UPDATE guru SET mymustahiq_password = $1 WHERE id = $2',
      [newHashed, guruId]
    );

    res.json({ success: true, message: 'Password Anda berhasil diperbarui.' });
  }));

  /**
   * GET /api/my-mustahiq/admin/gurus
   * Get all teachers with their MyMustahiq username (Admin Only).
   */
  router.get('/admin/gurus', asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Akses ditolak. Hanya admin yang diperbolehkan.' });
    }

    const result = await db.query(`
      SELECT id, nip, nama, no_hp, status, mymustahiq_username 
      FROM guru
      ORDER BY nama
    `);

    res.json({ gurus: result.rows });
  }));

  /**
   * POST /api/my-mustahiq/admin/gurus/credentials
   * Update or set MyMustahiq credentials for a teacher (Admin Only).
   */
  router.post('/admin/gurus/credentials', asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Akses ditolak. Hanya admin yang diperbolehkan.' });
    }

    const { guruId, username, password } = req.body;
    if (!guruId) {
      return res.status(400).json({ error: 'guruId wajib disertakan.' });
    }

    // 1. If deleting credentials (removing access)
    if (!username) {
      await db.query(
        'UPDATE guru SET mymustahiq_username = NULL, mymustahiq_password = NULL WHERE id = $1',
        [guruId]
      );
      return res.json({ success: true, message: 'Akses MyMustahiq berhasil dinonaktifkan.' });
    }

    // 2. Check if username is already taken by another teacher
    const checkResult = await db.query(
      'SELECT id, nama FROM guru WHERE LOWER(mymustahiq_username) = LOWER($1) AND id != $2',
      [username, guruId]
    );
    if (checkResult.rows.length > 0) {
      return res.status(400).json({ error: `Username sudah digunakan oleh ustadz/guru lain (${checkResult.rows[0].nama}).` });
    }

    // 3. Update username and password (if provided)
    const { hashPassword } = require('../utils/authUtils');
    
    if (password) {
      const hashedPassword = await hashPassword(password);
      await db.query(
        'UPDATE guru SET mymustahiq_username = $1, mymustahiq_password = $2 WHERE id = $3',
        [username, hashedPassword, guruId]
      );
    } else {
      // Only update username, check if they already have a password
      const currentRes = await db.query('SELECT mymustahiq_password FROM guru WHERE id = $1', [guruId]);
      if (!currentRes.rows[0]?.mymustahiq_password) {
        return res.status(400).json({ error: 'Password wajib diisi untuk aktivasi akses pertama kali.' });
      }
      await db.query(
        'UPDATE guru SET mymustahiq_username = $1 WHERE id = $2',
        [username, guruId]
      );
    }

    res.json({ success: true, message: 'Kredensial login MyMustahiq berhasil diperbarui.' });
  }));

  /**
   * GET /api/my-mustahiq/mustahiq
   * Returns list of all Mustahiq (teachers with jabatan_id = 1)
   */
  router.get('/mustahiq', asyncHandler(async (req, res) => {
    const activeYear = await getActiveTahunAjaran();
    const result = await db.query(`
      SELECT 
        g.id, 
        g.nip, 
        g.nama, 
        g.no_hp, 
        g.alamat, 
        g.foto_url, 
        k.nama AS kelas_binaan
      FROM guru g
      LEFT JOIN kelas_tahun_ajaran kta ON kta.mustahiq_id = g.id AND kta.tahun_ajaran_id = $1
      LEFT JOIN kelas k ON kta.kelas_id = k.id
      WHERE g.jabatan_id = 1
      ORDER BY g.nama
    `, [activeYear ? activeYear.id : null]);

    const semResult = await db.query("SELECT value FROM system_settings WHERE key = 'active_semester' LIMIT 1");
    const activeSemester = semResult.rows[0] ? semResult.rows[0].value : 'Ganjil';

    res.json({ 
      tahunAjaran: activeYear ? activeYear.kode : '-',
      semester: activeSemester,
      mustahiq: result.rows 
    });
  }));

  /**
   * GET /api/my-mustahiq/munawib
   * Returns list of all Munawib (teachers with jabatan_id = 2)
   */
  router.get('/munawib', asyncHandler(async (req, res) => {
    const activeYear = await getActiveTahunAjaran();
    const result = await db.query(`
      SELECT 
        g.id, 
        g.nip, 
        g.nama, 
        g.no_hp, 
        g.alamat, 
        g.foto_url
      FROM guru g
      WHERE g.jabatan_id = 2
      ORDER BY g.nama
    `);

    const semResult = await db.query("SELECT value FROM system_settings WHERE key = 'active_semester' LIMIT 1");
    const activeSemester = semResult.rows[0] ? semResult.rows[0].value : 'Ganjil';

    res.json({ 
      tahunAjaran: activeYear ? activeYear.kode : '-',
      semester: activeSemester,
      munawib: result.rows 
    });
  }));

  /**
   * GET /api/my-mustahiq/tahun-ajaran
   * Returns list of all academic years for selector UI
   */
  router.get('/tahun-ajaran', asyncHandler(async (req, res) => {
    const result = await db.query(`
      SELECT id, kode, is_active, status
      FROM tahun_ajaran
      ORDER BY tahun_mulai DESC
    `);
    const semResult = await db.query("SELECT value FROM system_settings WHERE key = 'active_semester' LIMIT 1");
    const activeSemester = semResult.rows[0] ? semResult.rows[0].value : 'Ganjil';
    res.json({ tahunAjaran: result.rows, activeSemester });
  }));

  /**
   * GET /api/my-mustahiq/tim-soal/data
   * Returns classes + mata pelajaran per tingkat for tim soal form
   */
  router.get('/tim-soal/data', asyncHandler(async (req, res) => {
    const tahunAjaranId = req.query.tahun_ajaran_id;
    const parsedTahunAjaranId = tahunAjaranId && tahunAjaranId !== 'null' && tahunAjaranId !== 'undefined' ? parseInt(tahunAjaranId, 10) : null;
    const activeYear = parsedTahunAjaranId
      ? (await db.query('SELECT id, kode FROM tahun_ajaran WHERE id = $1', [parsedTahunAjaranId])).rows[0]
      : await getActiveTahunAjaran();
    
    if (!activeYear) return res.status(404).json({ error: 'Tahun ajaran tidak ditemukan.' });

    // Get classes for the academic year
    const classesResult = await db.query(`
      SELECT DISTINCT k.id, k.nama,
        CASE WHEN k.nama = 'SP' AND k.tingkat = 1 THEN 99 ELSE k.tingkat END AS tingkat,
        CASE 
          WHEN k.nama = 'SP' AND k.tingkat = 1 THEN 3
          WHEN k.tingkat = 0 THEN 1
          WHEN k.tingkat = 1 THEN 2
          WHEN k.tingkat = 99 THEN 3
          WHEN k.tingkat = 2 THEN 4
          WHEN k.tingkat = 3 THEN 5
          WHEN k.tingkat = 4 THEN 6
          WHEN k.tingkat = 5 THEN 7
          WHEN k.tingkat = 6 THEN 8
          ELSE 9
        END AS tingkat_order
      FROM kelas k
      JOIN kelas_tahun_ajaran kta ON kta.kelas_id = k.id
      WHERE kta.tahun_ajaran_id = $1 AND k.jenis = 'Diniyah'
      ORDER BY tingkat_order, k.nama
    `, [activeYear.id]);

    // Get subjects per tingkat from mapel_tingkat table (only Reguler subjects, excluding special exams)
    const mapelPerTingkatResult = await db.query(`
      SELECT DISTINCT mt.tingkat, mt.mata_pelajaran_id, mp.nama, mp.jenis
      FROM mapel_tingkat mt
      JOIN mata_pelajaran mp ON mp.id = mt.mata_pelajaran_id
      WHERE mp.jenis = 'Reguler'
      ORDER BY mt.tingkat, mp.nama
    `);

    // Group subjects by tingkat
    const mapelPerTingkat = {};
    mapelPerTingkatResult.rows.forEach(row => {
      const key = String(row.tingkat);
      if (!mapelPerTingkat[key]) {
        mapelPerTingkat[key] = [];
      }
      // Avoid duplicates
      if (!mapelPerTingkat[key].some(m => m.id === row.mata_pelajaran_id)) {
        mapelPerTingkat[key].push({
          id: row.mata_pelajaran_id,
          nama: row.nama,
          jenis: row.jenis
        });
      }
    });

    // Fallback: if Kelas SP (tingkat 99) has no subjects, copy from tingkat 2
    if (!mapelPerTingkat['99'] || mapelPerTingkat['99'].length === 0) {
      if (mapelPerTingkat['2'] && mapelPerTingkat['2'].length > 0) {
        mapelPerTingkat['99'] = [...mapelPerTingkat['2']];
      }
    }

    const semResult = await db.query("SELECT value FROM system_settings WHERE key = 'active_semester' LIMIT 1");
    const activeSemester = semResult.rows[0] ? semResult.rows[0].value : 'Ganjil';

    res.json({
      tahunAjaran: activeYear.kode,
      tahunAjaranId: activeYear.id,
      semester: activeSemester,
      classes: classesResult.rows,
      mapelPerTingkat: mapelPerTingkat
    });
  }));

  /**
   * GET /api/my-mustahiq/tim-soal/list
   * Returns list of soal created for a class/semester
   */
  router.get('/tim-soal/list', asyncHandler(async (req, res) => {
    const { kelas_id, semester, tahun_ajaran_id } = req.query;
    const parsedTahunAjaranId = tahun_ajaran_id && tahun_ajaran_id !== 'null' && tahun_ajaran_id !== 'undefined' ? parseInt(tahun_ajaran_id, 10) : null;
    const activeYear = parsedTahunAjaranId
      ? (await db.query('SELECT id, kode FROM tahun_ajaran WHERE id = $1', [parsedTahunAjaranId])).rows[0]
      : await getActiveTahunAjaran();

    if (!activeYear) return res.status(404).json({ error: 'Tahun ajaran tidak ditemukan.' });

    let tingkat = null;
    const kelasId = kelas_id && kelas_id !== 'null' && kelas_id !== 'undefined' ? parseInt(kelas_id, 10) : null;
    if (kelasId) {
      const kelasRes = await db.query('SELECT tingkat, nama FROM kelas WHERE id = $1', [kelasId]);
      if (kelasRes.rows.length > 0) {
        const row = kelasRes.rows[0];
        tingkat = (row.nama === 'SP' && row.tingkat === 1) ? 99 : row.tingkat;
      }
    }

    const conditions = ['l.tahun_ajaran_id = $1'];
    const params = [activeYear.id];
    let idx = 2;

    if (tingkat !== null) {
      conditions.push(`l.tingkat = $${idx++}`);
      params.push(tingkat);
    }
    if (semester) {
      conditions.push(`l.semester = $${idx++}`);
      params.push(semester);
    }

    const result = await db.query(`
      SELECT 
        l.id,
        l.pelajaran,
        l.judul,
        l.sub_judul,
        l.alamat,
        l.hari_tanggal,
        l.instruksi,
        l.soal,
        l.is_her,
        l.tingkat,
        l.semester,
        l.created_at,
        l.updated_at
      FROM lembar_ujian l
      WHERE ${conditions.join(' AND ')}
      ORDER BY l.updated_at DESC
    `, params);

    // Get all classes to resolve name and ID mappings
    const classesRes = await db.query(`
      SELECT id, nama, 
        CASE WHEN nama = 'SP' AND tingkat = 1 THEN 99 ELSE tingkat END AS tingkat 
      FROM kelas WHERE jenis = 'Diniyah'
    `);
    // Get all subjects
    const mapelRes = await db.query('SELECT id, nama FROM mata_pelajaran');

    const mapped = result.rows.map(row => {
      let questionsList = [];
      if (Array.isArray(row.soal)) {
        questionsList = row.soal.map((q, idx) => {
          const text = (typeof q === 'object' && q !== null) ? (q.teks || '') : q;
          return `${idx + 1}. ${text}`;
        });
      }
      const kontenSoal = questionsList.join('\n');

      const classMatch = classesRes.rows.find(c => c.tingkat === row.tingkat);
      const subjectMatch = mapelRes.rows.find(m => m.nama.toLowerCase() === row.pelajaran.toLowerCase());

      return {
        id: row.id,
        tingkat: row.tingkat,
        kelas_id: classMatch ? classMatch.id : null,
        kelas_nama: classMatch ? classMatch.nama : (row.tingkat === 99 ? 'Kelas SP' : `Tingkat ${row.tingkat}`),
        semester: row.semester || '-',
        mapel_id: subjectMatch ? subjectMatch.id : null,
        mapel_nama: subjectMatch ? subjectMatch.nama : row.pelajaran,
        tipe_ujian: row.is_her ? 'SOAL HER' : (row.judul || 'Ujian Semester'),
        is_her: row.is_her || false,
        konten_soal: kontenSoal,
        soal_array: Array.isArray(row.soal) ? row.soal : [],
        dibuat_oleh: 'Administrator',
        created_at: row.created_at,
        updated_at: row.updated_at
      };
    });

    res.json({ soal: mapped, tahunAjaran: activeYear.kode });
  }));

  /**
   * POST /api/my-mustahiq/tim-soal/simpan
   * Create or update a soal
   */
  router.post('/tim-soal/simpan', asyncHandler(async (req, res) => {
    const { id, kelas_id, mata_pelajaran_id, tahun_ajaran_id, semester, tipe_ujian, konten_soal } = req.body;
    
    if (!kelas_id || !mata_pelajaran_id || !semester || !konten_soal) {
      return res.status(400).json({ error: 'Data soal tidak lengkap. Kelas, mapel, semester, dan konten wajib diisi.' });
    }

    const parsedTahunAjaranId = tahun_ajaran_id ? parseInt(tahun_ajaran_id, 10) : null;
    const activeYear = parsedTahunAjaranId
      ? (await db.query('SELECT id, kode FROM tahun_ajaran WHERE id = $1', [parsedTahunAjaranId])).rows[0]
      : await getActiveTahunAjaran();

    if (!activeYear) return res.status(404).json({ error: 'Tahun ajaran tidak ditemukan.' });

    // 1. Get tingkat from kelas
    const kelasId = parseInt(kelas_id, 10);
    const kelasRes = await db.query('SELECT tingkat, nama FROM kelas WHERE id = $1', [kelasId]);
    if (kelasRes.rows.length === 0) return res.status(404).json({ error: 'Kelas tidak ditemukan.' });
    const row = kelasRes.rows[0];
    const tingkat = (row.nama === 'SP' && row.tingkat === 1) ? 99 : row.tingkat;

    // 2. Get pelajaran name from mata_pelajaran
    const mataPelajaranId = parseInt(mata_pelajaran_id, 10);
    const mapelRes = await db.query('SELECT nama FROM mata_pelajaran WHERE id = $1', [mataPelajaranId]);
    if (mapelRes.rows.length === 0) return res.status(404).json({ error: 'Mata pelajaran tidak ditemukan.' });
    const pelajaranName = mapelRes.rows[0].nama;

    // 3. Parse konten_soal or use soal_array
    let questionsArray = [];
    if (req.body.soal_array && Array.isArray(req.body.soal_array)) {
      questionsArray = req.body.soal_array.map(q => ({
        teks: (q.teks || '').trim(),
        jawaban: (q.jawaban || '').trim()
      })).filter(q => q.teks.length > 0);
    } else {
      const lines = (konten_soal || '').split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      questionsArray = lines.map(line => {
        let cleanTeks = line.replace(/^\d+[\.\)\-]\s*/, '')
                            .replace(/^[a-zA-Z][\.\)\-]\s*/, '')
                            .trim();
        return { teks: cleanTeks, jawaban: "" };
      });
    }

    const isHerValue = (tipe_ujian === 'SOAL HER');
    const judulValue = tipe_ujian || 'PENILAIAN AKHIR SEMESTER';

    if (id) {
      // Update
      await db.query(`
        UPDATE lembar_ujian
        SET tahun_ajaran_id=$1, semester=$2, tingkat=$3, pelajaran=$4, judul=$5, soal=$6, is_her=$7, updated_at=NOW()
        WHERE id=$8
      `, [activeYear.id, semester, tingkat, pelajaranName, judulValue, JSON.stringify(questionsArray), isHerValue, id]);
      
      return res.json({ success: true, message: 'Lembar ujian berhasil diperbarui.' });
    }

    // Insert new exam sheet
    const insertResult = await db.query(`
      INSERT INTO lembar_ujian (tahun_ajaran_id, semester, tingkat, pelajaran, judul, sub_judul, alamat, hari_tanggal, instruksi, soal, is_her, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING id
    `, [
      activeYear.id,
      semester,
      tingkat,
      pelajaranName,
      judulValue,
      'MADRASAH DINIYYAH AL-HAMID',
      'Cintamulya Candipuro Lampung Selatan',
      'Senin, 12 Desember 2026',
      'KERJAKAN URAIAN SOAL-SOAL DI BAWAH INI !',
      JSON.stringify(questionsArray),
      isHerValue
    ]);

    res.json({ success: true, message: 'Lembar ujian berhasil disimpan.', id: insertResult.rows[0].id });
  }));

  /**
   * DELETE /api/my-mustahiq/tim-soal/:id
   * Delete a soal
   */
  router.delete('/tim-soal/:id', asyncHandler(async (req, res) => {
    const soalId = parseInt(req.params.id, 10);
    await db.query('DELETE FROM lembar_ujian WHERE id = $1', [soalId]);
    res.json({ success: true, message: 'Lembar ujian berhasil dihapus.' });
  }));

  /**
   * GET /api/my-mustahiq/input-nilai/santri
   * Returns santri list for a class and academic year (for grade entry)
   */
  router.get('/input-nilai/santri', asyncHandler(async (req, res) => {
    const { kelas_id, tahun_ajaran_id, semester } = req.query;

    const kelasId = kelas_id && kelas_id !== 'null' && kelas_id !== 'undefined' ? parseInt(kelas_id, 10) : null;
    if (!kelasId) return res.status(400).json({ error: 'kelas_id wajib disertakan.' });

    const parsedTahunAjaranId = tahun_ajaran_id && tahun_ajaran_id !== 'null' && tahun_ajaran_id !== 'undefined' ? parseInt(tahun_ajaran_id, 10) : null;
    const activeYear = parsedTahunAjaranId
      ? (await db.query('SELECT id, kode FROM tahun_ajaran WHERE id = $1', [parsedTahunAjaranId])).rows[0]
      : await getActiveTahunAjaran();

    if (!activeYear) return res.status(404).json({ error: 'Tahun ajaran tidak ditemukan.' });

    const semResult = await db.query("SELECT value FROM system_settings WHERE key = 'active_semester' LIMIT 1");
    const activeSemester = semester || (semResult.rows[0] ? semResult.rows[0].value : 'Ganjil');

    // Dynamic category lookup (prevent hardcoded ID issues if DB IDs differ)
    const katResult = await db.query(
      "SELECT id FROM kategori_evaluasi WHERE LOWER(nama) LIKE $1 LIMIT 1",
      [`%semester ${activeSemester.toLowerCase()}%`]
    );
    const kategoriId = katResult.rows[0] ? katResult.rows[0].id : (activeSemester.toLowerCase().includes('genap') ? 2 : 1);

    // Get students in this class (filtered by active semester checklist)
    const isGenap = activeSemester.toLowerCase().includes('genap');
    let studentsQuery = `
      SELECT sta.santri_id AS id, sta.nama, sta.nis, s.foto_url, sta.jenis_kelamin
      FROM santri_tahun_ajaran sta
      JOIN santri s ON sta.santri_id = s.id
      WHERE sta.kelas_diniyah_id = $1 AND sta.tahun_ajaran_id = $2 AND sta.status = 'aktif'
    `;
    if (isGenap) {
      studentsQuery += ` AND sta.aktif_genap = TRUE`;
    } else {
      studentsQuery += ` AND sta.aktif_ganjil = TRUE`;
    }
    studentsQuery += ` ORDER BY sta.nama`;

    const studentsResult = await db.query(studentsQuery, [kelasId, activeYear.id]);

    const classDetail = await db.query(`
      SELECT id, nama, 
        CASE WHEN nama = 'SP' AND tingkat = 1 THEN 99 ELSE tingkat END AS tingkat 
      FROM kelas WHERE id = $1
    `, [kelasId]);
    const tingkat = classDetail.rows[0] ? classDetail.rows[0].tingkat : null;

    // Find Muhafadzoh Akbar, Qiroatul Kitab, and Taftisyul Kutub IDs dynamically
    const muhafadzohMapel = await db.query("SELECT id FROM mata_pelajaran WHERE jenis = 'Muhafadzoh' AND nama ILIKE '%akbar%' LIMIT 1");
    const qiroatulMapel = await db.query("SELECT id FROM mata_pelajaran WHERE jenis = 'Qiroah' AND nama ILIKE '%qiroah%' LIMIT 1");
    const taftisyMapel = await db.query("SELECT id FROM mata_pelajaran WHERE (jenis = 'Taftisy' OR jenis = 'Taftisyul Kutub' OR nama ILIKE '%taftisy%') LIMIT 1");
    
    const muhafadzohId = muhafadzohMapel.rows[0]?.id || 10;
    const qiroatulId = qiroatulMapel.rows[0]?.id || 11;
    const taftisyId = taftisyMapel.rows[0]?.id || 12;

    // Get mata pelajaran for this class from mapel_tingkat UNION jadwal_pelajaran_harian
    const mapelResult = await db.query(`
      SELECT DISTINCT mp.id, mp.nama, mp.jenis
      FROM mata_pelajaran mp
      WHERE mp.id IN (
        -- Dari mapel_tingkat
        SELECT mata_pelajaran_id 
        FROM mapel_tingkat 
        WHERE tingkat = $1 
          AND (tahun_ajaran_id = $2 OR tahun_ajaran_id IS NULL)
          AND (kategori_evaluasi_id = $3 OR kategori_evaluasi_id IS NULL)
        
        UNION
        
        -- Dari jadwal_pelajaran_harian
        SELECT mata_pelajaran_id 
        FROM jadwal_pelajaran_harian 
        WHERE kelas_id = $4 
          AND tahun_ajaran_id = $2
      )
      ORDER BY mp.nama
    `, [tingkat, activeYear.id, kategoriId, kelasId]);

    // Get existing grades for this class/semester
    const nilaiResult = await db.query(`
      SELECT n.santri_id, n.mata_pelajaran_id, n.nilai_angka, n.predikat, n.capaian, n.id
      FROM nilai_santri n
      JOIN santri_tahun_ajaran sta ON sta.santri_id = n.santri_id AND sta.tahun_ajaran_id = n.tahun_ajaran_id
      WHERE sta.kelas_diniyah_id = $1 AND n.tahun_ajaran_id = $2 AND n.kategori_evaluasi_id = $3
    `, [kelasId, activeYear.id, kategoriId]);

    // Build nilai map: santri_id -> mapel_id -> nilai
    const nilaiMap = {};
    for (const n of nilaiResult.rows) {
      if (!nilaiMap[n.santri_id]) nilaiMap[n.santri_id] = {};
      nilaiMap[n.santri_id][n.mata_pelajaran_id] = { nilai: n.nilai_angka, predikat: n.predikat, capaian: n.capaian, id: n.id };
    }

    const ktaResult = await db.query(`
      SELECT muhafadzoh_mapel_id, qiroatul_mapel_id
      FROM kelas_tahun_ajaran
      WHERE kelas_id = $1 AND tahun_ajaran_id = $2
      LIMIT 1
    `, [kelasId, activeYear.id]);

    const kelasConfig = ktaResult.rows[0] || {};

    // Fetch special subjects that might not be in mapelResult (Taftisyul Kutub, Muhafadzoh Akbar, Qiroatul Kitab)
    const specialSubjects = await db.query(`
      SELECT id, nama, jenis FROM mata_pelajaran 
      WHERE id IN ($1, $2, $3, $4, $5)
    `, [muhafadzohId, qiroatulId, taftisyId, kelasConfig.muhafadzoh_mapel_id || -1, kelasConfig.qiroatul_mapel_id || -1]);

    specialSubjects.rows.forEach(sm => {
      if (!mapelResult.rows.some(m => m.id === sm.id)) {
        mapelResult.rows.push(sm);
      }
    });

    // Attach konfigurasi setting_kriteria_nilai
    for (let i = 0; i < mapelResult.rows.length; i++) {
      let mapel = mapelResult.rows[i];
      let isTaftisy = mapel.jenis === 'Taftisy' || mapel.jenis === 'Taftisyul Kutub' || (mapel.nama || '').toLowerCase().includes('taftisy') || mapel.id === taftisyId;
      
      if (isTaftisy) {
        mapel.tipe_input = 'Teks';
        mapel.konfigurasi = [
          { bab: 'Tam', predikat: 'Tam' },
          { bab: 'Naqish', predikat: 'Naqish' }
        ];
      } else if (mapel.jenis === 'Muhafadzoh' || mapel.id === muhafadzohId) {
        // For Kelas SP (tingkat 99), use tingkat 2 config for Muhafadzoh
        const muhafadzohTingkat = tingkat === 99 ? 2 : tingkat;
        const setRes = await db.query(`
          SELECT tipe_input, konfigurasi
          FROM setting_kriteria_nilai
          WHERE (tahun_ajaran_id = $1 OR tahun_ajaran_id IS NULL) 
            AND (kategori_evaluasi_id = $2 OR kategori_evaluasi_id IS NULL) 
            AND (mata_pelajaran_id = $4 OR (mata_pelajaran_id IS NULL AND jenis_mapel = 'Muhafadzoh'))
            AND tingkat = $3 
          ORDER BY tahun_ajaran_id DESC NULLS LAST, kategori_evaluasi_id DESC NULLS LAST, mata_pelajaran_id NULLS LAST
          LIMIT 1
        `, [activeYear.id, kategoriId, muhafadzohTingkat, mapel.id]);
        if (setRes.rows.length > 0) {
          mapel.tipe_input = setRes.rows[0].tipe_input;
          mapel.konfigurasi = setRes.rows[0].konfigurasi;
        } else {
          mapel.tipe_input = 'Angka'; // default
        }
      } else {
        mapel.tipe_input = 'Angka';
      }
    }

    res.json({
      kelas: classDetail.rows[0],
      tahunAjaran: activeYear.kode,
      tahunAjaranId: activeYear.id,
      semester: activeSemester,
      kategoriEvaluasiId: kategoriId,
      muhafadzohMapelId: muhafadzohId,
      qiroatulMapelId: qiroatulId,
      santri: studentsResult.rows,
      mataPelajaran: mapelResult.rows,
      nilaiExisting: nilaiMap
    });
  }));

  /**
   * POST /api/my-mustahiq/input-nilai/simpan
   * Bulk save grades for santri
   */
  router.post('/input-nilai/simpan', asyncHandler(async (req, res) => {
    const { tahun_ajaran_id, kategori_evaluasi_id, data } = req.body;
    // data: array of { santri_id, mata_pelajaran_id, nilai_angka, predikat, capaian }
    
    if (!tahun_ajaran_id || !kategori_evaluasi_id || !data || !Array.isArray(data)) {
      return res.status(400).json({ error: 'Data nilai tidak lengkap.' });
    }

    let saved = 0;
    for (const item of data) {
      const { santri_id, mata_pelajaran_id, nilai_angka, predikat, capaian } = item;
      if (!santri_id || !mata_pelajaran_id) continue;

      await db.query(`
        INSERT INTO nilai_santri (santri_id, mata_pelajaran_id, tahun_ajaran_id, kategori_evaluasi_id, nilai_angka, predikat, capaian)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (santri_id, mata_pelajaran_id, tahun_ajaran_id, kategori_evaluasi_id)
        DO UPDATE SET nilai_angka = EXCLUDED.nilai_angka, predikat = EXCLUDED.predikat, capaian = EXCLUDED.capaian, updated_at = NOW()
      `, [santri_id, mata_pelajaran_id, tahun_ajaran_id, kategori_evaluasi_id, nilai_angka || null, predikat || null, capaian || null]);
      saved++;
    }

    res.json({ success: true, message: `${saved} nilai berhasil disimpan.`, saved });
  }));

  // === BUKU INDUK: GET DATA ===
  router.get('/buku-induk', asyncHandler(async (req, res) => {
    const { jenis_kelamin, search } = req.query;
    let whereClause = [];
    let params = [];

    if (jenis_kelamin) {
      params.push(jenis_kelamin);
      whereClause.push(`s.jenis_kelamin = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      whereClause.push(`(s.nama ILIKE $${params.length} OR s.nis ILIKE $${params.length})`);
    }

    const where = whereClause.length ? `WHERE ${whereClause.join(' AND ')}` : '';

    const result = await db.query(`
      SELECT
        s.id, s.nis, s.nama, s.jenis_kelamin,
        s.tahun_masuk, s.foto_url,
        kd.nama AS kelas_diniyah,
        ks.nama AS kelas_sekolah,
        km.nama AS nama_kamar,
        CASE WHEN sfd.santri_id IS NOT NULL THEN TRUE ELSE FALSE END AS is_face_registered,
        s.qr_code, s.nfc_uid, s.fingerprint_id
      FROM santri s
      LEFT JOIN kelas kd ON s.kelas_diniyah_id = kd.id
      LEFT JOIN kelas ks ON s.kelas_sekolah_id = ks.id
      LEFT JOIN kamar km ON s.kamar_id = km.id
      LEFT JOIN santri_face_data sfd ON s.id = sfd.santri_id
      ${where}
      ORDER BY s.tahun_masuk DESC NULLS LAST, s.nama ASC
    `, params);

    res.json(result.rows);
  }));

  // === NOTIFICATIONS: GET LIST ===
  router.get('/notifications', asyncHandler(async (req, res) => {
    const guruId = req.user.guru_id;
    const result = await db.query(`
      SELECT id, title, body, category, is_read, created_at
      FROM notifications
      WHERE guru_id = $1 AND COALESCE(category, '') != 'Chat'
      ORDER BY created_at DESC
      LIMIT 50
    `, [guruId]);
    res.json(result.rows);
  }));

  // === NOTIFICATIONS: MARK ALL AS READ ===
  router.post('/notifications/read-all', asyncHandler(async (req, res) => {
    const guruId = req.user.guru_id;
    await db.query(`
      UPDATE notifications
      SET is_read = TRUE
      WHERE guru_id = $1
    `, [guruId]);
    res.json({ success: true, message: 'Semua notifikasi ditandai dibaca.' });
  }));

  // === NOTIFICATIONS: MARK SINGLE AS READ ===
  router.post('/notifications/read/:id', asyncHandler(async (req, res) => {
    const guruId = req.user.guru_id;
    const notifId = parseInt(req.params.id, 10);
    if (isNaN(notifId)) return res.status(400).json({ error: 'ID notifikasi tidak valid.' });

    await db.query(`
      UPDATE notifications
      SET is_read = TRUE
      WHERE id = $1 AND guru_id = $2
    `, [notifId, guruId]);
    res.json({ success: true, message: 'Notifikasi ditandai dibaca.' });
  }));

  // === NOTIFICATIONS: CLEAR ALL ===
  router.delete('/notifications/clear-all', asyncHandler(async (req, res) => {
    const guruId = req.user.guru_id;
    await db.query(`
      DELETE FROM notifications
      WHERE guru_id = $1
    `, [guruId]);
    res.json({ success: true, message: 'Semua riwayat notifikasi berhasil dihapus.' });
  }));

  // === NOTIFICATIONS: DELETE SINGLE ===
  router.delete('/notifications/:id', asyncHandler(async (req, res) => {
    const guruId = req.user.guru_id;
    const notifId = parseInt(req.params.id, 10);
    if (isNaN(notifId)) return res.status(400).json({ error: 'ID notifikasi tidak valid.' });

    await db.query(`
      DELETE FROM notifications
      WHERE id = $1 AND guru_id = $2
    `, [notifId, guruId]);
    res.json({ success: true, message: 'Notifikasi berhasil dihapus.' });
  }));

  // === FCM TOKEN: REGISTER/UPDATE ===
  router.post('/register-fcm', asyncHandler(async (req, res) => {
    const guruId = req.user.guru_id;
    const { token, deviceInfo } = req.body;
    if (!token) return res.status(400).json({ error: 'Token FCM wajib disertakan.' });

    await db.query(`
      INSERT INTO fcm_tokens (guru_id, token, device_info, updated_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (token) 
      DO UPDATE SET guru_id = EXCLUDED.guru_id, device_info = EXCLUDED.device_info, updated_at = NOW()
    `, [guruId, token, deviceInfo || null]);

    res.json({ success: true, message: 'Token FCM berhasil didaftarkan.' });
  }));

  // === KOTAK SARAN: SUBMIT SUGGESTION ===
  router.post('/suggestions', asyncHandler(async (req, res) => {
    const guruId = req.user.guru_id;
    const { suggestion } = req.body;
    if (!suggestion || suggestion.trim() === '') {
      return res.status(400).json({ error: 'Isi saran tidak boleh kosong.' });
    }

    const activeYear = await getActiveTahunAjaran();
    let classId = null;

    if (activeYear) {
      const classRes = await db.query(`
        SELECT kelas_id 
        FROM kelas_tahun_ajaran 
        WHERE mustahiq_id = $1 AND tahun_ajaran_id = $2
        LIMIT 1
      `, [guruId, activeYear.id]);
      if (classRes.rows.length > 0) {
        classId = classRes.rows[0].kelas_id;
      }
    }

    await db.query(`
      INSERT INTO saran_aplikasi (guru_id, kelas_id, isi_saran)
      VALUES ($1, $2, $3)
    `, [guruId, classId, suggestion]);

    res.json({ success: true, message: 'Terima kasih! Saran Anda berhasil dikirim.' });
  }));

  // === ADMIN: GET KOTAK SARAN ===
  router.get('/admin/suggestions', asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Akses ditolak. Hanya admin yang diperbolehkan.' });
    }

    const result = await db.query(`
      SELECT 
        sa.id,
        sa.isi_saran,
        sa.created_at,
        g.nama AS guru_nama,
        g.nip AS guru_nip,
        k.nama AS kelas_nama
      FROM saran_aplikasi sa
      LEFT JOIN guru g ON sa.guru_id = g.id
      LEFT JOIN kelas k ON sa.kelas_id = k.id
      ORDER BY sa.created_at DESC
    `);

    res.json({ suggestions: result.rows });
  }));

  // === ADMIN: PUSH NOTIFICATION MANUAL ===
  router.post('/admin/push-notification', asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Akses ditolak. Hanya admin yang diperbolehkan.' });
    }
    const { title, body, category, target } = req.body;
    if (!title || !body) {
      return res.status(400).json({ error: 'Judul dan isi notifikasi wajib diisi.' });
    }

    const { sendNotification } = require('../services/notificationService');
    const sendRes = await sendNotification({ title, body, category, target });
    
    if (sendRes.success) {
      res.json({ 
        success: true, 
        message: `Notifikasi berhasil diproses untuk ${sendRes.sentCount} guru.`,
        inAppOnly: sendRes.inAppOnly || false
      });
    } else {
      res.status(500).json({ error: sendRes.error || 'Gagal mengirimkan notifikasi.' });
    }
  }));

  // === ADMIN: TRIGGER SCHEDULED NOTIFICATION MANUAL ===
  router.post('/admin/trigger-scheduler', asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Akses ditolak. Hanya admin yang diperbolehkan.' });
    }
    const { sendDailySchedules } = require('../services/scheduler');
    try {
      await sendDailySchedules();
      res.json({ success: true, message: 'Notifikasi jadwal harian berhasil diproses dan dikirim ke seluruh ustadz terkait.' });
    } catch (err) {
      console.error('[Admin Trigger] Error executing daily schedules:', err);
      res.status(500).json({ error: err.message || 'Gagal memicu pengiriman notifikasi jadwal harian.' });
    }
  }));

  // === CHAT GROUPS: GET LIST OF ROOMS ===
  router.get('/chats/rooms', asyncHandler(async (req, res) => {
    const guruId = req.user.guru_id;
    const activeYear = await getActiveTahunAjaran();

    if (!activeYear) {
      return res.status(404).json({ error: 'Tahun ajaran aktif tidak ditemukan.' });
    }

    // Get levels where this guru is a Mustahiq
    const tingkatResult = await db.query(`
      SELECT DISTINCT k.tingkat
      FROM kelas_tahun_ajaran kta
      JOIN kelas k ON kta.kelas_id = k.id
      WHERE kta.mustahiq_id = $1 AND kta.tahun_ajaran_id = $2
    `, [guruId, activeYear.id]);

    const tingkats = tingkatResult.rows.map(r => r.tingkat);
    const tingkatRooms = [];

    for (const tingkat of tingkats) {
      const lastMsgResult = await db.query(`
        SELECT cm.message, g.nama AS sender_name, cm.created_at, cm.sender_id
        FROM chat_messages cm
        JOIN guru g ON cm.sender_id = g.id
        WHERE cm.tingkat_group = $1 AND cm.kelas_id IS NULL AND cm.tahun_ajaran_id = $2
          AND NOT ($3 = ANY(COALESCE(cm.deleted_by_guru_ids, '{}')))
        ORDER BY cm.created_at DESC
        LIMIT 1
      `, [tingkat, activeYear.id, guruId]);

      const lastMsg = lastMsgResult.rows.length > 0 ? {
        message: lastMsgResult.rows[0].message,
        sender_name: lastMsgResult.rows[0].sender_name,
        sender_id: lastMsgResult.rows[0].sender_id,
        created_at: lastMsgResult.rows[0].created_at
      } : null;

      tingkatRooms.push({
        kelas_id: -tingkat,
        roles: ['mustahiq'],
        kelas_nama: `Grup Mustahiq Tingkat ${tingkat}`,
        is_tingkat_group: true,
        tingkat: tingkat,
        mustahiq_foto_url: null,
        last_message: lastMsg
      });
    }

    const query = `
      WITH user_direct_mustahiq_classes AS (
        SELECT kta.kelas_id, k.tingkat
        FROM kelas_tahun_ajaran kta
        JOIN kelas k ON kta.kelas_id = k.id
        WHERE kta.mustahiq_id = $1 AND kta.tahun_ajaran_id = $2
      ),
      user_mustahiq_tingkats AS (
        SELECT DISTINCT tingkat FROM user_direct_mustahiq_classes
      ),
      user_classes_via_tingkat AS (
        SELECT kta.kelas_id, 'mustahiq' AS role
        FROM kelas_tahun_ajaran kta
        JOIN kelas k ON kta.kelas_id = k.id
        WHERE k.tingkat IN (SELECT tingkat FROM user_mustahiq_tingkats)
          AND kta.tahun_ajaran_id = $2
      ),
      user_classes_direct AS (
        SELECT kelas_id, 'mustahiq' AS role FROM user_direct_mustahiq_classes
        UNION ALL
        SELECT DISTINCT kelas_id, 'munawib' AS role
        FROM jadwal_pelajaran_harian
        WHERE guru_id = $1 AND tahun_ajaran_id = $2
      ),
      user_combined_classes AS (
        SELECT kelas_id, role FROM user_classes_via_tingkat
        UNION ALL
        SELECT kelas_id, role FROM user_classes_direct
      ),
      unique_classes AS (
        SELECT kelas_id, 
               ARRAY_AGG(DISTINCT role) as roles
        FROM user_combined_classes
        GROUP BY kelas_id
      )
      SELECT uc.kelas_id, 
             uc.roles, 
             k.nama AS kelas_nama,
             (
               SELECT g_must.foto_url 
               FROM kelas_tahun_ajaran kta_must
               JOIN guru g_must ON kta_must.mustahiq_id = g_must.id
               WHERE kta_must.kelas_id = uc.kelas_id AND kta_must.tahun_ajaran_id = $2
               LIMIT 1
             ) AS mustahiq_foto_url,
             (
               SELECT JSON_BUILD_OBJECT(
                 'message', cm.message,
                 'sender_name', g.nama,
                 'sender_id', cm.sender_id,
                 'created_at', cm.created_at
               )
               FROM chat_messages cm
               JOIN guru g ON cm.sender_id = g.id
               WHERE cm.kelas_id = uc.kelas_id 
                 AND cm.tahun_ajaran_id = $2
                 AND NOT ($1 = ANY(COALESCE(cm.deleted_by_guru_ids, '{}')))
               ORDER BY cm.created_at DESC
               LIMIT 1
             ) AS last_message
      FROM unique_classes uc
      JOIN kelas k ON uc.kelas_id = k.id
      ORDER BY k.nama;
    `;

    const result = await db.query(query, [guruId, activeYear.id]);
    const finalRooms = [...tingkatRooms, ...result.rows];
    res.json({
      tahun_ajaran_id: activeYear.id,
      tahun_ajaran_kode: activeYear.kode,
      rooms: finalRooms
    });
  }));

  // === CHAT GROUPS: GET MESSAGES IN ROOM ===
  router.get('/chats/rooms/:kelas_id/messages', asyncHandler(async (req, res) => {
    const guruId = req.user.guru_id;
    const kelasId = parseInt(req.params.kelas_id, 10);
    const activeYear = await getActiveTahunAjaran();

    if (isNaN(kelasId)) {
      return res.status(400).json({ error: 'ID kelas tidak valid.' });
    }
    if (!activeYear) {
      return res.status(404).json({ error: 'Tahun ajaran aktif tidak ditemukan.' });
    }

    if (kelasId < 0) {
      const tingkat = -kelasId;
      // Security check: Mustahiq of same tingkat
      const accessCheck = await db.query(`
        SELECT 1 FROM kelas_tahun_ajaran kta
        JOIN kelas k ON kta.kelas_id = k.id
        WHERE kta.mustahiq_id = $1 AND kta.tahun_ajaran_id = $2 AND k.tingkat = $3
        LIMIT 1
      `, [guruId, activeYear.id, tingkat]);

      if (accessCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Anda tidak memiliki akses ke ruang obrolan tingkat kelas ini.' });
      }

      const messagesResult = await db.query(`
        SELECT 
          cm.id,
          cm.kelas_id,
          cm.tahun_ajaran_id,
          cm.sender_id,
          g.nama AS sender_name,
          g.foto_url AS sender_foto_url,
          cm.message,
          cm.created_at
        FROM chat_messages cm
        JOIN guru g ON cm.sender_id = g.id
        WHERE cm.tingkat_group = $1 AND cm.kelas_id IS NULL
          AND cm.tahun_ajaran_id = $2
          AND NOT ($3 = ANY(COALESCE(cm.deleted_by_guru_ids, '{}')))
        ORDER BY cm.created_at ASC
        LIMIT 100
      `, [tingkat, activeYear.id, guruId]);

      return res.json(messagesResult.rows);
    }

    // Security check: Verify guru belongs to this class/room (Directly or same tingkat Mustahiq)
    const accessCheck = await db.query(`
      SELECT 1 FROM kelas_tahun_ajaran WHERE kelas_id = $1 AND mustahiq_id = $2 AND tahun_ajaran_id = $3
      UNION
      SELECT 1 FROM jadwal_pelajaran_harian WHERE kelas_id = $1 AND guru_id = $2 AND tahun_ajaran_id = $3
      UNION
      SELECT 1 
      FROM kelas_tahun_ajaran kta
      JOIN kelas k ON kta.kelas_id = k.id
      WHERE kta.mustahiq_id = $2 AND kta.tahun_ajaran_id = $3
        AND k.tingkat = (SELECT tingkat FROM kelas WHERE id = $1)
      LIMIT 1
    `, [kelasId, guruId, activeYear.id]);

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Anda tidak memiliki akses ke ruang obrolan kelas ini.' });
    }

    const messagesResult = await db.query(`
      SELECT 
        cm.id,
        cm.kelas_id,
        cm.tahun_ajaran_id,
        cm.sender_id,
        g.nama AS sender_name,
        g.foto_url AS sender_foto_url,
        cm.message,
        cm.created_at
      FROM chat_messages cm
      JOIN guru g ON cm.sender_id = g.id
      WHERE cm.kelas_id = $1 
        AND cm.tahun_ajaran_id = $2
        AND NOT ($3 = ANY(COALESCE(cm.deleted_by_guru_ids, '{}')))
      ORDER BY cm.created_at ASC
      LIMIT 100
    `, [kelasId, activeYear.id, guruId]);

    res.json(messagesResult.rows);
  }));

  // === CHAT GROUPS: POST MESSAGE ===
  router.post('/chats/rooms/:kelas_id/messages', asyncHandler(async (req, res) => {
    const guruId = req.user.guru_id;
    const kelasId = parseInt(req.params.kelas_id, 10);
    const { message } = req.body;
    const activeYear = await getActiveTahunAjaran();

    if (isNaN(kelasId)) {
      return res.status(400).json({ error: 'ID kelas tidak valid.' });
    }
    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Pesan tidak boleh kosong.' });
    }
    if (!activeYear) {
      return res.status(404).json({ error: 'Tahun ajaran aktif tidak ditemukan.' });
    }

    const senderName = req.user.full_name || 'Ustadz';

    if (kelasId < 0) {
      const tingkat = -kelasId;
      // Security check: Mustahiq of same tingkat
      const accessCheck = await db.query(`
        SELECT 1 FROM kelas_tahun_ajaran kta
        JOIN kelas k ON kta.kelas_id = k.id
        WHERE kta.mustahiq_id = $1 AND kta.tahun_ajaran_id = $2 AND k.tingkat = $3
        LIMIT 1
      `, [guruId, activeYear.id, tingkat]);

      if (accessCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Anda tidak memiliki akses ke ruang obrolan tingkat kelas ini.' });
      }

      // Insert message into tingkat_group
      const insertRes = await db.query(`
        INSERT INTO chat_messages (kelas_id, tingkat_group, tahun_ajaran_id, sender_id, message)
        VALUES (NULL, $1, $2, $3, $4)
        RETURNING id, created_at
      `, [tingkat, activeYear.id, guruId, message]);

      const msgObj = {
        id: insertRes.rows[0].id,
        kelas_id: kelasId,
        tahun_ajaran_id: activeYear.id,
        sender_id: guruId,
        sender_name: senderName,
        message: message,
        created_at: insertRes.rows[0].created_at
      };

      // Notify other Mustahiqs at same tingkat
      const otherGurusRes = await db.query(`
        SELECT DISTINCT kta.mustahiq_id AS guru_id
        FROM kelas_tahun_ajaran kta
        JOIN kelas k ON kta.kelas_id = k.id
        WHERE k.tingkat = $1 AND kta.tahun_ajaran_id = $2 
          AND kta.mustahiq_id IS NOT NULL AND kta.mustahiq_id != $3
      `, [tingkat, activeYear.id, guruId]);

      const { sendNotification } = require('../services/notificationService');
      const otherGurus = otherGurusRes.rows.map(r => r.guru_id);

      for (const targetId of otherGurus) {
        sendNotification({
          title: `Pesan baru di Grup Mustahiq Tingkat ${tingkat}`,
          body: `${senderName}: ${message}`,
          category: 'Chat',
          target: targetId
        }).catch(err => console.error('[FCM Chat Notification Error]', err));
      }

      return res.json({ success: true, message: msgObj });
    }

    // Security check: Verify guru belongs to this class/room (Directly or same tingkat Mustahiq)
    const accessCheck = await db.query(`
      SELECT 1 FROM kelas_tahun_ajaran WHERE kelas_id = $1 AND mustahiq_id = $2 AND tahun_ajaran_id = $3
      UNION
      SELECT 1 FROM jadwal_pelajaran_harian WHERE kelas_id = $1 AND guru_id = $2 AND tahun_ajaran_id = $3
      UNION
      SELECT 1 
      FROM kelas_tahun_ajaran kta
      JOIN kelas k ON kta.kelas_id = k.id
      WHERE kta.mustahiq_id = $2 AND kta.tahun_ajaran_id = $3
        AND k.tingkat = (SELECT tingkat FROM kelas WHERE id = $1)
      LIMIT 1
    `, [kelasId, guruId, activeYear.id]);

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Anda tidak memiliki akses ke ruang obrolan kelas ini.' });
    }

    // Insert message
    const insertRes = await db.query(`
      INSERT INTO chat_messages (kelas_id, tahun_ajaran_id, sender_id, message)
      VALUES ($1, $2, $3, $4)
      RETURNING id, created_at
    `, [kelasId, activeYear.id, guruId, message]);

    const msgObj = {
      id: insertRes.rows[0].id,
      kelas_id: kelasId,
      tahun_ajaran_id: activeYear.id,
      sender_id: guruId,
      sender_name: senderName,
      message: message,
      created_at: insertRes.rows[0].created_at
    };

    // Send FCM and in-app notification to all other class teachers
    const classRes = await db.query('SELECT nama FROM kelas WHERE id = $1', [kelasId]);
    const classNama = classRes.rows[0]?.nama || 'Obrolan Kelas';

    const otherGurusRes = await db.query(`
      SELECT DISTINCT guru_id 
      FROM (
        SELECT mustahiq_id AS guru_id FROM kelas_tahun_ajaran WHERE kelas_id = $1 AND tahun_ajaran_id = $2 AND mustahiq_id IS NOT NULL
        UNION
        SELECT guru_id FROM jadwal_pelajaran_harian WHERE kelas_id = $1 AND tahun_ajaran_id = $2 AND guru_id IS NOT NULL
        UNION
        SELECT kta_same.mustahiq_id AS guru_id
        FROM kelas_tahun_ajaran kta_same
        JOIN kelas k_same ON kta_same.kelas_id = k_same.id
        WHERE kta_same.tahun_ajaran_id = $2 AND kta_same.mustahiq_id IS NOT NULL
          AND k_same.tingkat = (SELECT tingkat FROM kelas WHERE id = $1)
      ) all_teachers
      WHERE guru_id != $3
    `, [kelasId, activeYear.id, guruId]);

    const { sendNotification } = require('../services/notificationService');
    const otherGurus = otherGurusRes.rows.map(r => r.guru_id);
    
    for (const targetId of otherGurus) {
      sendNotification({
        title: `Pesan baru di Kelas ${classNama}`,
        body: `${senderName}: ${message}`,
        category: 'Chat',
        target: targetId
      }).catch(err => console.error('[FCM Chat Notification Error]', err));
    }

    res.json({ success: true, message: msgObj });
  }));

  // === CHAT GROUPS: DELETE MESSAGE FOR SELF ===
  router.delete('/chats/messages/:message_id/delete-self', asyncHandler(async (req, res) => {
    const guruId = req.user.guru_id;
    const messageId = parseInt(req.params.message_id, 10);

    if (isNaN(messageId)) {
      return res.status(400).json({ error: 'ID pesan tidak valid.' });
    }

    const deleteRes = await db.query(`
      UPDATE chat_messages
      SET deleted_by_guru_ids = array_append(deleted_by_guru_ids, $1)
      WHERE id = $2 AND NOT ($1 = ANY(deleted_by_guru_ids))
      RETURNING id
    `, [guruId, messageId]);

    if (deleteRes.rows.length === 0) {
      return res.status(404).json({ error: 'Pesan tidak ditemukan atau sudah dihapus.' });
    }

    res.json({ success: true, message: 'Pesan berhasil dihapus untuk Anda.' });
  }));

  // === MUHAFADZOH SCORE RULES / GUIDELINES ===
  router.get('/muhafadzoh-info', asyncHandler(async (req, res) => {
    let { tahun_ajaran_id, semester } = req.query;

    const parsedTahunAjaranId = tahun_ajaran_id && tahun_ajaran_id !== 'null' && tahun_ajaran_id !== 'undefined' ? parseInt(tahun_ajaran_id, 10) : null;
    const activeYear = parsedTahunAjaranId
      ? (await db.query('SELECT id, kode FROM tahun_ajaran WHERE id = $1', [parsedTahunAjaranId])).rows[0]
      : await getActiveTahunAjaran();

    if (!activeYear) {
      return res.status(404).json({ error: 'Tahun ajaran tidak ditemukan.' });
    }

    const semResult = await db.query("SELECT value FROM system_settings WHERE key = 'active_semester' LIMIT 1");
    const activeSemester = semester || (semResult.rows[0] ? semResult.rows[0].value : 'Ganjil');

    // Dynamic category lookup
    const katResult = await db.query(
      "SELECT id FROM kategori_evaluasi WHERE LOWER(nama) LIKE $1 LIMIT 1",
      [`%semester ${activeSemester.toLowerCase()}%`]
    );
    const kategoriId = katResult.rows[0] ? katResult.rows[0].id : (activeSemester.toLowerCase().includes('genap') ? 2 : 1);

    const key = `muhafadzoh_info_${activeYear.id}_${kategoriId}`;
    const result = await db.query("SELECT value FROM system_settings WHERE key = $1 LIMIT 1", [key]);

    if (result.rows.length > 0) {
      return res.json(JSON.parse(result.rows[0].value));
    }

    // Check if requested year is active
    const activeYearRes = await db.query('SELECT id FROM tahun_ajaran WHERE is_active = true LIMIT 1');
    const activeYearId = activeYearRes.rows[0]?.id;

    if (activeYearId && Number(activeYear.id) === activeYearId) {
      // Default fallback
      const defaultData = [
        {
          kelas: "Sifir",
          kitab: "Lughotul ‘Arobiyah",
          mumtaz: "80",
          jayyid: "70-79",
          mutawasith: "60-69",
          rodi: "1-59"
        },
        {
          kelas: "Satu",
          kitab: "Jurumiyah Jawa",
          mumtaz: "171",
          jayyid: "160-170",
          mutawasith: "150-159",
          rodi: "1-149"
        },
        {
          kelas: "SP",
          kitab: "Matan Jurumiyah",
          mumtaz: "باب المخفوضات من الاسماء",
          jayyid: "باب Mفعول من اجله – باب Mفعول معه".replace(/M/g, "الم"), // "باب المفعول من اجله – باب المفعول معه"
          mutawasith: "باب لا – باب المنادي",
          rodi: "باب الكلام – باب الاستثناء"
        },
        {
          kelas: "Dua",
          kitab: "Matan Jurumiyah",
          mumtaz: "باب المخفوضات من الاسماء",
          jayyid: "باب Mفعول من اجله – باب Mفعول معه".replace(/M/g, "الم"), // "باب المفعول من اجله – باب المفعول معه"
          mutawasith: "باب لا – باب المنادي",
          rodi: "باب الكلام – باب الاستثناء"
        },
        {
          kelas: "Tiga",
          kitab: "Nadzom ‘Imrithi",
          mumtaz: "254",
          jayyid: "245 - 253",
          mutawasith: "235 - 244",
          rodi: "1 - 234"
        },
        {
          kelas: "Empat",
          kitab: "Nadzom Alfiyah",
          mumtaz: "350",
          jayyid: "300 - 349",
          mutawasith: "245 - 299",
          rodi: "1 - 244"
        },
        {
          kelas: "Lima",
          kitab: "Nadzom Alfiyah",
          mumtaz: "600",
          jayyid: "525 - 599",
          mutawasith: "450 - 524",
          rodi: "201 - 449"
        },
        {
          kelas: "Enam",
          kitab: "Nadzom Alfiyah",
          mumtaz: "1002",
          jayyid: "925 - 1001",
          mutawasith: "850 - 924",
          rodi: "601 - 849"
        }
      ];

      // Auto initialize database entry for active year
      await db.query(
        "INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2",
        [key, JSON.stringify(defaultData)]
      );

      return res.json(defaultData);
    }

    // Return empty array for non-active years
    res.json([]);
  }));

  // === QIROATUL KITAB MAQRO INFO ===
  router.get('/qiroah-maqro', asyncHandler(async (req, res) => {
    let { tahun_ajaran_id, semester } = req.query;

    const parsedTahunAjaranId = tahun_ajaran_id && tahun_ajaran_id !== 'null' && tahun_ajaran_id !== 'undefined' ? parseInt(tahun_ajaran_id, 10) : null;
    const activeYear = parsedTahunAjaranId
      ? (await db.query('SELECT id, kode FROM tahun_ajaran WHERE id = $1', [parsedTahunAjaranId])).rows[0]
      : await getActiveTahunAjaran();

    if (!activeYear) {
      return res.status(404).json({ error: 'Tahun ajaran tidak ditemukan.' });
    }

    const semResult = await db.query("SELECT value FROM system_settings WHERE key = 'active_semester' LIMIT 1");
    const activeSemester = semester || (semResult.rows[0] ? semResult.rows[0].value : 'Ganjil');

    // Dynamic category lookup
    const katResult = await db.query(
      "SELECT id FROM kategori_evaluasi WHERE LOWER(nama) LIKE $1 LIMIT 1",
      [`%semester ${activeSemester.toLowerCase()}%`]
    );
    const kategoriId = katResult.rows[0] ? katResult.rows[0].id : (activeSemester.toLowerCase().includes('genap') ? 2 : 1);

    const key = `qiroah_maqro_${activeYear.id}_${kategoriId}`;
    const result = await db.query("SELECT value FROM system_settings WHERE key = $1 LIMIT 1", [key]);

    if (result.rows.length > 0) {
      return res.json(JSON.parse(result.rows[0].value));
    }

    // Check if requested year is active
    const activeYearRes = await db.query('SELECT id FROM tahun_ajaran WHERE is_active = true LIMIT 1');
    const activeYearId = activeYearRes.rows[0]?.id;

    if (activeYearId && Number(activeYear.id) === activeYearId) {
      // Default fallback for Maqro Qiroatul Kitab
      const defaultData = [
        {
          kelas: "Sifir",
          maqro: [
            "س : ما ذا تقول في الجلوس للتشهد الأخير ج :",
            "س : ما ذا تقول setelah التشهد الأخير ج :".replace("setelah", "بعد") // "س : ما ذا تقول بعد التشهد الأخير ج :"
          ]
        },
        {
          kelas: "Satu",
          maqro: [
            "النجاسات",
            "الإستنجاء"
          ]
        },
        {
          kelas: "SP",
          maqro: [
            "فصل ينبش الميت",
            "الإستعانات",
            "الأموال التي telزم فيها الزكاة".replace("tel", "تل") // "الأموال التي تلزم فيها الزkاة"
          ]
        },
        {
          kelas: "Dua",
          maqro: [
            "فصل ومن معاصي القلب",
            "فصل ومن معاصي البطن",
            "فصل ومن معاصي العين"
          ]
        },
        {
          kelas: "Tiga",
          maqro: [
            "كتاب الفرائض والوصايا",
            "فصل والفروض المقدرة",
            "فصل ويجوز الوصية"
          ]
        },
        {
          kelas: "Empat",
          maqro: [
            "فصل في عدد mbilat الصلاة".replace("mbilat", "مبطلات"), // "فصل في عدد مبطلات الصلاة"
            "فصل والمتروك من الصلاة"
          ]
        },
        {
          kelas: "Lima",
          maqro: [
            "كتاب احكام الفرائض والوصايا",
            "فصل والفروض المقدرة",
            "فصل في احكام الوصية"
          ]
        },
        {
          kelas: "Enam",
          maqro: [
            "كتاب احكام الجnaيات".replace("na", "نا"), // "كتاب احكام الجنايات"
            "فصل في بيان الدية"
          ]
        }
      ];

      // Auto initialize database entry for active year
      await db.query(
        "INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2",
        [key, JSON.stringify(defaultData)]
      );

      return res.json(defaultData);
    }

    // Return empty array for non-active years
    res.json([]);
  }));

  // === TAFTISYUL KUTUB MATERI INFO ===
  router.get('/taftisy-materi', asyncHandler(async (req, res) => {
    let { tahun_ajaran_id, semester, kelas_id } = req.query;

    if (!kelas_id) {
      return res.status(400).json({ error: 'kelas_id wajib disertakan.' });
    }

    const parsedTahunAjaranId = tahun_ajaran_id && tahun_ajaran_id !== 'null' && tahun_ajaran_id !== 'undefined' ? parseInt(tahun_ajaran_id, 10) : null;
    const activeYear = parsedTahunAjaranId
      ? (await db.query('SELECT id, kode FROM tahun_ajaran WHERE id = $1', [parsedTahunAjaranId])).rows[0]
      : await getActiveTahunAjaran();

    if (!activeYear) {
      return res.status(404).json({ error: 'Tahun ajaran tidak ditemukan.' });
    }

    const semResult = await db.query("SELECT value FROM system_settings WHERE key = 'active_semester' LIMIT 1");
    const activeSemester = semester || (semResult.rows[0] ? semResult.rows[0].value : 'Ganjil');

    // Dynamic category lookup
    const katResult = await db.query(
      "SELECT id FROM kategori_evaluasi WHERE LOWER(nama) LIKE $1 LIMIT 1",
      [`%semester ${activeSemester.toLowerCase()}%`]
    );
    const kategoriId = katResult.rows[0] ? katResult.rows[0].id : (activeSemester.toLowerCase().includes('genap') ? 2 : 1);

    const key = `taftisy_materi_${activeYear.id}_${kategoriId}_${kelas_id}`;
    const result = await db.query("SELECT value FROM system_settings WHERE key = $1 LIMIT 1", [key]);

    if (result.rows.length > 0) {
      return res.json(JSON.parse(result.rows[0].value));
    }

    // Query the class information to get the tingkat
    const classRes = await db.query('SELECT nama, tingkat FROM kelas WHERE id = $1 LIMIT 1', [kelas_id]);
    const classInfo = classRes.rows[0];
    if (classInfo && classInfo.nama === 'SP' && classInfo.tingkat === 1) {
      classInfo.tingkat = 99;
    }

    let defaultData = [];
    if (classInfo) {
      // Query the regular subjects from mapel_tingkat for this tingkat, academic year, and category
      const mapelRes = await db.query(`
        SELECT DISTINCT mp.nama
        FROM mapel_tingkat mt
        JOIN mata_pelajaran mp ON mp.id = mt.mata_pelajaran_id
        WHERE mt.tingkat = $1
          AND (mt.tahun_ajaran_id = $2 OR mt.tahun_ajaran_id IS NULL)
          AND (mt.kategori_evaluasi_id = $3 OR mt.kategori_evaluasi_id IS NULL)
          AND mp.jenis = 'Reguler'
        ORDER BY mp.nama
      `, [classInfo.tingkat, activeYear.id, kategoriId]);

      defaultData = mapelRes.rows.map(row => ({
        pelajaran: row.nama,
        batas_awal: "",
        batas_akhir: "",
        halaman: ""
      }));
    }

    // Check if requested year is active
    const activeYearRes = await db.query('SELECT id FROM tahun_ajaran WHERE is_active = true LIMIT 1');
    const activeYearId = activeYearRes.rows[0]?.id;

    if (activeYearId && Number(activeYear.id) === activeYearId && defaultData.length > 0) {
      // Auto initialize database entry for active year
      await db.query(
        "INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2",
        [key, JSON.stringify(defaultData)]
      );
    }

    return res.json(defaultData);
  }));

  router.get('/materi-ujian-tulis', asyncHandler(async (req, res) => {
    const { kelas_id, semester, tahun_ajaran_id } = req.query;
    const parsedTahunAjaranId = tahun_ajaran_id && tahun_ajaran_id !== 'null' && tahun_ajaran_id !== 'undefined' ? parseInt(tahun_ajaran_id, 10) : null;
    const activeYear = parsedTahunAjaranId
      ? (await db.query('SELECT id, kode FROM tahun_ajaran WHERE id = $1', [parsedTahunAjaranId])).rows[0]
      : await getActiveTahunAjaran();

    if (!activeYear) return res.status(404).json({ error: 'Tahun ajaran tidak ditemukan.' });

    const semResult = await db.query("SELECT value FROM system_settings WHERE key = 'active_semester' LIMIT 1");
    const activeSemester = semester || (semResult.rows[0] ? semResult.rows[0].value : 'Ganjil');

    const katResult = await db.query(
      "SELECT id FROM kategori_evaluasi WHERE LOWER(nama) LIKE $1 LIMIT 1",
      [`%semester ${activeSemester.toLowerCase()}%`]
    );
    const kategoriId = katResult.rows[0] ? katResult.rows[0].id : (activeSemester.toLowerCase().includes('genap') ? 2 : 1);

    // Query the class information to get the tingkat
    const classRes = await db.query('SELECT nama, tingkat FROM kelas WHERE id = $1 LIMIT 1', [kelas_id]);
    const classInfo = classRes.rows[0];
    let tingkat = null;
    if (classInfo) {
      tingkat = classInfo.tingkat;
      if (classInfo.nama === 'SP' && classInfo.tingkat === 1) {
        tingkat = 99;
      }
    }

    if (tingkat === null) {
      return res.status(400).json({ error: 'Kelas tidak ditemukan atau tidak valid.' });
    }

    const key = `materi_ujian_tulis_${activeYear.id}_${kategoriId}_${tingkat}`;
    const result = await db.query("SELECT value FROM system_settings WHERE key = $1 LIMIT 1", [key]);

    if (result.rows.length > 0) {
      return res.json(JSON.parse(result.rows[0].value));
    }

    // Query the regular subjects from mapel_tingkat for this tingkat, academic year, and category
    const mapelRes = await db.query(`
      SELECT DISTINCT mp.nama
      FROM mapel_tingkat mt
      JOIN mata_pelajaran mp ON mp.id = mt.mata_pelajaran_id
      WHERE mt.tingkat = $1
        AND (mt.tahun_ajaran_id = $2 OR mt.tahun_ajaran_id IS NULL)
        AND (mt.kategori_evaluasi_id = $3 OR mt.kategori_evaluasi_id IS NULL)
        AND mp.jenis = 'Reguler'
      ORDER BY mp.nama
    `, [tingkat, activeYear.id, kategoriId]);

    const defaultData = mapelRes.rows.map(row => ({
      pelajaran: row.nama,
      batas_awal: "",
      batas_akhir: ""
    }));

    // Check if requested year is active
    const activeYearRes2 = await db.query('SELECT id FROM tahun_ajaran WHERE is_active = true LIMIT 1');
    const activeYearId2 = activeYearRes2.rows[0]?.id;

    if (activeYearId2 && Number(activeYear.id) === activeYearId2 && defaultData.length > 0) {
      // Auto initialize database entry for active year
      await db.query(
        "INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2",
        [key, JSON.stringify(defaultData)]
      );
    }

    return res.json(defaultData);
  }));

  app.use('/api/my-mustahiq', router);
}

module.exports = registerMyMustahiqRoutes;
