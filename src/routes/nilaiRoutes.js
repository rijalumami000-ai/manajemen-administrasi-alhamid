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
      const data = await NilaiService.getKriteriaNilai(tingkat, mapelId);
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
      const { tahun_ajaran_id } = req.query;
      const data = await NilaiService.getSantriForReport(tahun_ajaran_id);
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
      const data = await NilaiService.getMapelTingkat();
      res.json(data);
    } catch (error) {
      next(error);
    }
  });

  router.post('/mapel-tingkat', async (req, res, next) => {
    try {
      const { tingkat, mapelIds } = req.body;
      const data = await NilaiService.saveMapelTingkat(tingkat, mapelIds);
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

  router.get('/rapor-cetak/:tahun_ajaran_id/:kelas_id/:kategori_id/:santri_id', async (req, res, next) => {
    try {
      const { tahun_ajaran_id, kelas_id, kategori_id, santri_id } = req.params;
      const data = await NilaiService.getCetakRapor(tahun_ajaran_id, kelas_id, kategori_id, santri_id);
      res.json(data);
    } catch (error) {
      next(error);
    }
  });

  app.use('/api/nilai', router);
}

module.exports = registerNilaiRoutes;
