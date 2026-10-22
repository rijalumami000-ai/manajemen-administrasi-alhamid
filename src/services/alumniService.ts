import db from '../../db';
import { normalizeText } from '../utils/normalizers';
import {
  ValidationError,
  NotFoundError,
  validateRequiredFields,
  validateField,
  validators,
  handleDatabaseError
} from '../utils/errorHandler';

/**
 * Get all alumni
 */
export async function getAllAlumni(tipe: string | null = null, tahunAjaranId: number | string | null = null): Promise<any[]> {
  try {
    let query = `
      SELECT a.*, 
             s.foto_url, 
             s.jenis_kelamin
      FROM alumni a
      LEFT JOIN santri s ON a.santri_id = s.id OR (a.santri_id IS NULL AND a.nis = s.nis)
      WHERE 1=1
    `;
    const params: any[] = [];

    if (tipe) {
      if (tipe === 'lulus') {
        query += ` AND a.tipe IN ('lulus_mts', 'lulus_aliyah')`;
      } else if (tipe === 'alumni_all') {
        query += ` AND a.tipe != 'pindah'`;
      } else if (tipe !== 'all') {
        params.push(tipe);
        query += ` AND a.tipe = $${params.length}`;
      }
    }

    if (tahunAjaranId) {
      params.push(parseInt(String(tahunAjaranId), 10));
      query += ` AND a.tahun_ajaran_id = $${params.length}`;
    }

    query += ' ORDER BY a.tahun_lulus DESC, a.nama';

    const result = await db.query(query, params);
    return result.rows;
  } catch (error) {
    handleDatabaseError(error);
    return [];
  }
}

/**
 * Search alumni by query and year
 */
export async function searchAlumni(
  searchQuery?: string,
  tahunLulus?: number | string,
  tipe: string | null = null,
  tahunAjaranId: number | string | null = null
): Promise<any[]> {
  try {
    let query = `
      SELECT a.*, 
             s.foto_url, 
             s.jenis_kelamin
      FROM alumni a
      LEFT JOIN santri s ON a.santri_id = s.id OR (a.santri_id IS NULL AND a.nis = s.nis)
      WHERE 1=1
    `;
    const params: any[] = [];

    if (searchQuery) {
      params.push(`%${searchQuery}%`);
      query += ` AND (a.nama ILIKE $${params.length} OR a.nis ILIKE $${params.length})`;
    }

    if (tahunLulus) {
      params.push(parseInt(String(tahunLulus), 10));
      query += ` AND a.tahun_lulus = $${params.length}`;
    }

    if (tipe) {
      if (tipe === 'lulus') {
        query += ` AND a.tipe IN ('lulus_mts', 'lulus_aliyah')`;
      } else if (tipe === 'alumni_all') {
        query += ` AND a.tipe != 'pindah'`;
      } else if (tipe !== 'all') {
        params.push(tipe);
        query += ` AND a.tipe = $${params.length}`;
      }
    }

    if (tahunAjaranId) {
      params.push(parseInt(String(tahunAjaranId), 10));
      query += ` AND a.tahun_ajaran_id = $${params.length}`;
    }

    query += ' ORDER BY a.tahun_lulus DESC, a.nama';

    const result = await db.query(query, params);
    return result.rows;
  } catch (error) {
    handleDatabaseError(error);
    return [];
  }
}

/**
 * Create new alumni manually
 */
export async function createAlumni(data: any): Promise<any> {
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
  const tipe = normalizeText(data.tipe) || 'alumni';
  const tahun_ajaran_id = data.tahun_ajaran_id ? parseInt(data.tahun_ajaran_id, 10) : null;

  try {
    const result = await db.query(
      `INSERT INTO alumni (nis, nik, nama, tempat_lahir, tanggal_lahir, tahun_masuk, tahun_lulus,
       kelas_terakhir, alamat, no_hp, email, pekerjaan, status_pernikahan, alamat_sekarang, instansi, prestasi_utama, keterangan, tipe, tahun_ajaran_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
       RETURNING *`,
      [nis, nik, nama, tempat_lahir, tanggal_lahir, tahun_masuk, tahun_lulus,
       kelas_terakhir, alamat, no_hp, email, pekerjaan, status_pernikahan, alamat_sekarang, instansi, prestasi_utama, keterangan, tipe, tahun_ajaran_id]
    );

    return result.rows[0];
  } catch (error) {
    handleDatabaseError(error);
  }
}

/**
 * Update alumni by ID
 */
export async function updateAlumni(id: number, data: any): Promise<any> {
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
  const tipe = normalizeText(data.tipe) || 'alumni';
  const tahun_ajaran_id = data.tahun_ajaran_id ? parseInt(data.tahun_ajaran_id, 10) : null;

  try {
    const result = await db.query(
      `UPDATE alumni
       SET nis = $1, nik = $2, nama = $3, tempat_lahir = $4, tanggal_lahir = $5,
           tahun_masuk = $6, tahun_lulus = $7, kelas_terakhir = $8, alamat = $9,
           no_hp = $10, email = $11, pekerjaan = $12, status_pernikahan = $13,
           alamat_sekarang = $14, instansi = $15, prestasi_utama = $16, keterangan = $17,
           tipe = $18, tahun_ajaran_id = $19
       WHERE id = $20
       RETURNING *`,
      [nis, nik, nama, tempat_lahir, tanggal_lahir, tahun_masuk, tahun_lulus,
       kelas_terakhir, alamat, no_hp, email, pekerjaan, status_pernikahan, alamat_sekarang, instansi, prestasi_utama, keterangan, tipe, tahun_ajaran_id, id]
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
export async function deleteAlumni(id: number): Promise<any> {
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
export async function getActiveSantri(): Promise<any[]> {
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
    return [];
  }
}

/**
 * Migrate santri to alumni
 */
export async function migrateSantriToAlumni(
  santriId: number,
  tahunLulus: number,
  keterangan?: string,
  customTipe?: string
): Promise<any> {
  // Validate required fields
  validateRequiredFields({ santri_id: santriId, tahun_lulus: tahunLulus }, ['santri_id', 'tahun_lulus']);
  validateField('Tahun Lulus', tahunLulus, validators.year);

  try {
    // Check if already alumni
    const existingAlumni = await db.query('SELECT id FROM alumni WHERE santri_id = $1', [santriId]);
    if (existingAlumni.rows.length) {
      throw new ValidationError('Santri ini sudah masuk data alumni / kelulusan');
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

    // Determine tipe if not explicitly provided
    let effectiveTipe = customTipe;
    if (!effectiveTipe) {
      const ks = (santri.kelas_sekolah || '').toLowerCase();
      if (ks.includes('aliyah') || ks.includes('ma ') || ks.includes('12')) {
        effectiveTipe = 'lulus_aliyah';
      } else if (ks.includes('mts') || ks.includes('smp') || ks.includes('9')) {
        effectiveTipe = 'lulus_mts';
      } else {
        effectiveTipe = 'alumni';
      }
    }

    // Determine sta status and default notes
    let staStatus = 'alumni';
    let defaultKet = 'Lulus Diniyah';
    if (effectiveTipe === 'lulus_mts') {
      staStatus = 'lulus';
      defaultKet = 'Lulus Kelas 3 MTs';
    } else if (effectiveTipe === 'lulus_aliyah') {
      staStatus = 'lulus';
      defaultKet = 'Lulus Kelas 3 Aliyah';
    } else if (effectiveTipe === 'pindah') {
      staStatus = 'pindah';
      defaultKet = 'Pindah / Mutasi';
    }

    // Calculate tahun masuk (estimate: lulus - 6 years)
    const tahunMasuk = tahunLulus - 6;

    // Build kelas terakhir
    const kelasArray: string[] = [];
    if (santri.kelas_diniyah) kelasArray.push(santri.kelas_diniyah);
    if (santri.kelas_sekolah) kelasArray.push(santri.kelas_sekolah);
    const kelasTerakir = kelasArray.join(' / ') || null;

    // Save kelas history before migration
    if (santri.kelas_diniyah_id || santri.kelas_sekolah_id) {
      await db.query(`
        INSERT INTO santri_kelas_history (santri_id, kelas_diniyah_id, kelas_sekolah_id, tanggal_mulai, tanggal_selesai, keterangan)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [santriId, santri.kelas_diniyah_id, santri.kelas_sekolah_id,
          new Date(tahunMasuk, 0, 1), new Date(tahunLulus, 11, 31), keterangan || defaultKet]);
    }

    // Save kamar history before migration
    if (santri.kamar_id) {
      await db.query(`
        INSERT INTO santri_kamar_history (santri_id, kamar_id, tanggal_mulai, tanggal_selesai, keterangan)
        VALUES ($1, $2, $3, $4, $5)
      `, [santriId, santri.kamar_id,
          new Date(tahunMasuk, 0, 1), new Date(tahunLulus, 11, 31), keterangan || defaultKet]);
    }

    // Insert to alumni
    const alumniResult = await db.query(`
      INSERT INTO alumni (
        santri_id, nis, nik, nama, tempat_lahir, tanggal_lahir,
        tahun_masuk, tahun_lulus, kelas_terakhir, alamat, keterangan, tipe
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      santriId, santri.nis, santri.nik, santri.nama,
      santri.tempat_lahir, santri.tanggal_lahir,
      tahunMasuk, tahunLulus, kelasTerakir, santri.alamat,
      keterangan || defaultKet, effectiveTipe
    ]);

    // Update santri status in active academic year
    await db.query(`
      UPDATE santri_tahun_ajaran sta
      SET status = $2,
          catatan = COALESCE($3, catatan),
          updated_at = NOW()
      FROM tahun_ajaran ta
      WHERE sta.tahun_ajaran_id = ta.id
        AND ta.is_active = TRUE
        AND sta.santri_id = $1
    `, [santriId, staStatus, keterangan || defaultKet]);

    return {
      message: 'Santri berhasil diproses ke data kelulusan / alumni',
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
export async function getAlumniDetail(id: number): Promise<any> {
  try {
    const alumni = await db.query('SELECT * FROM alumni WHERE id = $1', [id]);

    if (!alumni.rows.length) {
      throw new NotFoundError('Alumni');
    }

    const alumniData = alumni.rows[0];
    const santriId = alumniData.santri_id;
    let identitasSantri: any = null;

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
    }

    const effectiveSantriId = alumniData.santri_id || (identitasSantri ? identitasSantri.id : null);

    let historyList: any[] = [];
    let kamarHistoryList: any[] = [];
    let prestasiList: any[] = [];
    let pelanggaranList: any[] = [];

    if (effectiveSantriId) {
      // 1. Riwayat Akademik riil dari Buku Induk (santri_tahun_ajaran)
      const staRes = await db.query(`
        SELECT 
          sta.id,
          sta.santri_id,
          sta.tahun_ajaran_id,
          ta.kode AS tahun_ajaran,
          ta.tahun_mulai,
          ta.tahun_selesai,
          kd.nama AS kelas_diniyah,
          ks.nama AS kelas_sekolah,
          k.nama AS kamar,
          k.gedung,
          k.lantai,
          sta.status,
          sta.catatan,
          sta.aktif_ganjil,
          sta.aktif_genap
        FROM santri_tahun_ajaran sta
        JOIN tahun_ajaran ta ON sta.tahun_ajaran_id = ta.id
        LEFT JOIN kelas kd ON sta.kelas_diniyah_id = kd.id
        LEFT JOIN kelas ks ON sta.kelas_sekolah_id = ks.id
        LEFT JOIN kamar k ON sta.kamar_id = k.id
        WHERE sta.santri_id = $1
        ORDER BY ta.tahun_mulai ASC, sta.id ASC
      `, [effectiveSantriId]);

      historyList = staRes.rows;

      // Extract unique kamar records across years
      const kamarMap = new Map();
      for (const row of staRes.rows) {
        if (row.kamar && !kamarMap.has(row.kamar)) {
          kamarMap.set(row.kamar, {
            kamar: row.kamar,
            gedung: row.gedung,
            lantai: row.lantai,
            tanggal_mulai: row.tahun_mulai ? `${row.tahun_mulai}-07-01` : null,
            tahun_ajaran: row.tahun_ajaran
          });
        }
      }
      kamarHistoryList = Array.from(kamarMap.values());

      // Prestasi
      const presRes = await db.query(`
        SELECT id, santri_id, jenis, jenis AS prestasi, tanggal, deskripsi, deskripsi AS keterangan, penghargaan, penghargaan AS kegiatan, tahun_ajaran_id
        FROM prestasi
        WHERE santri_id = $1
        ORDER BY tanggal DESC
      `, [effectiveSantriId]);
      prestasiList = presRes.rows;

      // Pelanggaran
      const pelRes = await db.query(`
        SELECT id, santri_id, jenis, jenis AS pelanggaran, tanggal, deskripsi, deskripsi AS keterangan, sanksi, tahun_ajaran_id
        FROM pelanggaran
        WHERE santri_id = $1
        ORDER BY tanggal DESC
      `, [effectiveSantriId]);
      pelanggaranList = pelRes.rows;
    }

    const combinedSantri = {
      ...(identitasSantri || {}),
      ...(alumniData || {}),
      foto_url: (identitasSantri && identitasSantri.foto_url) || alumniData.foto_url,
      jenis_kelamin: (identitasSantri && identitasSantri.jenis_kelamin) || alumniData.jenis_kelamin,
      kamar: (identitasSantri && identitasSantri.kamar) || alumniData.kamar,
      nama_ayah: (identitasSantri && identitasSantri.nama_ayah) || alumniData.nama_ayah,
      nama_ibu: (identitasSantri && identitasSantri.nama_ibu) || alumniData.nama_ibu,
      no_hp_ayah: (identitasSantri && identitasSantri.no_hp_ayah) || alumniData.no_hp_ayah,
      no_hp_ibu: (identitasSantri && identitasSantri.no_hp_ibu) || alumniData.no_hp_ibu,
    };

    return {
      alumni: alumniData,
      identitas: identitasSantri,
      santri: combinedSantri,
      history: historyList,
      prestasi: prestasiList,
      pelanggaran: pelanggaranList,
      riwayat: {
        kelas: historyList,
        kamar: kamarHistoryList,
        prestasi: prestasiList,
        pelanggaran: pelanggaranList
      }
    };
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    handleDatabaseError(error);
  }
}

/**
 * Reactivate a student who is in the alumni/pindah list back to active status
 */
export async function reactivateAlumni(id: number): Promise<{ message: string }> {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Get alumni record
    const alumniResult = await client.query('SELECT * FROM alumni WHERE id = $1', [id]);
    if (alumniResult.rows.length === 0) {
      throw new NotFoundError('Data alumni tidak ditemukan.');
    }
    const alumni = alumniResult.rows[0];

    if (!alumni.santri_id) {
      throw new ValidationError('Siswa ini dibuat manual di alumni tanpa santri_id. Daftarkan baru via Buku Induk.');
    }

    // 2. Get active academic year
    const activeYearResult = await client.query('SELECT * FROM tahun_ajaran WHERE is_active = TRUE LIMIT 1');
    if (activeYearResult.rows.length === 0) {
      throw new ValidationError('Tahun ajaran berjalan belum disetel.');
    }
    const activeYear = activeYearResult.rows[0];

    // 3. Upsert into santri_tahun_ajaran for the active year with status = 'aktif'
    const { syncSantriToSpecificTahunAjaran } = require('./tahunAjaranService');
    await syncSantriToSpecificTahunAjaran(alumni.santri_id, activeYear.id, {
      status_tahun_ajaran: 'aktif',
      catatan_tahun_ajaran: `Reaktivasi dari alumni/pindah pada tahun ajaran ${activeYear.kode}`
    }, client);

    // 4. Delete from alumni table
    await client.query('DELETE FROM alumni WHERE id = $1', [id]);

    await client.query('COMMIT');
    return { message: 'Siswa berhasil diaktifkan kembali dan dimasukkan ke tahun ajaran aktif.' };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error reactivateAlumni:', error);
    throw error;
  } finally {
    client.release();
  }
}

const alumniService = {
  getAllAlumni,
  searchAlumni,
  createAlumni,
  updateAlumni,
  deleteAlumni,
  getActiveSantri,
  migrateSantriToAlumni,
  getAlumniDetail,
  reactivateAlumni
};

module.exports = alumniService;
export default alumniService;
