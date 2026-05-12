const db = require('../../db');

function registerPesertaUjianRoutes(app) {

  // === GET: Data peserta ujian (dengan filter tahun ajaran + semester + kelas) ===
  app.get('/api/peserta-ujian', async (req, res) => {
    try {
      const { tahun_ajaran_id, semester, kelas_diniyah_id } = req.query;
      if (!tahun_ajaran_id || !semester) {
        return res.status(400).json({ error: 'tahun_ajaran_id dan semester wajib diisi.' });
      }

      let where = `pu.tahun_ajaran_id = $1 AND pu.semester = $2`;
      let params = [tahun_ajaran_id, semester];

      if (kelas_diniyah_id) {
        params.push(kelas_diniyah_id);
        where += ` AND pu.kelas_diniyah_id = $${params.length}`;
      }

      const result = await db.query(`
        SELECT
          pu.id, pu.no_peserta, pu.urutan_kelas, pu.urutan_di_kelas, pu.urutan_global,
          pu.semester, pu.tahun_ajaran_id, pu.kelas_diniyah_id,
          s.id AS santri_id, s.nis, s.nama, s.jenis_kelamin,
          s.tempat_lahir, s.tanggal_lahir, s.alamat, s.foto_url,
          kd.nama AS nama_kelas,
          kd.tingkat AS tingkat_kelas,
          ta.kode AS tahun_ajaran,
          o.nama_ayah, o.nama_ibu
        FROM peserta_ujian pu
        JOIN santri s ON pu.santri_id = s.id
        JOIN tahun_ajaran ta ON pu.tahun_ajaran_id = ta.id
        LEFT JOIN kelas kd ON pu.kelas_diniyah_id = kd.id
        LEFT JOIN orangtua o ON s.orangtua_id = o.id
        WHERE ${where}
        ORDER BY pu.urutan_kelas ASC, pu.urutan_di_kelas ASC
      `, params);

      res.json(result.rows);
    } catch (err) {
      console.error('Error GET peserta-ujian:', err);
      res.status(500).json({ error: 'Gagal memuat data peserta ujian.' });
    }
  });

  // === POST: Generate nomor peserta otomatis ===
  app.post('/api/peserta-ujian/generate', async (req, res) => {
    const { tahun_ajaran_id, semester } = req.body;
    if (!tahun_ajaran_id || !semester) {
      return res.status(400).json({ error: 'tahun_ajaran_id dan semester wajib diisi.' });
    }

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // Hapus data lama untuk tahun + semester ini
      await client.query(
        `DELETE FROM peserta_ujian WHERE tahun_ajaran_id = $1 AND semester = $2`,
        [tahun_ajaran_id, semester]
      );

      // Ambil semua santri aktif di tahun ajaran ini, dengan kelas diniyah, diurutkan kelas (tingkat + nama) lalu nama santri
      const santriResult = await client.query(`
        SELECT
          s.id AS santri_id,
          s.nama,
          s.nis,
          COALESCE(sta.kelas_diniyah_id, s.kelas_diniyah_id) AS kelas_diniyah_id,
          kd.nama AS nama_kelas,
          kd.tingkat AS tingkat_kelas
        FROM santri s
        JOIN santri_tahun_ajaran sta ON sta.santri_id = s.id AND sta.tahun_ajaran_id = $1
        LEFT JOIN kelas kd ON COALESCE(sta.kelas_diniyah_id, s.kelas_diniyah_id) = kd.id
        WHERE sta.status IN ('aktif', 'tidak_naik')
          AND ($2 = 'Ganjil' AND COALESCE(sta.aktif_ganjil, TRUE) = TRUE
            OR $2 = 'Genap' AND COALESCE(sta.aktif_genap, TRUE) = TRUE)
        ORDER BY COALESCE(kd.tingkat, 999) ASC, kd.nama ASC NULLS LAST, s.nama ASC
      `, [tahun_ajaran_id, semester]);

      const santriList = santriResult.rows;
      if (santriList.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Tidak ada santri aktif di tahun ajaran dan semester ini.' });
      }

      // Tentukan urutan kelas unik
      const kelasMap = {}; // kelas_diniyah_id -> urutan_kelas
      let kelasCounter = 1;
      for (const s of santriList) {
        const kid = s.kelas_diniyah_id || 'null';
        if (!(kid in kelasMap)) {
          kelasMap[kid] = kelasCounter++;
        }
      }

      // Hitung urutan per kelas
      const kelasCounters = {}; // kelas_diniyah_id -> urutan_di_kelas counter

      const insertData = [];
      for (let i = 0; i < santriList.length; i++) {
        const s = santriList[i];
        const kid = s.kelas_diniyah_id || 'null';
        const urnKelas = kelasMap[kid];

        if (!(kid in kelasCounters)) kelasCounters[kid] = 1;
        const urnDiKelas = kelasCounters[kid]++;
        const urnGlobal = i + 1;

        // Format: 02-01-024
        const noPeserta = [
          String(urnKelas).padStart(2, '0'),
          String(urnDiKelas).padStart(2, '0'),
          String(urnGlobal).padStart(3, '0'),
        ].join('-');

        insertData.push({
          tahun_ajaran_id,
          semester,
          santri_id: s.santri_id,
          kelas_diniyah_id: s.kelas_diniyah_id || null,
          no_peserta: noPeserta,
          urutan_kelas: urnKelas,
          urutan_di_kelas: urnDiKelas,
          urutan_global: urnGlobal,
        });
      }

      // Bulk insert
      for (const d of insertData) {
        await client.query(`
          INSERT INTO peserta_ujian
            (tahun_ajaran_id, semester, santri_id, kelas_diniyah_id, no_peserta, urutan_kelas, urutan_di_kelas, urutan_global)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (tahun_ajaran_id, semester, santri_id)
          DO UPDATE SET
            kelas_diniyah_id = $4,
            no_peserta = $5,
            urutan_kelas = $6,
            urutan_di_kelas = $7,
            urutan_global = $8,
            updated_at = NOW()
        `, [d.tahun_ajaran_id, d.semester, d.santri_id, d.kelas_diniyah_id,
            d.no_peserta, d.urutan_kelas, d.urutan_di_kelas, d.urutan_global]);
      }

      await client.query('COMMIT');
      res.json({
        message: `✅ Berhasil membuat ${insertData.length} nomor peserta ujian.`,
        total: insertData.length,
        data: insertData,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error generate peserta-ujian:', err);
      res.status(500).json({ error: 'Gagal membuat nomor peserta ujian: ' + err.message });
    } finally {
      client.release();
    }
  });

  // === DELETE: Reset nomor peserta untuk tahun + semester tertentu ===
  app.delete('/api/peserta-ujian', async (req, res) => {
    const { tahun_ajaran_id, semester } = req.query;
    if (!tahun_ajaran_id || !semester) {
      return res.status(400).json({ error: 'tahun_ajaran_id dan semester wajib diisi.' });
    }
    try {
      const result = await db.query(
        `DELETE FROM peserta_ujian WHERE tahun_ajaran_id = $1 AND semester = $2`,
        [tahun_ajaran_id, semester]
      );
      res.json({ message: `${result.rowCount} nomor peserta berhasil dihapus.` });
    } catch (err) {
      console.error('Error DELETE peserta-ujian:', err);
      res.status(500).json({ error: 'Gagal menghapus data peserta ujian.' });
    }
  });

  // === GET: Verifikasi peserta ujian (Publik, tanpa auth) ===
  app.get('/api/public/verify/:no_peserta', async (req, res) => {
    try {
      const { no_peserta } = req.params;
      if (!no_peserta) {
        return res.status(400).json({ error: 'Nomor peserta wajib diisi.' });
      }

      const result = await db.query(`
        SELECT
          pu.no_peserta, pu.semester,
          s.nis, s.nama, s.jenis_kelamin,
          s.tempat_lahir, s.tanggal_lahir, s.alamat, s.foto_url,
          kd.nama AS nama_kelas,
          ta.kode AS tahun_ajaran
        FROM peserta_ujian pu
        JOIN santri s ON pu.santri_id = s.id
        JOIN tahun_ajaran ta ON pu.tahun_ajaran_id = ta.id
        LEFT JOIN kelas kd ON pu.kelas_diniyah_id = kd.id
        WHERE pu.no_peserta = $1
      `, [no_peserta]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Data peserta ujian tidak ditemukan.' });
      }

      res.json(result.rows[0]);
    } catch (err) {
      console.error('Error GET verify peserta-ujian:', err);
      res.status(500).json({ error: 'Gagal memuat data verifikasi.' });
    }
  });

}

module.exports = registerPesertaUjianRoutes;
