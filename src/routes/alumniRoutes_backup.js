const db = require('../../db');
const { getActiveTahunAjaran, syncSantriToActiveTahunAjaran } = require('../services/tahunAjaranService');
const { isUniqueViolation } = require('../utils/databaseErrors');
const { normalizeKelasJenis, normalizeText, normalizeYearCode, nullableInt } = require('../utils/normalizers');

function registerAlumniRoutes(app) {
  // ===== ALUMNI API =====
  app.get('/api/alumni/search', async (req, res) => {
    const { q, tahun } = req.query;
    try {
      let query = 'SELECT * FROM alumni WHERE 1=1';
      const params = [];
      
      if (q) {
        params.push(`%${q}%`);
        query += ` AND (nama ILIKE $${params.length} OR nis ILIKE $${params.length})`;
      }
      
      if (tahun) {
        params.push(parseInt(tahun, 10));
        query += ` AND tahun_lulus = $${params.length}`;
      }
      
      query += ' ORDER BY tahun_lulus DESC, nama';
      
      const result = await db.query(query, params);
      res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Gagal mencari data alumni.' });
    }
  });
  
  app.get('/api/alumni', async (req, res) => {
    try {
      const result = await db.query(`
        SELECT * FROM alumni
        ORDER BY tahun_lulus DESC, nama
      `);
      res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Gagal memuat data alumni.' });
    }
  });
  
  app.post('/api/alumni', async (req, res) => {
    const nis = normalizeText(req.body.nis);
    const nik = normalizeText(req.body.nik);
    const nama = normalizeText(req.body.nama);
    const tempat_lahir = normalizeText(req.body.tempat_lahir);
    const tanggal_lahir = req.body.tanggal_lahir || null;
    const tahun_masuk = req.body.tahun_masuk ? parseInt(req.body.tahun_masuk, 10) : null;
    const tahun_lulus = req.body.tahun_lulus ? parseInt(req.body.tahun_lulus, 10) : null;
    const kelas_terakhir = normalizeText(req.body.kelas_terakhir);
    const alamat = normalizeText(req.body.alamat);
    const no_hp = normalizeText(req.body.no_hp);
    const email = normalizeText(req.body.email);
    const pekerjaan = normalizeText(req.body.pekerjaan);
    const status_pernikahan = normalizeText(req.body.status_pernikahan);
    const alamat_sekarang = normalizeText(req.body.alamat_sekarang);
    const instansi = normalizeText(req.body.instansi);
    const prestasi_utama = normalizeText(req.body.prestasi_utama);
    const keterangan = normalizeText(req.body.keterangan);
  
    if (!nis || !nama || !tahun_lulus) {
      return res.status(400).json({ error: 'NIS, nama, dan tahun lulus wajib diisi.' });
    }
  
    try {
      const result = await db.query(
        `INSERT INTO alumni (nis, nik, nama, tempat_lahir, tanggal_lahir, tahun_masuk, tahun_lulus, 
         kelas_terakhir, alamat, no_hp, email, pekerjaan, status_pernikahan, alamat_sekarang, instansi, prestasi_utama, keterangan)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
         RETURNING *`,
        [nis, nik, nama, tempat_lahir, tanggal_lahir, tahun_masuk, tahun_lulus, 
         kelas_terakhir, alamat, no_hp, email, pekerjaan, status_pernikahan, alamat_sekarang, instansi, prestasi_utama, keterangan]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Gagal menyimpan data alumni.' });
    }
  });
  
  app.put('/api/alumni/:id', async (req, res) => {
    const { id } = req.params;
    const nis = normalizeText(req.body.nis);
    const nik = normalizeText(req.body.nik);
    const nama = normalizeText(req.body.nama);
    const tempat_lahir = normalizeText(req.body.tempat_lahir);
    const tanggal_lahir = req.body.tanggal_lahir || null;
    const tahun_masuk = req.body.tahun_masuk ? parseInt(req.body.tahun_masuk, 10) : null;
    const tahun_lulus = req.body.tahun_lulus ? parseInt(req.body.tahun_lulus, 10) : null;
    const kelas_terakhir = normalizeText(req.body.kelas_terakhir);
    const alamat = normalizeText(req.body.alamat);
    const no_hp = normalizeText(req.body.no_hp);
    const email = normalizeText(req.body.email);
    const pekerjaan = normalizeText(req.body.pekerjaan);
    const status_pernikahan = normalizeText(req.body.status_pernikahan);
    const alamat_sekarang = normalizeText(req.body.alamat_sekarang);
    const instansi = normalizeText(req.body.instansi);
    const prestasi_utama = normalizeText(req.body.prestasi_utama);
    const keterangan = normalizeText(req.body.keterangan);
  
    if (!nis || !nama || !tahun_lulus) {
      return res.status(400).json({ error: 'NIS, nama, dan tahun lulus wajib diisi.' });
    }
  
    try {
      const result = await db.query(
        `UPDATE alumni 
         SET nis = $1, nik = $2, nama = $3, tempat_lahir = $4, tanggal_lahir = $5, 
             tahun_masuk = $6, tahun_lulus = $7, kelas_terakhir = $8, alamat = $9, 
             no_hp = $10, email = $11, pekerjaan = $12, status_pernikahan = $13,
             alamat_sekarang = $14, instansi = $15, prestasi_utama = $16, keterangan = $17
         WHERE id = $18
         RETURNING *`,
        [nis, nik, nama, tempat_lahir, tanggal_lahir, tahun_masuk, tahun_lulus, 
         kelas_terakhir, alamat, no_hp, email, pekerjaan, status_pernikahan, alamat_sekarang, instansi, prestasi_utama, keterangan, id]
      );
  
      if (!result.rows.length) {
        return res.status(404).json({ error: 'Data alumni tidak ditemukan.' });
      }
  
      res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Gagal memperbarui data alumni.' });
    }
  });
  
  app.delete('/api/alumni/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const result = await db.query('DELETE FROM alumni WHERE id = $1 RETURNING id, santri_id', [id]);
      if (!result.rows.length) {
        return res.status(404).json({ error: 'Data alumni tidak ditemukan.' });
      }
      res.json({
        message: result.rows[0].santri_id
          ? 'Data alumni berhasil dihapus. Data santri kembali aktif.'
          : 'Data alumni berhasil dihapus.',
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Gagal menghapus data alumni.' });
    }
  });
  
  // GET /api/santri/active - Ambil santri aktif untuk dropdown migrasi
  app.get('/api/santri/active', async (req, res) => {
    try {
      const result = await db.query(`
        SELECT s.id, sta.nis, sta.nik, sta.nama, sta.tempat_lahir, sta.tanggal_lahir, sta.alamat,
               sta.nama_ayah, sta.nama_ibu, sta.no_hp_ayah, sta.no_hp_ibu,
               kd.nama AS kelas_diniyah, ks.nama AS kelas_sekolah,
               k.nama AS kamar, k.gedung, k.lantai
        FROM santri_tahun_ajaran sta
        JOIN tahun_ajaran ta ON sta.tahun_ajaran_id = ta.id AND ta.is_active = TRUE
        JOIN santri s ON sta.santri_id = s.id
        LEFT JOIN kelas kd ON sta.kelas_diniyah_id = kd.id
        LEFT JOIN kelas ks ON sta.kelas_sekolah_id = ks.id
        LEFT JOIN kamar k ON sta.kamar_id = k.id
        WHERE sta.status IN ('aktif', 'draft', 'tidak_naik')
          AND s.id NOT IN (SELECT santri_id FROM alumni WHERE santri_id IS NOT NULL)
        ORDER BY sta.nama
      `);
      res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Gagal memuat data santri.' });
    }
  });
  
  // POST /api/alumni/migrate - Migrasi santri ke alumni
  app.post('/api/alumni/migrate', async (req, res) => {
    const { santri_id, tahun_lulus, keterangan } = req.body;
    
    if (!santri_id || !tahun_lulus) {
      return res.status(400).json({ error: 'Santri dan tahun lulus wajib diisi.' });
    }
  
    try {
      const existingAlumni = await db.query('SELECT id FROM alumni WHERE santri_id = $1', [santri_id]);
      if (existingAlumni.rows.length) {
        return res.status(400).json({ error: 'Santri ini sudah masuk data alumni.' });
      }
  
      // Ambil data santri lengkap
      const santriResult = await db.query(`
        SELECT s.*, o.*, 
               kd.nama AS kelas_diniyah, ks.nama AS kelas_sekolah,
               k.nama AS kamar
        FROM santri s
        LEFT JOIN orangtua o ON s.orangtua_id = o.id
        LEFT JOIN kelas kd ON s.kelas_diniyah_id = kd.id
        LEFT JOIN kelas ks ON s.kelas_sekolah_id = ks.id
        LEFT JOIN kamar k ON s.kamar_id = k.id
        WHERE s.id = $1
      `, [santri_id]);
  
      if (!santriResult.rows.length) {
        return res.status(404).json({ error: 'Santri tidak ditemukan.' });
      }
  
      const santri = santriResult.rows[0];
  
      // Hitung tahun masuk (estimasi: lulus - 6 tahun)
      const tahunMasuk = tahun_lulus - 6;
  
      // Buat kelas terakhir
      const kelasArray = [];
      if (santri.kelas_diniyah) kelasArray.push(santri.kelas_diniyah);
      if (santri.kelas_sekolah) kelasArray.push(santri.kelas_sekolah);
      const kelasTerakir = kelasArray.join(' / ') || null;
  
      // Simpan history kelas sebelum migrasi
      if (santri.kelas_diniyah_id || santri.kelas_sekolah_id) {
        await db.query(`
          INSERT INTO santri_kelas_history (santri_id, kelas_diniyah_id, kelas_sekolah_id, tanggal_mulai, tanggal_selesai, keterangan)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [santri_id, santri.kelas_diniyah_id, santri.kelas_sekolah_id, 
            new Date(tahunMasuk, 0, 1), new Date(tahun_lulus, 11, 31), 'Migrasi ke alumni']);
      }
  
      // Simpan history kamar sebelum migrasi
      if (santri.kamar_id) {
        await db.query(`
          INSERT INTO santri_kamar_history (santri_id, kamar_id, tanggal_mulai, tanggal_selesai, keterangan)
          VALUES ($1, $2, $3, $4, $5)
        `, [santri_id, santri.kamar_id, 
            new Date(tahunMasuk, 0, 1), new Date(tahun_lulus, 11, 31), 'Migrasi ke alumni']);
      }
  
      // Insert ke alumni
      const alumniResult = await db.query(`
        INSERT INTO alumni (
          santri_id, nis, nik, nama, tempat_lahir, tanggal_lahir,
          tahun_masuk, tahun_lulus, kelas_terakhir, alamat, keterangan
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [
        santri_id, santri.nis, santri.nik, santri.nama,
        santri.tempat_lahir, santri.tanggal_lahir,
        tahunMasuk, tahun_lulus, kelasTerakir, santri.alamat,
        keterangan
      ]);
  
      await db.query(`
        UPDATE santri_tahun_ajaran sta
        SET status = 'alumni',
            catatan = COALESCE($2, catatan),
            updated_at = NOW()
        FROM tahun_ajaran ta
        WHERE sta.tahun_ajaran_id = ta.id
          AND ta.is_active = TRUE
          AND sta.santri_id = $1
      `, [santri_id, keterangan || 'Migrasi ke alumni']);
  
      res.status(201).json({
        message: 'Santri berhasil dimigrasi ke alumni',
        alumni: alumniResult.rows[0]
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Gagal migrasi santri ke alumni.' });
    }
  });
  
  // GET /api/alumni/:id/detail - Detail alumni dengan riwayat
  app.get('/api/alumni/:id/detail', async (req, res) => {
    const { id } = req.params;
    
    try {
      const alumni = await db.query('SELECT * FROM alumni WHERE id = $1', [id]);
      
      if (!alumni.rows.length) {
        return res.status(404).json({ error: 'Alumni tidak ditemukan.' });
      }
      
      const alumniData = alumni.rows[0];
      const santriId = alumniData.santri_id;
      let identitasSantri = null;
      
      let riwayat = {
        kelas: [],
        kamar: [],
        prestasi: [],
        pelanggaran: []
      };
      
      if (santriId || alumniData.nis) {
        const santriParams = santriId ? [santriId] : [alumniData.nis];
        const santriDetail = await db.query(`
          SELECT s.*, 
                 kd.nama AS kelas_diniyah,
                 ks.nama AS kelas_sekolah,
                 k.nama AS kamar, k.gedung, k.lantai,
                 o.nama_ayah, o.nama_ibu, o.pekerjaan_ayah, o.pekerjaan_ibu,
                 o.no_hp_ayah, o.no_hp_ibu
          FROM santri s
          LEFT JOIN kelas kd ON s.kelas_diniyah_id = kd.id
          LEFT JOIN kelas ks ON s.kelas_sekolah_id = ks.id
          LEFT JOIN kamar k ON s.kamar_id = k.id
          LEFT JOIN orangtua o ON s.orangtua_id = o.id
          WHERE ${santriId ? 's.id = $1' : 's.nis = $1'}
        `, santriParams);
  
        identitasSantri = santriDetail.rows[0] || null;
  
        const detailSantriId = santriId || (identitasSantri ? identitasSantri.id : null);
        if (!santriId && detailSantriId) {
          await db.query('UPDATE alumni SET santri_id = $1 WHERE id = $2', [detailSantriId, id]);
          alumniData.santri_id = detailSantriId;
        }
  
        // Riwayat kelas
        const kelasHistory = await db.query(`
          SELECT skh.*, 
                 kd.nama AS kelas_diniyah, 
                 ks.nama AS kelas_sekolah
          FROM santri_kelas_history skh
          LEFT JOIN kelas kd ON skh.kelas_diniyah_id = kd.id
          LEFT JOIN kelas ks ON skh.kelas_sekolah_id = ks.id
          WHERE skh.santri_id = $1
          ORDER BY skh.tanggal_mulai DESC
        `, [detailSantriId]);
        
        // Riwayat kamar
        const kamarHistory = await db.query(`
          SELECT skh.*, k.nama AS kamar, k.gedung, k.lantai
          FROM santri_kamar_history skh
          LEFT JOIN kamar k ON skh.kamar_id = k.id
          WHERE skh.santri_id = $1
          ORDER BY skh.tanggal_mulai DESC
        `, [detailSantriId]);
        
        // Prestasi
        const prestasi = await db.query(`
          SELECT * FROM prestasi 
          WHERE santri_id = $1 
          ORDER BY tanggal DESC
        `, [detailSantriId]);
        
        // Pelanggaran
        const pelanggaran = await db.query(`
          SELECT * FROM pelanggaran 
          WHERE santri_id = $1 
          ORDER BY tanggal DESC
        `, [detailSantriId]);
        
        riwayat = {
          kelas: kelasHistory.rows,
          kamar: kamarHistory.rows,
          prestasi: prestasi.rows,
          pelanggaran: pelanggaran.rows
        };
      }
      
      res.json({
        alumni: alumniData,
        identitas: identitasSantri,
        riwayat
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Gagal memuat detail alumni.' });
    }
  });
}

module.exports = registerAlumniRoutes;
