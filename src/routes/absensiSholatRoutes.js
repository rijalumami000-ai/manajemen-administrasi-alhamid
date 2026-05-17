const absensiSholatService = require('../services/absensiSholatService');
const faceRecognitionService = require('../services/faceRecognitionService');
const { asyncHandler } = require('../utils/errorHandler');
const { authenticateToken } = require('../middleware/authMiddleware');
const https = require('https');
const multer = require('multer');
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

function registerAbsensiSholatRoutes(app) {
  /**
   * POST /api/absensi-sholat/register-face
   * Body: { santriId, faceDescriptor }
   * Returns: { success, id }
   */
  app.post('/api/absensi-sholat/register-face', authenticateToken, asyncHandler(async (req, res) => {
    const { santriId, faceDescriptor } = req.body;
    
    // Optional: Check if user is admin or ustadz
    // if (req.user.role !== 'admin' && req.user.role !== 'ustadz') {
    //   return res.status(403).json({ error: 'Akses ditolak' });
    // }

    const result = await absensiSholatService.registerFace(santriId, faceDescriptor);
    res.json(result);
  }));

  /**
   * POST /api/absensi-sholat/register-palm
   * Body: { santriId, palmDescriptor }
   */
  app.post('/api/absensi-sholat/register-palm', authenticateToken, asyncHandler(async (req, res) => {
    const { santriId, palmDescriptor } = req.body;
    const result = await absensiSholatService.registerPalm(santriId, palmDescriptor);
    res.json(result);
  }));

  /**
   * GET /api/tts
   * Query: { text }
   * Returns: audio/mpeg stream
   */
  app.get('/api/tts', asyncHandler(async (req, res) => {
    const { text } = req.query;
    if (!text) {
      return res.status(400).send('Text harus diisi');
    }

    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=id&client=tw-ob`;
    
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    };

    https.get(url, options, (response) => {
      if (response.statusCode !== 200) {
        return res.status(response.statusCode).send('Gagal mengambil suara dari Google');
      }
      res.setHeader('Content-Type', 'audio/mpeg');
      response.pipe(res);
    }).on('error', (err) => {
      console.error('TTS Proxy Error:', err);
      res.status(500).send('Error generating TTS');
    });
  }));

  /**
   * POST /api/absensi-sholat/scan
   * Body: { faceDescriptor, sholat }
   * Returns: { success, match: { id, nama, nis, kelas }, attendanceId }
   */
   app.post('/api/absensi-sholat/scan', asyncHandler(async (req, res) => {
    const { faceDescriptor, palmDescriptor, sholat } = req.body;

    if ((!faceDescriptor && !palmDescriptor) || !sholat) {
      return res.status(400).json({ error: 'Data biometrik (wajah/tangan) dan jenis sholat harus diisi' });
    }

    let match = null;
    if (faceDescriptor) {
      match = await absensiSholatService.identifySantri(faceDescriptor);
    } else if (palmDescriptor) {
      match = await absensiSholatService.identifySantriByPalm(palmDescriptor);
    }

    if (!match) {
      return res.status(404).json({ success: false, message: 'Biometrik tidak dikenali' });
    }

    // 2. Record attendance
    const attendanceResult = await absensiSholatService.recordAttendance(match.id, sholat, 'Hadir');

    res.json({
      success: true,
      match,
      attendanceId: attendanceResult.id
    });
  }));

  app.post('/api/absensi-sholat/scan-image', upload.single('image'), asyncHandler(async (req, res) => {
    const { sholat } = req.body;
    const imageFile = req.file;

    if (!imageFile) {
      return res.status(400).json({ error: 'File gambar wajah harus dikirim' });
    }

    if (!sholat) {
      return res.status(400).json({ error: 'Jenis sholat harus diisi' });
    }

    const fs = require('fs');
    const path = require('path');
    try {
      fs.writeFileSync(path.resolve(__dirname, '../../tmp_face_debug.jpg'), imageFile.buffer);
    } catch (e) {
      console.error("Failed to save debug face file:", e);
    }

    // 1. Extract descriptor using faceRecognitionService
    const faceDescriptor = await faceRecognitionService.extractDescriptor(imageFile.buffer);

    if (!faceDescriptor) {
      return res.status(400).json({ success: false, message: 'Wajah tidak terdeteksi pada gambar' });
    }

    // 2. Identify santri from descriptor
    const match = await absensiSholatService.identifySantri(faceDescriptor);

    if (!match) {
      return res.status(404).json({ success: false, message: 'Wajah tidak dikenali' });
    }

    // 3. Record attendance
    const attendanceResult = await absensiSholatService.recordAttendance(match.id, sholat, 'Hadir');

    res.json({
      success: true,
      match,
      attendanceId: attendanceResult.id
    });
  }));

  /**
   * POST /api/absensi-sholat/manual
   * Body: { santriId, sholat, status, keterangan }
   * Returns: { success, id }
   */
  app.post('/api/absensi-sholat/manual', authenticateToken, asyncHandler(async (req, res) => {
    const { santriId, sholat, status, keterangan } = req.body;

    if (!santriId || !sholat || !status) {
      return res.status(400).json({ error: 'SantriId, sholat, dan status harus diisi' });
    }

    const result = await absensiSholatService.recordAttendance(santriId, sholat, status, keterangan);
    res.json(result);
  }));

  /**
   * GET /api/absensi-sholat/today
   * Returns: Array of today's attendance
   */
  app.get('/api/absensi-sholat/today', asyncHandler(async (req, res) => {
    const result = await absensiSholatService.getTodayAttendance();
    res.json(result);
  }));

  /**
   * GET /api/absensi-sholat/unattended
   * Query: { sholat, date }
   * Returns: Array of santri who have not attended
   */
  app.get('/api/absensi-sholat/unattended', authenticateToken, asyncHandler(async (req, res) => {
    const { sholat, date } = req.query;
    
    if (!sholat || !date) {
      return res.status(400).json({ error: 'Sholat dan date harus diisi' });
    }

    const result = await absensiSholatService.getUnattendedSantri(sholat, date);
    res.json(result);
  }));

  /**
   * GET /api/absensi-sholat/rekap
   * Query: { startDate, endDate, kelasId }
   * Returns: Array of attendance records
   */
  app.get('/api/absensi-sholat/rekap', authenticateToken, asyncHandler(async (req, res) => {
    const { startDate, endDate, kelasId, sholat, jenisKelamin, kamarId, status, tahunAjaranId, semester } = req.query;
    const result = await absensiSholatService.getAttendanceRecap(startDate, endDate, kelasId, sholat, jenisKelamin, kamarId, status, tahunAjaranId, semester);
    res.json(result);
  }));
}

module.exports = registerAbsensiSholatRoutes;
