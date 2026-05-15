const db = require('../../db');
const { ValidationError, AppError, NotFoundError } = require('../utils/errorHandler');

/**
 * Calculate Euclidean distance between two vectors
 * @param {Array<number>} v1 
 * @param {Array<number>} v2 
 * @returns {number}
 */
function euclideanDistance(v1, v2) {
  return Math.sqrt(v1.reduce((sum, val, i) => sum + Math.pow(val - v2[i], 2), 0));
}

/**
 * Register or update face descriptor for a santri
 * @param {number} santriId 
 * @param {Array<number>} faceDescriptor - Array of 128 floats
 */
async function registerFace(santriId, faceDescriptor) {
  if (!santriId || !faceDescriptor) {
    throw new ValidationError('Santri ID dan face descriptor harus diisi');
  }

  try {
    // Check if santri exists
    const santriCheck = await db.query('SELECT id FROM santri WHERE id = $1', [santriId]);
    if (santriCheck.rows.length === 0) {
      throw new NotFoundError('Santri');
    }

    const descriptorStr = JSON.stringify(faceDescriptor);

    const result = await db.query(
      `INSERT INTO santri_face_data (santri_id, face_descriptor, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (santri_id) 
       DO UPDATE SET face_descriptor = EXCLUDED.face_descriptor, updated_at = NOW()
       RETURNING id`,
      [santriId, descriptorStr]
    );

    return { success: true, id: result.rows[0].id };
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) throw error;
    console.error('Error in registerFace:', error);
    throw new AppError('Gagal mendaftarkan wajah', 500);
  }
}

/**
 * Identify santri by face descriptor
 * @param {Array<number>} faceDescriptor - Array of 128 floats
 * @returns {Promise<Object|null>} - Santri data if found
 */
async function identifySantri(faceDescriptor) {
  try {
    // Fetch all face descriptors
    // Note: For large scale, use pgvector extension. For small scale (<10k), this is fine.
    const result = await db.query('SELECT santri_id, face_descriptor FROM santri_face_data');
    
    let bestMatch = null;
    let minDistance = 0.6; // Threshold for face-api.js (usually 0.6 is good)

    for (const row of result.rows) {
      const storedDescriptor = JSON.parse(row.face_descriptor);
      const distance = euclideanDistance(faceDescriptor, storedDescriptor);

      if (distance < minDistance) {
        minDistance = distance;
        bestMatch = row.santri_id;
      }
    }

    if (!bestMatch) {
      return null;
    }

    // Fetch santri details
    const santriResult = await db.query(
      `SELECT s.id, s.nama, s.nis, s.foto_url, k.nama as kelas 
       FROM santri s
       LEFT JOIN kelas k ON s.kelas_diniyah_id = k.id
       WHERE s.id = $1`,
      [bestMatch]
    );

    return santriResult.rows[0] || null;
  } catch (error) {
    console.error('Error in identifySantri:', error);
    throw new AppError('Gagal mengidentifikasi wajah', 500);
  }
}

/**
 * Record attendance for a prayer
 * @param {number} santriId 
 * @param {string} sholat - Subuh, Dzuhur, Ashar, Maghrib, Isya
 * @param {string} status - Hadir, Sakit, Izin, Alpha
 * @param {string} keterangan 
 */
async function recordAttendance(santriId, sholat, status = 'Hadir', keterangan = null) {
  const validSholat = ['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'];
  if (!validSholat.includes(sholat)) {
    throw new ValidationError('Jenis sholat tidak valid');
  }

  try {
    const result = await db.query(
      `INSERT INTO absensi_sholat (santri_id, tanggal, sholat, status, waktu_scan, keterangan)
       VALUES ($1, CURRENT_DATE, $2, $3, NOW(), $4)
       ON CONFLICT (santri_id, tanggal, sholat) 
       DO UPDATE SET status = EXCLUDED.status, waktu_scan = NOW(), keterangan = EXCLUDED.keterangan
       RETURNING id`,
      [santriId, sholat, status, keterangan]
    );

    return { success: true, id: result.rows[0].id };
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    console.error('Error in recordAttendance:', error);
    throw new AppError('Gagal mencatat absensi', 500);
  }
}

/**
 * Get today's attendance summary
 * @returns {Promise<Array>}
 */
async function getTodayAttendance() {
  try {
    const result = await db.query(
      `SELECT a.id, a.santri_id, a.tanggal, a.sholat, a.status, a.waktu_scan,
              s.nama as santri_nama, s.nis as santri_nis, k.nama as kelas_nama,
              o.no_hp_ayah, o.no_hp_ibu
       FROM absensi_sholat a
       JOIN santri s ON a.santri_id = s.id
       LEFT JOIN kelas k ON s.kelas_diniyah_id = k.id
       LEFT JOIN orangtua o ON s.orangtua_id = o.id
       WHERE a.tanggal = CURRENT_DATE
       ORDER BY a.waktu_scan DESC`
    );
    return result.rows;
  } catch (error) {
    console.error('Error in getTodayAttendance:', error);
    throw new AppError('Gagal mengambil data absensi hari ini', 500);
  }
}

/**
 * Get attendance recap with filters
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 * @param {number} kelasId 
 * @param {string} sholat 
 * @param {string} jenisKelamin 
 * @param {number} kamarId 
 * @returns {Promise<Array>}
 */
async function getAttendanceRecap(startDate = null, endDate = null, kelasId = null, sholat = null, jenisKelamin = null, kamarId = null, status = null) {
  try {
    const query = `
      SELECT a.id, a.tanggal, a.sholat, a.status, a.waktu_scan,
             s.nama as santri_nama, s.nis as santri_nis, k.nama as kelas_nama,
             s.jenis_kelamin, s.kamar_id, km.nama as kamar_nama
      FROM absensi_sholat a
      JOIN santri s ON a.santri_id = s.id
      LEFT JOIN kelas k ON s.kelas_diniyah_id = k.id
      LEFT JOIN kamar km ON s.kamar_id = km.id
      WHERE ($1::DATE IS NULL OR a.tanggal >= $1::DATE)
        AND ($2::DATE IS NULL OR a.tanggal <= $2::DATE)
        AND ($3::INTEGER IS NULL OR s.kelas_diniyah_id = $3::INTEGER)
        AND ($4::TEXT IS NULL OR a.sholat = $4::TEXT)
        AND ($5::TEXT IS NULL OR s.jenis_kelamin = $5::TEXT)
        AND ($6::INTEGER IS NULL OR s.kamar_id = $6::INTEGER)
        AND ($7::TEXT IS NULL OR a.status = $7::TEXT)
      ORDER BY a.tanggal DESC, a.waktu_scan DESC
    `;
    
    const result = await db.query(query, [startDate, endDate, kelasId, sholat, jenisKelamin, kamarId, status]);
    return result.rows;
  } catch (error) {
    console.error('Error in getAttendanceRecap:', error);
    throw new AppError('Gagal mengambil data rekap absensi', 500);
  }
}

/**
 * Get santri who have not attended for a specific prayer and date
 * @param {string} sholat 
 * @param {string} date - YYYY-MM-DD
 * @returns {Promise<Array>}
 */
async function getUnattendedSantri(sholat, date) {
  try {
    const query = `
      SELECT s.id, s.nama, s.nis, k.nama as kelas_nama, s.kelas_diniyah_id, s.kamar_id
      FROM santri s
      LEFT JOIN kelas k ON s.kelas_diniyah_id = k.id
      WHERE s.id NOT IN (
        SELECT santri_id FROM absensi_sholat WHERE sholat = $1 AND tanggal = $2
      )
      ORDER BY s.nama ASC
    `;
    
    const result = await db.query(query, [sholat, date]);
    return result.rows;
  } catch (error) {
    console.error('Error in getUnattendedSantri:', error);
    throw new AppError('Gagal mengambil data santri yang belum absen', 500);
  }
}

module.exports = {
  registerFace,
  identifySantri,
  recordAttendance,
  getTodayAttendance,
  getAttendanceRecap,
  getUnattendedSantri
};
