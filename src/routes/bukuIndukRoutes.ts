import db from '../../db';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { syncSantriToActiveTahunAjaran, syncSantriToSpecificTahunAjaran } from '../services/tahunAjaranService';
import { nullableInt, nullableDate, normalizeGender } from '../utils/normalizers';
import santriExcelService from '../services/santriExcelService';

// Konfigurasi storage multer untuk foto santri
const fotoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../public/uploads/foto-santri');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const santriId = req.params.id;
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `santri_${santriId}_${Date.now()}${ext}`;
    cb(null, filename);
  },
});

const fotoFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Format file tidak didukung. Gunakan JPG, PNG, atau WEBP.'));
  }
};

const uploadFoto = multer({
  storage: fotoStorage,
  fileFilter: fotoFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // max 2MB
});

// Konfigurasi storage untuk aset kartu ujian (ttd, stempel, logo)
const asetStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../public/uploads/kartu-ujian');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const key = req.params.key;
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${key}_${Date.now()}${ext}`;
    cb(null, filename);
  },
});

const uploadAset = multer({
  storage: asetStorage,
  fileFilter: fotoFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

// Multer untuk import excel
const uploadExcel = multer({ storage: multer.memoryStorage() });

function registerBukuIndukRoutes(app) {

  // === BUKU INDUK: GET semua santri dikelompokkan per tahun_masuk ===
  app.get('/api/buku-induk', async (req, res) => {
    try {
      const { tahun_masuk, search, jenis_kelamin } = req.query;
      let whereClause = [];
      let params = [];

      if (tahun_masuk) {
        params.push(tahun_masuk);
        whereClause.push(`s.tahun_masuk = $${params.length}`);
      }
      if (jenis_kelamin) {
        const normJk = normalizeGender(jenis_kelamin);
        if (normJk) {
          params.push(normJk);
          whereClause.push(`s.jenis_kelamin = $${params.length}`);
        }
      }
      if (search) {
        params.push(`%${search}%`);
        whereClause.push(`(s.nama ILIKE $${params.length} OR s.nis ILIKE $${params.length})`);
      }

      const where = whereClause.length ? `WHERE ${whereClause.join(' AND ')}` : '';

      const result = await db.query(`
        SELECT
          s.id, s.nis, s.nik, s.nama, s.jenis_kelamin,
          s.tempat_lahir, s.tanggal_lahir, s.alamat,
          s.tahun_masuk, s.foto_url, s.created_at,
          s.kelas_diniyah_id, s.kelas_sekolah_id, s.kamar_id,
          kd.nama AS kelas_diniyah,
          ks.nama AS kelas_sekolah,
          km.nama AS nama_kamar,
          o.nama_ayah, o.nama_ibu, o.no_hp_ayah, o.no_hp_ibu,
          o.pekerjaan_ayah, o.pekerjaan_ibu,
          o.nik_ayah, o.nik_ibu,
          s.anak_ke, s.agama, s.status_keluarga,
          s.status_masuk, s.pesantren_sebelumnya,
          s.sekolah_asal_nama, s.sekolah_asal_alamat,
          s.diterima_kelas_madin, s.diterima_tanggal_madin,
          s.keluar_madin_tanggal, s.keluar_madin_status,
          s.keluar_pondok_tanggal, s.keluar_pondok_status,
          s.keluar_sekolah_tingkat, s.keluar_sekolah_tanggal, s.keluar_sekolah_status,
          CASE WHEN sfd.santri_id IS NOT NULL THEN TRUE ELSE FALSE END AS is_face_registered,
          s.qr_code, s.nfc_uid, s.fingerprint_id
        FROM santri s
        LEFT JOIN kelas kd ON s.kelas_diniyah_id = kd.id
        LEFT JOIN kelas ks ON s.kelas_sekolah_id = ks.id
        LEFT JOIN kamar km ON s.kamar_id = km.id
        LEFT JOIN orangtua o ON s.orangtua_id = o.id
        LEFT JOIN santri_face_data sfd ON s.id = sfd.santri_id
        ${where}
        ORDER BY s.tahun_masuk NULLS LAST, s.nama ASC
      `, params);

      res.json(result.rows);
    } catch (err) {
      console.error('Error GET /api/buku-induk:', err);
      res.status(500).json({ error: 'Gagal memuat data buku induk.' });
    }
  });

  // === BUKU INDUK: GET daftar tahun_masuk yang tersedia ===
  app.get('/api/buku-induk/tahun-masuk', async (req, res) => {
    try {
      const result = await db.query(`
        SELECT DISTINCT tahun_masuk
        FROM santri
        WHERE tahun_masuk IS NOT NULL
        ORDER BY tahun_masuk ASC
      `);
      const years = result.rows.map(r => r.tahun_masuk);
      res.json(years);
    } catch (err) {
      console.error('Error GET /api/buku-induk/tahun-masuk:', err);
      res.status(500).json({ error: 'Gagal memuat daftar tahun masuk.' });
    }
  });

  // === BUKU INDUK: STATISTIK & PERKEMBANGAN KUANTITATIF PESANTREN ===
  app.get('/api/buku-induk/statistik-pesantren', async (req, res) => {
    try {
      const summaryRes = await db.query(`
        SELECT 
          COUNT(*)::int as total_santri,
          COUNT(CASE WHEN jenis_kelamin = 'L' THEN 1 END)::int as total_putra,
          COUNT(CASE WHEN jenis_kelamin = 'P' THEN 1 END)::int as total_putri,
          COUNT(DISTINCT tahun_masuk)::int as total_angkatan
        FROM santri
      `);

      const angkatanRes = await db.query(`
        SELECT 
          COALESCE(tahun_masuk, 0)::int as tahun,
          COUNT(*)::int as total,
          COUNT(CASE WHEN jenis_kelamin = 'L' THEN 1 END)::int as putra,
          COUNT(CASE WHEN jenis_kelamin = 'P' THEN 1 END)::int as putri
        FROM santri
        WHERE tahun_masuk IS NOT NULL
        GROUP BY tahun_masuk
        ORDER BY tahun_masuk ASC
      `);

      // Hitung persentase pertumbuhan dibanding angkatan sebelumnya
      let prevTotal = null;
      const angkatanList = angkatanRes.rows.map(row => {
        let growthPercent = null;
        if (prevTotal !== null && prevTotal > 0) {
          growthPercent = Number((((row.total - prevTotal) / prevTotal) * 100).toFixed(1));
        }
        prevTotal = row.total;
        return {
          ...row,
          growthPercent,
        };
      });

      const kamarRes = await db.query(`
        SELECT 
          COALESCE(km.nama, 'Belum Diatur') as kamar,
          COUNT(s.id)::int as total,
          COUNT(CASE WHEN s.jenis_kelamin = 'L' THEN 1 END)::int as putra,
          COUNT(CASE WHEN s.jenis_kelamin = 'P' THEN 1 END)::int as putri
        FROM santri s
        LEFT JOIN kamar km ON s.kamar_id = km.id
        GROUP BY km.nama
        ORDER BY total DESC
        LIMIT 10
      `);

      res.json({
        summary: summaryRes.rows[0],
        angkatan: angkatanList,
        kamarTop: kamarRes.rows,
      });
    } catch (err) {
      console.error('Error GET /api/buku-induk/statistik-pesantren:', err);
      res.status(500).json({ error: 'Gagal memuat statistik perkembangan santri.' });
    }
  });

  // === BUKU INDUK: TAMBAH SANTRI BARU (CREATE) ===
  app.post('/api/buku-induk', async (req, res) => {
    const {
      nis, nik, nama, jenis_kelamin,
      tempat_lahir, tanggal_lahir, alamat, tahun_masuk,
      nama_ayah, nama_ibu, pekerjaan_ayah, pekerjaan_ibu,
      no_hp_ayah, no_hp_ibu,
      nik_ayah, nik_ibu,
      anak_ke, agama, status_keluarga,
      status_masuk, pesantren_sebelumnya,
      sekolah_asal_nama, sekolah_asal_alamat,
      diterima_kelas_madin, diterima_tanggal_madin,
      keluar_madin_tanggal, keluar_madin_status,
      keluar_pondok_tanggal, keluar_pondok_status,
      keluar_sekolah_tingkat, keluar_sekolah_tanggal, keluar_sekolah_status,
      // Opsi masukkan ke TA aktif
      masukkan_ke_ta_aktif,
      kelas_diniyah_id, kelas_sekolah_id, kamar_id,
    } = req.body;

    if (!nis || !nama) {
      return res.status(400).json({ error: 'NIS dan nama santri wajib diisi.' });
    }

    if (status_masuk === 'Pindahan' && (!pesantren_sebelumnya || !pesantren_sebelumnya.trim())) {
      return res.status(400).json({ error: 'Nama pesantren asal wajib diisi untuk santri pindahan.' });
    }

    try {
      // 1. Insert data orang tua jika ada
      let orangtuaId = null;
      if (nama_ayah || nama_ibu || pekerjaan_ayah || pekerjaan_ibu || no_hp_ayah || no_hp_ibu || nik_ayah || nik_ibu) {
        const orangtuaResult = await db.query(
          `INSERT INTO orangtua (nama_ayah, nama_ibu, pekerjaan_ayah, pekerjaan_ibu, no_hp_ayah, no_hp_ibu, nik_ayah, nik_ibu)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id`,
          [nama_ayah || null, nama_ibu || null, pekerjaan_ayah || null, pekerjaan_ibu || null, no_hp_ayah || null, no_hp_ibu || null, nik_ayah || null, nik_ibu || null]
        );
        orangtuaId = orangtuaResult.rows[0].id;
      }

      // 2. Insert data santri (master)
      const result = await db.query(
        `INSERT INTO santri (
           nis, nik, nama, jenis_kelamin, tempat_lahir, tanggal_lahir, alamat, orangtua_id, tahun_masuk,
           kelas_diniyah_id, kelas_sekolah_id, kamar_id,
           anak_ke, agama, status_keluarga, status_masuk, pesantren_sebelumnya,
           sekolah_asal_nama, sekolah_asal_alamat,
           diterima_kelas_madin, diterima_tanggal_madin,
           keluar_madin_tanggal, keluar_madin_status,
           keluar_pondok_tanggal, keluar_pondok_status,
           keluar_sekolah_tingkat, keluar_sekolah_tanggal, keluar_sekolah_status
         )
         VALUES (
           $1, $2, $3, $4, $5, $6, $7, $8, $9,
           $10, $11, $12,
           $13, $14, $15, $16, $17,
           $18, $19,
           $20, $21,
           $22, $23,
           $24, $25,
           $26, $27, $28
         )
         RETURNING *`,
        [
          nis, nik || null, nama, normalizeGender(jenis_kelamin), tempat_lahir || null, nullableDate(tanggal_lahir),
          alamat || null, orangtuaId, tahun_masuk || null,
          nullableInt(kelas_diniyah_id), nullableInt(kelas_sekolah_id), nullableInt(kamar_id),
          nullableInt(anak_ke), agama || 'Islam', status_keluarga || 'Kandung', status_masuk || 'Baru', pesantren_sebelumnya || null,
          sekolah_asal_nama || null, sekolah_asal_alamat || null,
          diterima_kelas_madin || null, nullableDate(diterima_tanggal_madin),
          nullableDate(keluar_madin_tanggal), keluar_madin_status || null,
          nullableDate(keluar_pondok_tanggal), keluar_pondok_status || null,
          keluar_sekolah_tingkat || null, nullableDate(keluar_sekolah_tanggal), keluar_sekolah_status || null
        ]
      );

      const santriId = result.rows[0].id;

      // 3. Jika opsi "masukkan ke TA aktif" dicentang, sync ke tahun ajaran aktif
      if (masukkan_ke_ta_aktif) {
        await syncSantriToActiveTahunAjaran(santriId);
      }

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error POST /api/buku-induk:', error);
      if (error.code === '23505' && error.constraint?.includes('nis')) {
        return res.status(400).json({ error: `NIS "${nis}" sudah terdaftar di sistem.` });
      }
      res.status(500).json({ error: 'Gagal menyimpan data santri.' });
    }
  });

  // === BUKU INDUK: EDIT DATA SANTRI (UPDATE) ===
  app.put('/api/buku-induk/:id', async (req, res) => {
    const { id } = req.params;
    const {
      nis, nik, nama, jenis_kelamin,
      tempat_lahir, tanggal_lahir, alamat, tahun_masuk,
      nama_ayah, nama_ibu, pekerjaan_ayah, pekerjaan_ibu,
      no_hp_ayah, no_hp_ibu,
      nik_ayah, nik_ibu,
      anak_ke, agama, status_keluarga,
      status_masuk, pesantren_sebelumnya,
      sekolah_asal_nama, sekolah_asal_alamat,
      diterima_kelas_madin, diterima_tanggal_madin,
      keluar_madin_tanggal, keluar_madin_status,
      keluar_pondok_tanggal, keluar_pondok_status,
      keluar_sekolah_tingkat, keluar_sekolah_tanggal, keluar_sekolah_status,
    } = req.body;

    if (!nis || !nama) {
      return res.status(400).json({ error: 'NIS dan nama santri wajib diisi.' });
    }

    if (status_masuk === 'Pindahan' && (!pesantren_sebelumnya || !pesantren_sebelumnya.trim())) {
      return res.status(400).json({ error: 'Nama pesantren asal wajib diisi untuk santri pindahan.' });
    }

    try {
      const existing = await db.query('SELECT orangtua_id FROM santri WHERE id = $1', [id]);
      if (!existing.rows.length) {
        return res.status(404).json({ error: 'Santri tidak ditemukan.' });
      }

      // Update atau insert data orang tua
      let orangtuaId = existing.rows[0].orangtua_id;
      if (orangtuaId) {
        await db.query(
          `UPDATE orangtua SET nama_ayah = $1, nama_ibu = $2, pekerjaan_ayah = $3, pekerjaan_ibu = $4, no_hp_ayah = $5, no_hp_ibu = $6, nik_ayah = $7, nik_ibu = $8
           WHERE id = $9`,
          [nama_ayah || null, nama_ibu || null, pekerjaan_ayah || null, pekerjaan_ibu || null, no_hp_ayah || null, no_hp_ibu || null, nik_ayah || null, nik_ibu || null, orangtuaId]
        );
      } else if (nama_ayah || nama_ibu || pekerjaan_ayah || pekerjaan_ibu || no_hp_ayah || no_hp_ibu || nik_ayah || nik_ibu) {
        const orangtuaResult = await db.query(
          `INSERT INTO orangtua (nama_ayah, nama_ibu, pekerjaan_ayah, pekerjaan_ibu, no_hp_ayah, no_hp_ibu, nik_ayah, nik_ibu)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id`,
          [nama_ayah || null, nama_ibu || null, pekerjaan_ayah || null, pekerjaan_ibu || null, no_hp_ayah || null, no_hp_ibu || null, nik_ayah || null, nik_ibu || null]
        );
        orangtuaId = orangtuaResult.rows[0].id;
      }

      // Update data santri (master)
      const result = await db.query(
        `UPDATE santri SET
           nis = $1, nik = $2, nama = $3, jenis_kelamin = $4,
           tempat_lahir = $5, tanggal_lahir = $6, alamat = $7, orangtua_id = $8, tahun_masuk = $9,
           anak_ke = $10, agama = $11, status_keluarga = $12, status_masuk = $13, pesantren_sebelumnya = $14,
           sekolah_asal_nama = $15, sekolah_asal_alamat = $16,
           diterima_kelas_madin = $17, diterima_tanggal_madin = $18,
           keluar_madin_tanggal = $19, keluar_madin_status = $20,
           keluar_pondok_tanggal = $21, keluar_pondok_status = $22,
           keluar_sekolah_tingkat = $23, keluar_sekolah_tanggal = $24, keluar_sekolah_status = $25
         WHERE id = $26 RETURNING *`,
        [
          nis, nik || null, nama, normalizeGender(jenis_kelamin), tempat_lahir || null, nullableDate(tanggal_lahir),
          alamat || null, orangtuaId, tahun_masuk || null,
          nullableInt(anak_ke), agama || 'Islam', status_keluarga || 'Kandung', status_masuk || 'Baru', pesantren_sebelumnya || null,
          sekolah_asal_nama || null, sekolah_asal_alamat || null,
          diterima_kelas_madin || null, nullableDate(diterima_tanggal_madin),
          nullableDate(keluar_madin_tanggal), keluar_madin_status || null,
          nullableDate(keluar_pondok_tanggal), keluar_pondok_status || null,
          keluar_sekolah_tingkat || null, nullableDate(keluar_sekolah_tanggal), keluar_sekolah_status || null,
          id
        ]
      );

      // Sync perubahan identitas ke tahun ajaran aktif (agar snapshot ter-update)
      await syncSantriToActiveTahunAjaran(id);

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error PUT /api/buku-induk:', error);
      if (error.code === '23505' && error.constraint?.includes('nis')) {
        return res.status(400).json({ error: `NIS "${nis}" sudah dipakai santri lain.` });
      }
      res.status(500).json({ error: 'Gagal memperbarui data santri.' });
    }
  });

  // === BUKU INDUK: HAPUS SANTRI (DELETE) ===
  app.delete('/api/buku-induk/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const existing = await db.query('SELECT orangtua_id, foto_url FROM santri WHERE id = $1', [id]);
      if (!existing.rows.length) {
        return res.status(404).json({ error: 'Santri tidak ditemukan.' });
      }

      // Cek relasi penting sebelum hapus
      const nilaiCheck = await db.query('SELECT COUNT(*) FROM nilai_santri WHERE santri_id = $1', [id]);
      if (parseInt(nilaiCheck.rows[0].count) > 0) {
        return res.status(400).json({
          error: 'Santri ini memiliki data nilai. Hapus data nilai terlebih dahulu atau hubungi administrator.'
        });
      }

      // Hapus foto fisik jika ada
      if (existing.rows[0].foto_url) {
        const fotoPath = path.join(__dirname, '../../public', existing.rows[0].foto_url);
        if (fs.existsSync(fotoPath)) fs.unlinkSync(fotoPath);
      }

      const orangtuaId = existing.rows[0].orangtua_id;

      // Hapus semua relasi cascade (santri_tahun_ajaran, pelanggaran, prestasi, peserta_ujian)
      await db.query('DELETE FROM santri_tahun_ajaran WHERE santri_id = $1', [id]);
      await db.query('DELETE FROM peserta_ujian WHERE santri_id = $1', [id]);
      await db.query('DELETE FROM santri WHERE id = $1', [id]);

      if (orangtuaId) {
        // Hapus orangtua hanya jika tidak dipakai santri lain
        const otherUsage = await db.query('SELECT COUNT(*) FROM santri WHERE orangtua_id = $1', [orangtuaId]);
        if (parseInt(otherUsage.rows[0].count) === 0) {
          await db.query('DELETE FROM orangtua WHERE id = $1', [orangtuaId]);
        }
      }

      res.json({ message: 'Data santri berhasil dihapus dari Buku Induk.' });
    } catch (error) {
      console.error('Error DELETE /api/buku-induk:', error);
      res.status(500).json({ error: 'Gagal menghapus data santri.' });
    }
  });

  // === BUKU INDUK: IMPORT EXCEL ===
  app.post('/api/buku-induk/import', uploadExcel.single('file'), async (req, res) => {
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

  // === BUKU INDUK: UPDATE tahun_masuk santri ===
  app.patch('/api/buku-induk/:id/tahun-masuk', async (req, res) => {
    const { id } = req.params;
    const { tahun_masuk } = req.body;
    try {
      const result = await db.query(
        `UPDATE santri SET tahun_masuk = $1 WHERE id = $2 RETURNING id, nis, nama, tahun_masuk`,
        [tahun_masuk || null, id]
      );
      if (!result.rows.length) return res.status(404).json({ error: 'Santri tidak ditemukan.' });
      res.json(result.rows[0]);
    } catch (err) {
      console.error('Error PATCH tahun-masuk:', err);
      res.status(500).json({ error: 'Gagal memperbarui tahun masuk.' });
    }
  });

  // === BUKU INDUK: UPLOAD FOTO santri ===
  app.post('/api/buku-induk/:id/foto', uploadFoto.single('foto'), async (req, res) => {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ error: 'File foto tidak ditemukan.' });

    const fotoUrl = `/uploads/foto-santri/${req.file.filename}`;
    try {
      // Hapus foto lama jika ada
      const old = await db.query('SELECT foto_url FROM santri WHERE id = $1', [id]);
      if (old.rows[0]?.foto_url) {
        const oldPath = path.join(__dirname, '../../public', old.rows[0].foto_url);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      const result = await db.query(
        `UPDATE santri SET foto_url = $1 WHERE id = $2 RETURNING id, nama, foto_url`,
        [fotoUrl, id]
      );
      if (!result.rows.length) return res.status(404).json({ error: 'Santri tidak ditemukan.' });
      res.json({ ...result.rows[0], foto_url: fotoUrl });
    } catch (err) {
      console.error('Error upload foto:', err);
      res.status(500).json({ error: 'Gagal menyimpan foto santri.' });
    }
  });

  // === BUKU INDUK: DELETE FOTO santri ===
  app.delete('/api/buku-induk/:id/foto', async (req, res) => {
    const { id } = req.params;
    try {
      const old = await db.query('SELECT foto_url FROM santri WHERE id = $1', [id]);
      if (old.rows[0]?.foto_url) {
        const oldPath = path.join(__dirname, '../../public', old.rows[0].foto_url);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      await db.query(`UPDATE santri SET foto_url = NULL WHERE id = $1`, [id]);
      res.json({ message: 'Foto berhasil dihapus.' });
    } catch (err) {
      console.error('Error delete foto:', err);
      res.status(500).json({ error: 'Gagal menghapus foto.' });
    }
  });

  // === KARTU UJIAN: Upload aset (logo, stempel, ttd) ===
  app.post('/api/kartu-ujian/upload-aset/:key', uploadAset.single('file'), async (req, res) => {
    const { key } = req.params;
    const allowedKeys = ['kartu_ujian_logo_url', 'kartu_ujian_stempel_url', 'kartu_ujian_ttd_url', 'rapor_kop_logo_url', 'rapor_kepala_madrasah_ttd_url'];
    if (!allowedKeys.includes(key)) return res.status(400).json({ error: 'Key tidak valid.' });
    if (!req.file) return res.status(400).json({ error: 'File tidak ditemukan.' });

    const fileUrl = `/uploads/kartu-ujian/${req.file.filename}`;
    try {
      // Hapus file lama
      const old = await db.query('SELECT value FROM system_settings WHERE key = $1', [key]);
      if (old.rows[0]?.value) {
        const oldPath = path.join(__dirname, '../../public', old.rows[0].value);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      await db.query(
        `INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2`,
        [key, fileUrl]
      );
      res.json({ key, url: fileUrl });
    } catch (err) {
      console.error('Error upload aset:', err);
      res.status(500).json({ error: 'Gagal menyimpan aset.' });
    }
  });

  // === BUKU INDUK: REGISTRASI BIOMETRIK (QR, NFC, Fingerprint) ===
  app.post('/api/buku-induk/:id/biometrik', async (req, res) => {
    const { id } = req.params;
    const { type, data } = req.body;
    // type: 'qr_code', 'nfc_uid', 'fingerprint_id'
    
    if (!['qr_code', 'nfc_uid', 'fingerprint_id'].includes(type)) {
      return res.status(400).json({ error: 'Tipe biometrik tidak valid.' });
    }

    try {
      // Cek apakah data sudah dipakai santri lain
      if (data) {
        const check = await db.query(`SELECT id, nama FROM santri WHERE ${type} = $1 AND id != $2`, [data, id]);
        if (check.rows.length > 0) {
          return res.status(400).json({ error: `Data ini sudah terdaftar untuk santri: ${check.rows[0].nama}` });
        }
      }

      const result = await db.query(
        `UPDATE santri SET ${type} = $1 WHERE id = $2 RETURNING id, nama, ${type}`,
        [data || null, id]
      );

      if (!result.rows.length) return res.status(404).json({ error: 'Santri tidak ditemukan.' });
      
      res.json({ message: 'Registrasi biometrik berhasil.', santri: result.rows[0] });
    } catch (err) {
      console.error('Error registrasi biometrik:', err);
      res.status(500).json({ error: 'Gagal menyimpan data biometrik.' });
    }
  });
}

module.exports = registerBukuIndukRoutes;
export default registerBukuIndukRoutes;
