// alumniService.js - Business logic for alumni management

const db = require('../../db');
const { normalizeText } = require('../utils/normalizers');
const {
  ValidationError,
  NotFoundError,
  validateRequiredFields,
  validateField,
  validators,
  handleDatabaseError
} = require('../utils/errorHandler');

/**
 * Get all alumni
 */
async function getAllAlumni() {
  try {
    const result = await db.query(`
      SELECT * FROM alumni
      ORDER BY tahun_lulus DESC, nama
    `);
    return result.rows;
  } catch (error) {
    handleDatabaseError(error);
  }
}

/**
 * Search alumni by query and year
 */
async function searchAlumni(searchQuery, tahunLulus) {
  try {
    let query = 'SELECT * FROM alumni WHERE 1=1';
    const params = [];

    if (searchQuery) {
      params.push(`%${searchQuery}%`);
      query += ` AND (nama ILIKE $${params.length} OR nis ILIKE $${params.length})`;
    }

    if (tahunLulus) {
      params.push(parseInt(tahunLulus, 10));
      query += ` AND tahun_lulus = $${params.length}`;
    }

    query += ' ORDER BY tahun_lulus DESC, nama';

    const result = await db.query(query, params);
    return result.rows;
  } catch (error) {
    handleDatabaseError(error);
  }
}

/**
 * Create new alumni manually
 */
async function createAlumni(data) {
  // Validate required fields
  validateRequiredFields(data, ['nis', 'nama', 'tahun_lulus']);

  // Validate field formats
  validateField('NIS', data.nis, validators.nis);
  if (data.nik) validateField('NIK', data.nik, validators.nik);
  if (data.email) validateField('Email', data.email, validators.email);
  if (data.no_hp) validateField('No HP', data.no_hp, validators.phone);
  if (data.tahun_masuk) validateField('Tahun Masuk', data.tahun_masuk, validators.year);
  validateField('Tahun Lulus', data.tahun_lulus, validators.year);

  // Normalize data
  const nis = normalizeText(data.nis);
  const nik = normalizeText(data.nik);
  const nama = normalizeText(data.nama);
  const tempat_lahir = normalizeText(data.tempat_lahir);
  const tanggal_lahir = data.tanggal_lahir || null;
  const tahun_masuk = data.tahun_masuk ? parseInt(data.tahun_masuk, 10) : null;
  const tahun_lulus = parseInt(data.tahun_lulus, 10);
  const kelas_terakhir = normalizeText(data.kelas_terakhir);
  const alamat = normalizeText(data.alamat);
  const no_hp = normalizeText(data.no_hp);
  const email = normalizeText(data.email);
  const pekerjaan = normalizeText(data.pekerjaan);
  const status_pernikahan = normalizeText(data.status_pernikahan);
  const alamat_sekarang = normalizeText(data.alamat_sekarang);
  const instansi = normalizeText(data.instansi);
  const prestasi_utama = normalizeText(data.prestasi_utama);
  const keterangan = normalizeText(data.keterangan);

  try {
    const result = await db.query(
      `INSERT INTO alumni (nis, nik, nama, tempat_lahir, tanggal_lahir, tahun_masuk, tahun_lulus,
       kelas_terakhir, alamat, no_hp, email, pekerjaan, status_pernikahan, alamat_sekarang, instansi, prestasi_utama, keterangan)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING *`,
      [nis, nik, nama, tempat_lahir, tanggal_lahir, tahun_masuk, tahun_lulus,
       kelas_terakhir, alamat, no_hp, email, pekerjaan, status_pernikahan, alamat_sekarang, instansi, prestasi_utama, keterangan]
    );

    return result.rows[0];
  } catch (error) {
    handleDatabaseError(error);
  }
}

/**
 * Update alumni by ID
 */
async function updateAlumni(id, data) {
  // Validate required fields
  validateRequiredFields(data, ['nis', 'nama', 'tahun_lulus']);

  // Validate field formats
  validateField('NIS', data.nis, validators.nis);
  if (data.nik) validateField('NIK', data.nik, validators.nik);
  if (data.email) validateField('Email', data.email, validators.email);
  if (data.no_hp) validateField('No HP', data.no_hp, validators.phone);
  if (data.tahun_masuk) validateField('Tahun Masuk', data.tahun_masuk, validators.year);
  validateField('Tahun Lulus', data.tahun_lulus, validators.year);

  // Normalize data
  const nis = normalizeText(data.nis);
  const nik = normalizeText(data.nik);
  const nama = normalizeText(data.nama);
  const tempat_lahir = normalizeText(data.tempat_lahir);
  const tanggal_lahir = data.tanggal_lahir || null;
  const tahun_masuk = data.tahun_masuk ? parseInt(data.tahun_masuk, 10) : null;
  const tahun_lulus = parseInt(data.tahun_lulus, 10);
  const kelas_terakhir = normalizeText(data.kelas_terakhir);
  const alamat = normalizeText(data.alamat);
  const no_hp = normalizeText(data.no_hp);
  const email = normalizeText(data.email);
  const pekerjaan = normalizeText(data.pekerjaan);
  const status_pernikahan = normalizeText(data.status_pernikahan);
  const alamat_sekarang = normalizeText(data.alamat_sekarang);
  const instansi = normalizeText(data.instansi);
  const prestasi_utama = normalizeText(data.prestasi_utama);
  const keterangan = normalizeText(data.keterangan);

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
      throw new NotFoundError('Data alumni');
    }

    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    handleDatabaseError(error);
  }
}

/**
 * Delete alumni by ID
 */
async function deleteAlumni(id) {
  try {
    const result = await db.query('DELETE FROM alumni WHERE id = $1 RETURNING id, santri_id', [id]);

    if (!result.rows.length) {
      throw new NotFoundError('Data alumni');
    }

    return {
      message: result.rows[0].santri_id
        ? 'Data alumni berhasil dihapus. Data santri kembali aktif.'
        : 'Data alumni berhasil dihapus.',
      deletedId: result.rows[0].id
    };
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    handleDatabaseError(error);
  }
}

/**
 * Get active santri for migration dropdown
 */
async function getActiveSantri() {
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

    return result.rows;
  } catch (error) {
    handleDatabaseError(error);
  }
}

/**
 * Migrate santri to alumni
 */
async function migrateSantriToAlumni(santriId, tahunLulus, keterangan) {
  // Validate required fields
  validateRequiredFields({ santri_id: santriId, tahun_lulus: tahunLulus }, ['santri_id', 'tahun_lulus']);
  validateField('Tahun Lulus', tahunLulus, validators.year);

  try {
    // Check if already alumni
    const existingAlumni = await db.query('SELECT id FROM alumni WHERE santri_id = $1', [santriId]);
    if (existingAlumni.rows.length) {
      throw new ValidationError('Santri ini sudah masuk data alumni');
    }

    // Get santri data
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
    `, [santriId]);

    if (!santriResult.rows.length) {
      throw new NotFoundError('Santri');
    }

    const santri = santriResult.rows[0];

    // Calculate tahun masuk (estimate: lulus - 6 years)
    const tahunMasuk = tahunLulus - 6;

    // Build kelas terakhir
    const kelasArray = [];
    if (santri.kelas_diniyah) kelasArray.push(santri.kelas_diniyah);
    if (santri.kelas_sekolah) kelasArray.push(santri.kelas_sekolah);
    const kelasTerakir = kelasArray.join(' / ') || null;

    // Save kelas history before migration
    if (santri.kelas_diniyah_id || santri.kelas_sekolah_id) {
      await db.query(`
        INSERT INTO santri_kelas_history (santri_id, kelas_diniyah_id, kelas_sekolah_id, tanggal_mulai, tanggal_selesai, keterangan)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [santriId, santri.kelas_diniyah_id, santri.kelas_sekolah_id,
          new Date(tahunMasuk, 0, 1), new Date(tahunLulus, 11, 31), 'Migrasi ke alumni']);
    }

    // Save kamar history before migration
    if (santri.kamar_id) {
      await db.query(`
        INSERT INTO santri_kamar_history (santri_id, kamar_id, tanggal_mulai, tanggal_selesai, keterangan)
        VALUES ($1, $2, $3, $4, $5)
      `, [santriId, santri.kamar_id,
          new Date(tahunMasuk, 0, 1), new Date(tahunLulus, 11, 31), 'Migrasi ke alumni']);
    }

    // Insert to alumni
    const alumniResult = await db.query(`
      INSERT INTO alumni (
        santri_id, nis, nik, nama, tempat_lahir, tanggal_lahir,
        tahun_masuk, tahun_lulus, kelas_terakhir, alamat, keterangan
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      santriId, santri.nis, santri.nik, santri.nama,
      santri.tempat_lahir, santri.tanggal_lahir,
      tahunMasuk, tahunLulus, kelasTerakir, santri.alamat,
      keterangan
    ]);

    // Update santri status to alumni
    await db.query(`
      UPDATE santri_tahun_ajaran sta
      SET status = 'alumni',
          catatan = COALESCE($2, catatan),
          updated_at = NOW()
      FROM tahun_ajaran ta
      WHERE sta.tahun_ajaran_id = ta.id
        AND ta.is_active = TRUE
        AND sta.santri_id = $1
    `, [santriId, keterangan || 'Migrasi ke alumni']);

    return {
      message: 'Santri berhasil dimigrasi ke alumni',
      alumni: alumniResult.rows[0]
    };
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) throw error;
    handleDatabaseError(error);
  }
}

/**
 * Get alumni detail with history
 */
async function getAlumniDetail(id) {
  try {
    const alumni = await db.query('SELECT * FROM alumni WHERE id = $1', [id]);

    if (!alumni.rows.length) {
      throw new NotFoundError('Alumni');
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

      if (detailSantriId) {
        // Kelas history
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

        // Kamar history
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
    }

    return {
      alumni: alumniData,
      identitas: identitasSantri,
      riwayat
    };
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    handleDatabaseError(error);
  }
}

module.exports = {
  getAllAlumni,
  searchAlumni,
  createAlumni,
  updateAlumni,
  deleteAlumni,
  getActiveSantri,
  migrateSantriToAlumni,
  getAlumniDetail
};
