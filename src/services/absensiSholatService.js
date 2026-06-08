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
async function registerFace(santriId, faceDescriptors) {
  if (!santriId || !faceDescriptors || !Array.isArray(faceDescriptors)) {
    throw new ValidationError('Santri ID dan face descriptors (array) harus diisi');
  }

  try {
    // Check if santri exists
    const santriCheck = await db.query('SELECT id FROM santri WHERE id = $1', [santriId]);
    if (santriCheck.rows.length === 0) {
      throw new NotFoundError('Santri');
    }

    // --- PENCEGAHAN DUPLIKASI WAJAH (Multi-Angle) ---
    // Ambil semua data wajah yang sudah terdaftar KECUALI milik santri ini
    const allFaces = await db.query('SELECT santri_id, face_descriptor FROM santri_face_data WHERE santri_id != $1', [santriId]);
    
    const threshold = 0.45; // Threshold ketat untuk pendaftaran
    
    for (const row of allFaces.rows) {
      const storedData = JSON.parse(row.face_descriptor);
      const storedDescriptors = Array.isArray(storedData[0]) ? storedData : [storedData];
      
      for (const newDesc of faceDescriptors) {
        for (const storedDesc of storedDescriptors) {
          const distance = euclideanDistance(newDesc, storedDesc);
          if (distance < threshold) {
            const duplicateSantri = await db.query('SELECT nama FROM santri WHERE id = $1', [row.santri_id]);
            const namaSantri = duplicateSantri.rows[0]?.nama || 'santri lain';
            throw new ValidationError(`Wajah ini terdeteksi sangat mirip dengan "${namaSantri}". Pendaftaran ditolak untuk mencegah bentrok.`);
          }
        }
      }
    }
    // --- AKHIR PENCEGAHAN DUPLIKASI ---

    const descriptorStr = JSON.stringify(faceDescriptors);

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
 * Register palm descriptor for a santri
 * @param {number} santriId 
 * @param {Array<number>} palmDescriptor - Array of landmarks
 */
async function registerPalm(santriId, palmDescriptor) {
  if (!santriId || !palmDescriptor) {
    throw new ValidationError('Santri ID dan data telapak tangan harus diisi');
  }

  try {
    const santriCheck = await db.query('SELECT id FROM santri WHERE id = $1', [santriId]);
    if (santriCheck.rows.length === 0) throw new NotFoundError('Santri');

    // --- PENCEGAHAN DUPLIKASI TANGAN (Super Ketat) ---
    const allPalms = await db.query('SELECT santri_id, palm_descriptors FROM santri_face_data WHERE santri_id != $1 AND palm_descriptors IS NOT NULL', [santriId]);
    
    const threshold = 0.08; // Threshold sangat ketat untuk tangan (geometri landmark)
    
    for (const row of allPalms.rows) {
      const storedPalm = JSON.parse(row.palm_descriptors);
      const distance = euclideanDistance(palmDescriptor, storedPalm);
      
      if (distance < threshold) {
        const duplicateSantri = await db.query('SELECT nama FROM santri WHERE id = $1', [row.santri_id]);
        const namaSantri = duplicateSantri.rows[0]?.nama || 'santri lain';
        throw new ValidationError(`Telapak tangan ini sudah terdaftar atas nama "${namaSantri}". Satu tangan hanya boleh untuk satu santri.`);
      }
    }
    // --- AKHIR PENCEGAHAN DUPLIKASI ---

    const descriptorStr = JSON.stringify(palmDescriptor);

    const result = await db.query(
      `INSERT INTO santri_face_data (santri_id, palm_descriptors, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (santri_id) 
       DO UPDATE SET palm_descriptors = EXCLUDED.palm_descriptors, updated_at = NOW()
       RETURNING id`,
      [santriId, descriptorStr]
    );

    return { success: true, id: result.rows[0].id };
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) throw error;
    console.error('Error in registerPalm:', error);
    throw new AppError('Gagal mendaftarkan telapak tangan', 500);
  }
}

/**
 * Identify santri by face descriptor
 * @param {Array<number>} faceDescriptor - Array of 128 floats
 * @returns {Promise<Object|null>} - Santri data if found
 */
async function identifySantri(faceDescriptor) {
  try {
    // Ambil descriptor beserta nama santri untuk logging detail jarak Euclidean
    const result = await db.query(`
      SELECT fd.santri_id, fd.face_descriptor, s.nama 
      FROM santri_face_data fd
      JOIN santri s ON fd.santri_id = s.id
    `);
    
    let bestMatch = null;
    let minDistance = 0.63; // Threshold disesuaikan ke 0.63 untuk toleransi cahaya & sudut kamera depan HP yang ideal
    let closestName = "Tidak ada";
    let closestDistance = 999.0;

    console.log("=== MEMULAI PENCOCOKAN WAJAH ===");
    for (const row of result.rows) {
      const storedData = JSON.parse(row.face_descriptor);
      const storedDescriptors = Array.isArray(storedData[0]) ? storedData : [storedData];
      
      for (const storedDesc of storedDescriptors) {
        const distance = euclideanDistance(faceDescriptor, storedDesc);
        console.log(`- Jarak Euclidean ke "${row.nama}": ${distance.toFixed(4)} (Threshold: ${minDistance})`);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestName = row.nama;
        }

        if (distance < minDistance) {
          minDistance = distance;
          bestMatch = row.santri_id;
        }
      }
    }
    console.log(`=== HASIL COCOK: Best Match adalah "${closestName}" dengan jarak: ${closestDistance.toFixed(4)} ===`);

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
 * Identify santri by palm descriptor
 * @param {Array<number>} palmDescriptor 
 * @returns {Promise<Object|null>}
 */
async function identifySantriByPalm(palmDescriptor) {
  try {
    const result = await db.query('SELECT santri_id, palm_descriptors FROM santri_face_data WHERE palm_descriptors IS NOT NULL');
    
    let bestMatch = null;
    let minDistance = 0.15; // Threshold ketat untuk tangan (landmarks normalized)

    for (const row of result.rows) {
      const storedPalm = JSON.parse(row.palm_descriptors);
      const distance = euclideanDistance(palmDescriptor, storedPalm);

      if (distance < minDistance) {
        minDistance = distance;
        bestMatch = row.santri_id;
      }
    }

    if (!bestMatch) return null;

    const santriResult = await db.query(
      `SELECT s.id, s.nama, s.nis, s.foto_url, k.nama as kelas 
       FROM santri s
       LEFT JOIN kelas k ON s.kelas_diniyah_id = k.id
       WHERE s.id = $1`,
      [bestMatch]
    );

    return santriResult.rows[0];
  } catch (error) {
    console.error('Error in identifySantriByPalm:', error);
    return null;
  }
}

/**
 * Identify santri by QR Code
 * @param {string} qrCode 
 * @returns {Promise<Object|null>}
 */
async function identifySantriByQR(qrCode) {
  try {
    const santriResult = await db.query(
      `SELECT s.id, s.nama, s.nis, s.foto_url, k.nama as kelas 
       FROM santri s
       LEFT JOIN kelas k ON s.kelas_diniyah_id = k.id
       WHERE s.qr_code = $1`,
      [qrCode]
    );
    return santriResult.rows[0] || null;
  } catch (error) {
    console.error('Error in identifySantriByQR:', error);
    throw new AppError('Gagal mengidentifikasi QR Code', 500);
  }
}

/**
 * Identify santri by NFC UID
 * @param {string} nfcUid 
 * @returns {Promise<Object|null>}
 */
async function identifySantriByNFC(nfcUid) {
  try {
    const santriResult = await db.query(
      `SELECT s.id, s.nama, s.nis, s.foto_url, k.nama as kelas 
       FROM santri s
       LEFT JOIN kelas k ON s.kelas_diniyah_id = k.id
       WHERE s.nfc_uid = $1`,
      [nfcUid]
    );
    return santriResult.rows[0] || null;
  } catch (error) {
    console.error('Error in identifySantriByNFC:', error);
    throw new AppError('Gagal mengidentifikasi NFC', 500);
  }
}

/**
 * Identify santri by Fingerprint ID
 * @param {string} fingerprintId 
 * @returns {Promise<Object|null>}
 */
async function identifySantriByFingerprint(fingerprintId) {
  try {
    const santriResult = await db.query(
      `SELECT s.id, s.nama, s.nis, s.foto_url, k.nama as kelas 
       FROM santri s
       LEFT JOIN kelas k ON s.kelas_diniyah_id = k.id
       WHERE s.fingerprint_id = $1`,
      [fingerprintId]
    );
    return santriResult.rows[0] || null;
  } catch (error) {
    console.error('Error in identifySantriByFingerprint:', error);
    throw new AppError('Gagal mengidentifikasi Fingerprint', 500);
  }
}

/**
 * Record attendance for a prayer
 * @param {number} santriId 
 * @param {string} sholat - Subuh, Dzuhur, Ashar, Maghrib, Isya
 * @param {string} status - Hadir, Sakit, Izin, Alpha
 * @param {string} keterangan 
 */
async function recordAttendance(santriId, sholat, status = 'Hadir', keterangan = null, tahunAjaranId = null, semester = null) {
  const validSholat = ['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'];
  if (!validSholat.includes(sholat)) {
    throw new ValidationError('Jenis sholat tidak valid');
  }

  try {
    let finalYearId = tahunAjaranId;
    let finalSemester = semester;

    // Jika tidak dikirim dari frontend, ambil yang sedang aktif
    if (!finalYearId) {
      const activeYearResult = await db.query('SELECT id FROM tahun_ajaran WHERE is_active = TRUE LIMIT 1');
      finalYearId = activeYearResult.rows[0]?.id || null;
    }

    if (!finalSemester) {
      const month = new Date().getMonth() + 1;
      finalSemester = (month >= 7 && month <= 12) ? 'Ganjil' : 'Genap';
    }

    const result = await db.query(
      `INSERT INTO absensi_sholat (santri_id, tanggal, sholat, status, waktu_scan, keterangan, tahun_ajaran_id, semester)
       VALUES ($1, CURRENT_DATE, $2, $3, NOW(), $4, $5, $6)
       ON CONFLICT (santri_id, tanggal, sholat) 
       DO UPDATE SET status = EXCLUDED.status, waktu_scan = NOW(), keterangan = EXCLUDED.keterangan, tahun_ajaran_id = EXCLUDED.tahun_ajaran_id, semester = EXCLUDED.semester
       RETURNING id`,
      [santriId, sholat, status, keterangan, finalYearId, finalSemester]
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
async function getAttendanceRecap(startDate = null, endDate = null, kelasId = null, sholat = null, jenisKelamin = null, kamarId = null, status = null, tahunAjaranId = null, semester = null) {
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
        AND ($8::INTEGER IS NULL OR a.tahun_ajaran_id = $8::INTEGER)
        AND ($9::TEXT IS NULL OR a.semester = $9::TEXT)
      ORDER BY a.tanggal DESC, a.waktu_scan DESC
    `;
    
    const result = await db.query(query, [startDate, endDate, kelasId, sholat, jenisKelamin, kamarId, status, tahunAjaranId, semester]);
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
  registerPalm,
  identifySantri,
  identifySantriByPalm,
  recordAttendance,
  getTodayAttendance,
  getAttendanceRecap,
  getUnattendedSantri,
  identifySantriByQR,
  identifySantriByNFC,
  identifySantriByFingerprint
};
