const express = require('express');
const NilaiService = require('../services/nilaiService');

function registerNilaiRoutes(app) {
  const router = express.Router();

  // Kategori Evaluasi
  router.get('/kategori', async (req, res, next) => {
    try {
      const data = await NilaiService.getKategoriEvaluasi();
      res.json(data);
    } catch (error) {
      next(error);
    }
  });

  // Setting Kriteria
  router.get('/kriteria/:tingkat/:mapelId', async (req, res, next) => {
    try {
      const { tingkat, mapelId } = req.params;
      const { tahun_ajaran_id, kategori_evaluasi_id } = req.query;
      const data = await NilaiService.getKriteriaNilai(tingkat, mapelId, tahun_ajaran_id, kategori_evaluasi_id);
      res.json(data);
    } catch (error) {
      next(error);
    }
  });

  router.post('/kriteria', async (req, res, next) => {
    try {
      const data = await NilaiService.saveKriteriaNilai(req.body);
      res.json(data);
    } catch (error) {
      next(error);
    }
  });

  // Rekap Nilai
  router.get('/rekap', async (req, res, next) => {
    try {
      const { tahun_ajaran_id, kelas_id, kategori_evaluasi_id } = req.query;
      if (!tahun_ajaran_id || !kelas_id) {
        return res.status(400).json({ error: 'tahun_ajaran_id dan kelas_id dibutuhkan' });
      }
      const data = await NilaiService.getRekapNilai(
        tahun_ajaran_id,
        kelas_id,
        kategori_evaluasi_id || null
      );
      res.json(data);
    } catch (error) {
      next(error);
    }
  });

  router.get('/santri', async (req, res, next) => {
    try {
      // expected query: tahun_ajaran_id, kelas_id, mapel_id, kategori_id (optional for khusus)
      const { tahun_ajaran_id, kelas_id, mapel_id, kategori_id } = req.query;
      const data = await NilaiService.getNilaiSantri(tahun_ajaran_id, kelas_id, mapel_id, kategori_id);
      res.json(data);
    } catch (error) {
      next(error);
    }
  });
  
  // Get all santri with class for search
  router.get('/santri-report', async (req, res, next) => {
    try {
      const { tahun_ajaran_id, kategori_id } = req.query;
      const data = await NilaiService.getSantriForReport(tahun_ajaran_id, kategori_id);
      res.json(data);
    } catch (error) {
      next(error);
    }
  });

  // Get accumulation for all classes
  router.get('/akumulasi-kelas', async (req, res, next) => {
    try {
      const { tahun_ajaran_id, mapel_id, kategori_id } = req.query;
      const data = await NilaiService.getAkumulasiSemuaKelas(tahun_ajaran_id, mapel_id, kategori_id);
      res.json(data);
    } catch (error) {
      next(error);
    }
  });

  router.post('/santri/bulk', async (req, res, next) => {
    try {
      const { tahun_ajaran_id, mata_pelajaran_id, kategori_evaluasi_id, data } = req.body;
      const result = await NilaiService.saveNilaiBulk(tahun_ajaran_id, mata_pelajaran_id, kategori_evaluasi_id, data);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  // Mapel Tingkat (Jadwal Pelajaran)
  router.get('/mapel-tingkat', async (req, res, next) => {
    try {
      const { tahun_ajaran_id, kategori_evaluasi_id } = req.query;
      const data = await NilaiService.getMapelTingkat(tahun_ajaran_id, kategori_evaluasi_id);
      res.json(data);
    } catch (error) {
      next(error);
    }
  });

  router.post('/mapel-tingkat', async (req, res, next) => {
    try {
      const { tingkat, mapelIds, tahun_ajaran_id, kategori_evaluasi_id } = req.body;
      const data = await NilaiService.saveMapelTingkat(tingkat, mapelIds, tahun_ajaran_id, kategori_evaluasi_id);
      res.json(data);
    } catch (error) {
      next(error);
    }
  });

  // Rapor Data (Kepribadian, Absensi, Catatan)
  router.get('/rapor', async (req, res, next) => {
    try {
      const { tahun_ajaran_id, kelas_id, kategori_evaluasi_id } = req.query;
      if (!tahun_ajaran_id || !kelas_id || !kategori_evaluasi_id) {
        return res.status(400).json({ error: 'tahun_ajaran_id, kelas_id, dan kategori_evaluasi_id dibutuhkan' });
      }
      const data = await NilaiService.getRaporData(tahun_ajaran_id, kelas_id, kategori_evaluasi_id);
      res.json(data);
    } catch (error) {
      next(error);
    }
  });

  router.post('/rapor/bulk', async (req, res, next) => {
    try {
      const { tahun_ajaran_id, kategori_evaluasi_id, data } = req.body;
      if (!tahun_ajaran_id || !kategori_evaluasi_id || !data) {
        return res.status(400).json({ error: 'Data tidak lengkap' });
      }
      const result = await NilaiService.saveRaporBulk(tahun_ajaran_id, kategori_evaluasi_id, data);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  router.post('/peringkat-manual', async (req, res, next) => {
    try {
      const { tahun_ajaran_id, kategori_evaluasi_id, data } = req.body;
      if (!tahun_ajaran_id || !kategori_evaluasi_id || !data) {
        return res.status(400).json({ error: 'Data tidak lengkap' });
      }
      const result = await NilaiService.savePeringkatManual(tahun_ajaran_id, kategori_evaluasi_id, data);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  router.get('/rapor-cetak/:tahun_ajaran_id/:kelas_id/:kategori_id/:santri_id', async (req, res, next) => {
    try {
      const { tahun_ajaran_id, kelas_id, kategori_id, santri_id } = req.params;
      const data = await NilaiService.getCetakRapor(tahun_ajaran_id, kelas_id, kategori_id, santri_id);
      res.json(data);
    } catch (error) {
      next(error);
    }
  });

  // Direct USB Scanner Integration via WIA / PowerShell
  router.post('/scanner/scan', async (req, res, next) => {
    const { exec } = require('child_process');
    const path = require('path');
    const fs = require('fs');

    try {
      const tempDir = path.join(__dirname, '../../tmp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const psScriptPath = path.join(tempDir, `scan_script_${Date.now()}.ps1`);
      const tempImgPath = path.join(tempDir, `scan_out_${Date.now()}.jpg`);
      
      const psScriptContent = `
$deviceManager = New-Object -ComObject WIA.DeviceManager
$device = $null
foreach ($info in $deviceManager.DeviceInfos) {
    if ($info.Type -eq 1) {
        $device = $info.Connect()
        break
    }
}
if ($device -eq $null) {
    Write-Host "ERROR_NO_SCANNER"
    exit 1
}
$item = $device.Items.Item(1)
try {
    $intentProp = $item.Properties.Item("6146")
    if ($intentProp) { $intentProp.Value = 1 }
} catch {}
$wiaFormatJPEG = "{B96B3CAE-0728-11D3-9D7B-0000F81EF32E}"
$image = $item.Transfer($wiaFormatJPEG)
$targetPath = "${tempImgPath.replace(/\\/g, '\\\\')}"
if (Test-Path $targetPath) { Remove-Item $targetPath }
$image.SaveFile($targetPath)
Write-Host "SCAN_SUCCESS"
`;

      fs.writeFileSync(psScriptPath, psScriptContent, 'utf-8');

      exec(`powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${psScriptPath}"`, (error, stdout, stderr) => {
        // Cleanup script file immediately
        try { fs.unlinkSync(psScriptPath); } catch (_) {}

        if (error) {
          console.error("Scanner CLI Error:", error, stderr);
          return res.status(500).json({ error: "Terjadi kesalahan internal saat mengakses scanner." });
        }
        
        if (stdout.includes("ERROR_NO_SCANNER")) {
          return res.status(404).json({ error: "Scanner USB tidak ditemukan. Pastikan kabel USB scanner Epson terhubung dan menyala." });
        }

        if (fs.existsSync(tempImgPath)) {
          const fileBuffer = fs.readFileSync(tempImgPath);
          const base64Image = fileBuffer.toString('base64');
          const dataUrl = `data:image/jpeg;base64,${base64Image}`;
          
          // Cleanup image file
          try { fs.unlinkSync(tempImgPath); } catch (_) {}

          res.json({ success: true, image: dataUrl });
        } else {
          res.status(500).json({ error: "Gagal menghasilkan file gambar dari scanner." });
        }
      });
      
    } catch (error) {
      next(error);
    }
  });

  // Process image using Python OMR Engine
  router.post('/scanner/process', express.json({limit: '50mb'}), async (req, res, next) => {
    const { exec } = require('child_process');
    const path = require('path');
    const fs = require('fs');

    try {
      const { image } = req.body; 
      if (!image) {
        return res.status(400).json({ error: 'Data gambar tidak ditemukan' });
      }

      const tempDir = path.join(__dirname, '../../tmp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      const tempImgPath = path.join(tempDir, `process_in_${Date.now()}.jpg`);
      
      fs.writeFileSync(tempImgPath, base64Data, { encoding: 'base64' });

      const pythonScript = path.join(__dirname, '../utils/omr_engine.py');
      
      exec(`python "${pythonScript}" "${tempImgPath}"`, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
        try { fs.unlinkSync(tempImgPath); } catch (_) {}

        if (error) {
          console.error("Python OMR Error:", error, stderr);
          return res.status(500).json({ error: "Gagal memproses gambar OMR di backend." });
        }
        
        try {
            const result = JSON.parse(stdout);
            res.json(result);
        } catch(e) {
            console.error("Failed to parse Python JSON:", stdout);
            res.status(500).json({ error: "Format respons dari AI OMR tidak valid." });
        }
      });
      
    } catch (error) {
      next(error);
    }
  });

  router.get('/muhafadzoh-info', async (req, res, next) => {
    const db = require('../../db');
    const { tahun_ajaran_id, kategori_evaluasi_id } = req.query;

    if (!tahun_ajaran_id || !kategori_evaluasi_id) {
      return res.status(400).json({ error: 'tahun_ajaran_id dan kategori_evaluasi_id wajib disertakan.' });
    }

    try {
      const key = `muhafadzoh_info_${tahun_ajaran_id}_${kategori_evaluasi_id}`;
      const result = await db.query('SELECT value FROM system_settings WHERE key = $1 LIMIT 1', [key]);
      
      if (result.rows.length > 0) {
        return res.json(JSON.parse(result.rows[0].value));
      }

      // Check if requested year is active
      const activeYearRes = await db.query('SELECT id FROM tahun_ajaran WHERE is_active = true LIMIT 1');
      const activeYearId = activeYearRes.rows[0]?.id;

      if (activeYearId && Number(tahun_ajaran_id) === activeYearId) {
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
    } catch (error) {
      next(error);
    }
  });

  router.post('/muhafadzoh-info', async (req, res, next) => {
    const db = require('../../db');
    const { tahun_ajaran_id, kategori_evaluasi_id, data } = req.body;

    if (!tahun_ajaran_id || !kategori_evaluasi_id || !Array.isArray(data)) {
      return res.status(400).json({ error: 'tahun_ajaran_id, kategori_evaluasi_id, dan data (array) wajib diisi.' });
    }

    try {
      const key = `muhafadzoh_info_${tahun_ajaran_id}_${kategori_evaluasi_id}`;
      await db.query(
        "INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2",
        [key, JSON.stringify(data)]
      );
      res.json({ success: true, message: 'Ketentuan nilai muhafadzoh berhasil diperbarui.' });
    } catch (error) {
      next(error);
    }
  });

  router.get('/qiroah-maqro', async (req, res, next) => {
    const db = require('../../db');
    const { tahun_ajaran_id, kategori_evaluasi_id } = req.query;

    if (!tahun_ajaran_id || !kategori_evaluasi_id) {
      return res.status(400).json({ error: 'tahun_ajaran_id dan kategori_evaluasi_id wajib disertakan.' });
    }

    try {
      const key = `qiroah_maqro_${tahun_ajaran_id}_${kategori_evaluasi_id}`;
      const result = await db.query('SELECT value FROM system_settings WHERE key = $1 LIMIT 1', [key]);
      
      if (result.rows.length > 0) {
        return res.json(JSON.parse(result.rows[0].value));
      }

      // Check if requested year is active
      const activeYearRes = await db.query('SELECT id FROM tahun_ajaran WHERE is_active = true LIMIT 1');
      const activeYearId = activeYearRes.rows[0]?.id;

      if (activeYearId && Number(tahun_ajaran_id) === activeYearId) {
        // Default fallback for Maqro Qiroatul Kitab
        const defaultData = [
          {
            kelas: "Sifir",
            maqro: [
              "س : ما ذا تقول في الجلوس للتشهد الأخير ج :",
              "س : ما ذا تقول بعد التشهد الأخير ج :"
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
              "الأموال التي تلزم فيها الزكاة"
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
              "فصل في عدد مبطلات الصلاة",
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
              "كتاب احكام الجنايات",
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
    } catch (error) {
      next(error);
    }
  });

  router.post('/qiroah-maqro', async (req, res, next) => {
    const db = require('../../db');
    const { tahun_ajaran_id, kategori_evaluasi_id, data } = req.body;

    if (!tahun_ajaran_id || !kategori_evaluasi_id || !Array.isArray(data)) {
      return res.status(400).json({ error: 'tahun_ajaran_id, kategori_evaluasi_id, dan data (array) wajib diisi.' });
    }

    try {
      const key = `qiroah_maqro_${tahun_ajaran_id}_${kategori_evaluasi_id}`;
      await db.query(
        "INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2",
        [key, JSON.stringify(data)]
      );
      res.json({ success: true, message: 'Maqro qiroatul kitab berhasil diperbarui.' });
    } catch (error) {
      next(error);
    }
  });

  router.get('/taftisy-materi', async (req, res, next) => {
    const db = require('../../db');
    const { tahun_ajaran_id, kategori_evaluasi_id, kelas_id } = req.query;

    if (!tahun_ajaran_id || !kategori_evaluasi_id || !kelas_id) {
      return res.status(400).json({ error: 'tahun_ajaran_id, kategori_evaluasi_id, dan kelas_id wajib disertakan.' });
    }

    try {
      const key = `taftisy_materi_${tahun_ajaran_id}_${kategori_evaluasi_id}_${kelas_id}`;
      const result = await db.query('SELECT value FROM system_settings WHERE key = $1 LIMIT 1', [key]);
      
      if (result.rows.length > 0) {
        return res.json(JSON.parse(result.rows[0].value));
      }

      // Query the class information to get the tingkat
      const classRes = await db.query('SELECT nama, tingkat FROM kelas WHERE id = $1 LIMIT 1', [kelas_id]);
      const classInfo = classRes.rows[0];

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
        `, [classInfo.tingkat, tahun_ajaran_id, kategori_evaluasi_id]);

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

      if (activeYearId && Number(tahun_ajaran_id) === activeYearId && defaultData.length > 0) {
        // Auto initialize database entry for active year
        await db.query(
          "INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2",
          [key, JSON.stringify(defaultData)]
        );
      }

      return res.json(defaultData);
    } catch (error) {
      next(error);
    }
  });

  router.post('/taftisy-materi', async (req, res, next) => {
    const db = require('../../db');
    const { tahun_ajaran_id, kategori_evaluasi_id, kelas_id, data } = req.body;

    if (!tahun_ajaran_id || !kategori_evaluasi_id || !kelas_id || !Array.isArray(data)) {
      return res.status(400).json({ error: 'tahun_ajaran_id, kategori_evaluasi_id, kelas_id, dan data (array) wajib diisi.' });
    }

    try {
      const key = `taftisy_materi_${tahun_ajaran_id}_${kategori_evaluasi_id}_${kelas_id}`;
      await db.query(
        "INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2",
        [key, JSON.stringify(data)]
      );
      res.json({ success: true, message: 'Batasan materi taftisyul kutub berhasil diperbarui.' });
    } catch (error) {
      next(error);
    }
  });

  router.get('/materi-ujian-tulis', async (req, res, next) => {
    const db = require('../../db');
    const { tahun_ajaran_id, kategori_evaluasi_id, kelas_id } = req.query;

    if (!tahun_ajaran_id || !kategori_evaluasi_id || !kelas_id) {
      return res.status(400).json({ error: 'tahun_ajaran_id, kategori_evaluasi_id, dan kelas_id wajib disertakan.' });
    }

    try {
      const key = `materi_ujian_tulis_${tahun_ajaran_id}_${kategori_evaluasi_id}_${kelas_id}`;
      const result = await db.query('SELECT value FROM system_settings WHERE key = $1 LIMIT 1', [key]);
      
      if (result.rows.length > 0) {
        return res.json(JSON.parse(result.rows[0].value));
      }

      // Query the class information to get the tingkat
      const classRes = await db.query('SELECT nama, tingkat FROM kelas WHERE id = $1 LIMIT 1', [kelas_id]);
      const classInfo = classRes.rows[0];

      let defaultData = [];
      if (classInfo) {
        let tingkat = classInfo.tingkat;
        if (classInfo.nama === 'SP' && classInfo.tingkat === 1) {
          tingkat = 99;
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
        `, [tingkat, tahun_ajaran_id, kategori_evaluasi_id]);

        defaultData = mapelRes.rows.map(row => ({
          pelajaran: row.nama,
          batas_awal: "",
          batas_akhir: ""
        }));
      }

      // Check if requested year is active
      const activeYearRes = await db.query('SELECT id FROM tahun_ajaran WHERE is_active = true LIMIT 1');
      const activeYearId = activeYearRes.rows[0]?.id;

      if (activeYearId && Number(tahun_ajaran_id) === activeYearId && defaultData.length > 0) {
        // Auto initialize database entry for active year
        await db.query(
          "INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2",
          [key, JSON.stringify(defaultData)]
        );
      }

      return res.json(defaultData);
    } catch (error) {
      next(error);
    }
  });

  router.post('/materi-ujian-tulis', async (req, res, next) => {
    const db = require('../../db');
    const { tahun_ajaran_id, kategori_evaluasi_id, kelas_id, data } = req.body;

    if (!tahun_ajaran_id || !kategori_evaluasi_id || !kelas_id || !Array.isArray(data)) {
      return res.status(400).json({ error: 'tahun_ajaran_id, kategori_evaluasi_id, kelas_id, dan data (array) wajib diisi.' });
    }

    try {
      const key = `materi_ujian_tulis_${tahun_ajaran_id}_${kategori_evaluasi_id}_${kelas_id}`;
      await db.query(
        "INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2",
        [key, JSON.stringify(data)]
      );
      res.json({ success: true, message: 'Batasan materi ujian tulis berhasil diperbarui.' });
    } catch (error) {
      next(error);
    }
  });

  app.use('/api/nilai', router);
}

module.exports = registerNilaiRoutes;
