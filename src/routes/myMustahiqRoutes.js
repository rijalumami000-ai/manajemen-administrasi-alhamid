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

    let dashboardData = {
      user: {
        id: req.user.id,
        username: req.user.username,
        full_name: req.user.full_name,
        role: req.user.role
      },
      tahunAjaran: {
        id: activeYear.id,
        kode: activeYear.kode
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
        SELECT kta.kelas_id, k.nama AS kelas_nama
        FROM kelas_tahun_ajaran kta
        JOIN kelas k ON kta.kelas_id = k.id
        WHERE kta.mustahiq_id = $1 AND kta.tahun_ajaran_id = $2
      `, [guruId, activeYear.id]);

      if (mustahiqResult.rows.length > 0) {
        const kelasId = mustahiqResult.rows[0].kelas_id;
        dashboardData.kelasMustahiq = {
          id: kelasId,
          nama: mustahiqResult.rows[0].kelas_nama
        };

        // 3. Count total students in this class for the active year
        const countResult = await db.query(`
          SELECT COUNT(*) AS total
          FROM santri_tahun_ajaran
          WHERE kelas_diniyah_id = $1 AND tahun_ajaran_id = $2 AND status = 'aktif'
        `, [kelasId, activeYear.id]);
        
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
            WHEN j.malam = 'Malam Sabtu' THEN 1
            WHEN j.malam = 'Malam Minggu' THEN 2
            WHEN j.malam = 'Malam Senin' THEN 3
            WHEN j.malam = 'Malam Selasa' THEN 4
            WHEN j.malam = 'Malam Rabu' THEN 5
            WHEN j.malam = 'Malam Kamis' THEN 6
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
    const activeYear = await getActiveTahunAjaran();
    if (!activeYear) {
      return res.status(404).json({ error: 'Tahun ajaran aktif tidak ditemukan.' });
    }

    let kelasId = req.query.kelas_id ? parseInt(req.query.kelas_id, 10) : null;
    const guruId = req.user.guru_id;
    const forceClasses = req.query.force_classes === 'true';

    // If no class filter, try to fall back to the mustahiq class of this teacher
    if (!kelasId && guruId && !forceClasses) {
      const mustahiqResult = await db.query(`
        SELECT kelas_id FROM kelas_tahun_ajaran 
        WHERE mustahiq_id = $1 AND tahun_ajaran_id = $2
      `, [guruId, activeYear.id]);
      if (mustahiqResult.rows.length > 0) {
        kelasId = mustahiqResult.rows[0].kelas_id;
      }
    }

    // If still no class is found/specified, or if forceClasses is true, return the class list
    if (!kelasId || forceClasses) {
      const classesResult = await db.query(`
        SELECT DISTINCT k.id, k.nama 
        FROM kelas k
        JOIN kelas_tahun_ajaran kta ON kta.kelas_id = k.id
        WHERE kta.tahun_ajaran_id = $1
        ORDER BY k.nama
      `, [activeYear.id]);
      
      if (forceClasses) {
        return res.json({
          classes: classesResult.rows
        });
      }
      
      return res.json({
        requires_class_selection: true,
        classes: classesResult.rows
      });
    }

    // Get class details
    const classDetail = await db.query('SELECT id, nama FROM kelas WHERE id = $1', [kelasId]);
    if (classDetail.rows.length === 0) {
      return res.status(404).json({ error: 'Kelas tidak ditemukan.' });
    }

    // Fetch students in this class for the active year
    const studentsResult = await db.query(`
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
      ORDER BY sta.nama
    `, [kelasId, activeYear.id]);

    res.json({
      kelas: classDetail.rows[0],
      tahunAjaran: activeYear.kode,
      santri: studentsResult.rows
    });
  }));

  /**
   * GET /api/my-mustahiq/santri/:id/detail
   * Returns a detailed profile of a student including grades (Muhafadzoh, Qiroatul Kitab, etc.), achievements, and violations.
   */
  router.get('/santri/:id/detail', asyncHandler(async (req, res) => {
    const santriId = parseInt(req.params.id, 10);
    const activeYear = await getActiveTahunAjaran();
    if (!activeYear) {
      return res.status(404).json({ error: 'Tahun ajaran aktif tidak ditemukan.' });
    }

    // 1. Fetch student snapshot for active academic year
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

    // 2. Fetch grades for active year
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
      WHERE n.santri_id = $1 AND n.tahun_ajaran_id = $2
      ORDER BY mp.nama, ke.nama
    `, [santriId, activeYear.id]);

    // Categorize grades (especially Muhafadzoh and Qiroatul Kitab under Opsi A)
    const grades = gradesResult.rows.map(g => {
      let type = 'Lainnya';
      if (g.mata_pelajaran_id === muhafadzohMapelId) {
        type = 'Muhafadzoh';
      } else if (g.mata_pelajaran_id === qiroatulMapelId) {
        type = 'Qiroatul Kitab';
      } else if (g.mapel_jenis === 'Taftisyul Kutub' || g.mata_pelajaran.toLowerCase().includes('taftisy')) {
        type = 'Taftisyul Kutub';
      } else if (g.kategori_jenis === 'Semester' || g.kategori_evaluasi.toLowerCase().includes('ujian')) {
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
    const activeTahunAjaran = await getActiveTahunAjaran();
    if (!activeTahunAjaran) {
      return res.status(404).json({ error: 'Tahun ajaran aktif tidak ditemukan.' });
    }

    const kelasId = req.query.kelas_id ? parseInt(req.query.kelas_id, 10) : null;
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
          WHEN j.malam = 'Malam Sabtu' THEN 1
          WHEN j.malam = 'Malam Minggu' THEN 2
          WHEN j.malam = 'Malam Senin' THEN 3
          WHEN j.malam = 'Malam Selasa' THEN 4
          WHEN j.malam = 'Malam Rabu' THEN 5
          WHEN j.malam = 'Malam Kamis' THEN 6
          WHEN j.malam = 'Malam Jumat' THEN 7
          ELSE 8
        END,
        j.jam_ke
    `, [kelasId, activeTahunAjaran.id]);

    res.json({
      kelas_id: kelasId,
      tahun_ajaran: activeTahunAjaran.kode,
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

  app.use('/api/my-mustahiq', router);
}

module.exports = registerMyMustahiqRoutes;
