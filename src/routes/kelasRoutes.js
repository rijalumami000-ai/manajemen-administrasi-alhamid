const db = require('../../db');
const { getActiveTahunAjaran, syncSantriToActiveTahunAjaran } = require('../services/tahunAjaranService');
const { isUniqueViolation } = require('../utils/databaseErrors');
const { normalizeKelasJenis, normalizeText, normalizeYearCode, nullableInt } = require('../utils/normalizers');

function registerKelasRoutes(app) {
  // ===== KELAS API =====
  app.get('/api/kelas', async (req, res) => {
    try {
      let tahun_ajaran_id = nullableInt(req.query.tahun_ajaran_id);
      if (!tahun_ajaran_id) {
        const activeYear = await getActiveTahunAjaran();
        if (activeYear) {
          tahun_ajaran_id = activeYear.id;
        }
      }

      let result;
      if (tahun_ajaran_id) {
        result = await db.query(`
          SELECT k.id, k.jenis, k.nama, k.tingkat, k.created_at,
                 COALESCE(kta.mustahiq_id, k.mustahiq_id) as mustahiq_id,
                 COALESCE(kta.muhafadzoh_mapel_id, k.muhafadzoh_mapel_id) as muhafadzoh_mapel_id,
                 COALESCE(kta.qiroatul_mapel_id, k.qiroatul_mapel_id) as qiroatul_mapel_id,
                 g.nama as mustahiq_nama, m.nama as muhafadzoh_nama, q.nama as qiroatul_nama 
          FROM kelas k
          LEFT JOIN kelas_tahun_ajaran kta ON k.id = kta.kelas_id AND kta.tahun_ajaran_id = $1
          LEFT JOIN guru g ON COALESCE(kta.mustahiq_id, k.mustahiq_id) = g.id
          LEFT JOIN mata_pelajaran m ON COALESCE(kta.muhafadzoh_mapel_id, k.muhafadzoh_mapel_id) = m.id
          LEFT JOIN mata_pelajaran q ON COALESCE(kta.qiroatul_mapel_id, k.qiroatul_mapel_id) = q.id
          WHERE (
            k.jenis = 'Sekolah'
            OR kta.id IS NOT NULL
            OR EXISTS (
              SELECT 1 FROM santri_tahun_ajaran sta 
              WHERE sta.kelas_diniyah_id = k.id AND sta.tahun_ajaran_id = $1
            )
          )
          ORDER BY k.jenis, 
            CASE 
              WHEN k.nama = 'SP' THEN 0.5
              WHEN k.tingkat = 0 THEN 0
              ELSE k.tingkat 
            END ASC, 
            k.nama ASC
        `, [tahun_ajaran_id]);
      } else {
        result = await db.query(`
          SELECT k.id, k.jenis, k.nama, k.tingkat, k.created_at,
                 k.mustahiq_id, k.muhafadzoh_mapel_id, k.qiroatul_mapel_id,
                 g.nama as mustahiq_nama, m.nama as muhafadzoh_nama, q.nama as qiroatul_nama 
          FROM kelas k
          LEFT JOIN guru g ON k.mustahiq_id = g.id
          LEFT JOIN mata_pelajaran m ON k.muhafadzoh_mapel_id = m.id
          LEFT JOIN mata_pelajaran q ON k.qiroatul_mapel_id = q.id
          ORDER BY k.jenis, k.nama
        `);
      }
      res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Gagal memuat data kelas.' });
    }
  });

  app.post('/api/kelas', async (req, res) => {
    const jenis = normalizeKelasJenis(req.body.jenis);
    const nama = normalizeText(req.body.nama);
    const mustahiq_id = nullableInt(req.body.mustahiq_id);
    const muhafadzoh_mapel_id = nullableInt(req.body.muhafadzoh_mapel_id);
    const qiroatul_mapel_id = nullableInt(req.body.qiroatul_mapel_id);
    const tahun_ajaran_id = nullableInt(req.body.tahun_ajaran_id);

    if (!jenis || !nama) {
      return res.status(400).json({ error: 'Jenis kelas dan nama kelas wajib diisi.' });
    }

    // Determine tingkat: use explicit body param if provided, else auto-detect from nama
    let tingkat = nullableInt(req.body.tingkat);
    if (tingkat === null) {
      if (nama.toLowerCase().includes('sifir')) {
        tingkat = 0;
      } else if (nama.toLowerCase().includes('sp')) {
        tingkat = 1;
      } else {
        const match = nama.match(/(\d+)/);
        if (match) {
          tingkat = parseInt(match[1], 10);
        } else {
          tingkat = 1; // Default fallback
        }
      }
    }

    console.log(`📝 Creating kelas: jenis=${jenis}, nama=${nama}, tingkat=${tingkat}`);

    try {
      await db.query('BEGIN');

      const result = await db.query(
        'INSERT INTO kelas (jenis, nama, tingkat, mustahiq_id, muhafadzoh_mapel_id, qiroatul_mapel_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [jenis, nama, tingkat, mustahiq_id, muhafadzoh_mapel_id, qiroatul_mapel_id]
      );
      const newKelas = result.rows[0];

      if (tahun_ajaran_id) {
        await db.query(
          `INSERT INTO kelas_tahun_ajaran (kelas_id, tahun_ajaran_id, mustahiq_id, muhafadzoh_mapel_id, qiroatul_mapel_id)
           VALUES ($1, $2, $3, $4, $5)`,
          [newKelas.id, tahun_ajaran_id, mustahiq_id, muhafadzoh_mapel_id, qiroatul_mapel_id]
        );
      }

      await db.query('COMMIT');
      console.log(`✅ Kelas created successfully:`, newKelas);
      res.status(201).json(newKelas);
    } catch (error) {
      await db.query('ROLLBACK');
      console.error('❌ Error creating kelas:', error);
      if (isUniqueViolation(error)) {
        return res.status(400).json({ error: `Kelas ${jenis} dengan nama tersebut sudah terdaftar.` });
      }
      res.status(500).json({ error: 'Gagal menyimpan data kelas.' });
    }
  });

  app.put('/api/kelas/:id', async (req, res) => {
    const { id } = req.params;
    const jenis = normalizeKelasJenis(req.body.jenis);
    const nama = normalizeText(req.body.nama);
    const mustahiq_id = nullableInt(req.body.mustahiq_id);
    const muhafadzoh_mapel_id = nullableInt(req.body.muhafadzoh_mapel_id);
    const qiroatul_mapel_id = nullableInt(req.body.qiroatul_mapel_id);
    const tahun_ajaran_id = nullableInt(req.body.tahun_ajaran_id);

    if (!jenis || !nama) {
      return res.status(400).json({ error: 'Jenis kelas dan nama kelas wajib diisi.' });
    }

    // Determine tingkat: use explicit body param if provided, else auto-detect from nama
    let tingkat = nullableInt(req.body.tingkat);
    if (tingkat === null) {
      if (nama.toLowerCase().includes('sifir')) {
        tingkat = 0;
      } else if (nama.toLowerCase().includes('sp')) {
        tingkat = 1;
      } else {
        const match = nama.match(/(\d+)/);
        if (match) {
          tingkat = parseInt(match[1], 10);
        } else {
          tingkat = 1; // Default fallback
        }
      }
    }

    console.log(`📝 Updating kelas ${id}: jenis=${jenis}, nama=${nama}, tingkat=${tingkat}`);

    try {
      await db.query('BEGIN');

      // 1. Update basic global kelas info in kelas table
      const result = await db.query(
        'UPDATE kelas SET jenis = $1, nama = $2, tingkat = $3 WHERE id = $4 RETURNING *',
        [jenis, nama, tingkat, id]
      );

      if (!result.rows.length) {
        await db.query('ROLLBACK');
        return res.status(404).json({ error: 'Data kelas tidak ditemukan.' });
      }

      const updatedKelas = result.rows[0];

      // 2. Save settings to kelas_tahun_ajaran if a year is provided
      if (tahun_ajaran_id) {
        await db.query(
          `INSERT INTO kelas_tahun_ajaran (kelas_id, tahun_ajaran_id, mustahiq_id, muhafadzoh_mapel_id, qiroatul_mapel_id)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (kelas_id, tahun_ajaran_id)
           DO UPDATE SET mustahiq_id = EXCLUDED.mustahiq_id,
                         muhafadzoh_mapel_id = EXCLUDED.muhafadzoh_mapel_id,
                         qiroatul_mapel_id = EXCLUDED.qiroatul_mapel_id`,
          [id, tahun_ajaran_id, mustahiq_id, muhafadzoh_mapel_id, qiroatul_mapel_id]
        );
      }
      
      // Always sync fallback defaults on kelas table
      await db.query(
        'UPDATE kelas SET mustahiq_id = $1, muhafadzoh_mapel_id = $2, qiroatul_mapel_id = $3 WHERE id = $4',
        [mustahiq_id, muhafadzoh_mapel_id, qiroatul_mapel_id, id]
      );

      await db.query('COMMIT');
      console.log(`✅ Kelas updated successfully:`, updatedKelas);
      res.json({
        ...updatedKelas,
        mustahiq_id,
        muhafadzoh_mapel_id,
        qiroatul_mapel_id
      });
    } catch (error) {
      await db.query('ROLLBACK');
      console.error('❌ Error updating kelas:', error);
      if (isUniqueViolation(error)) {
        return res.status(400).json({ error: `Kelas ${jenis} dengan nama tersebut sudah terdaftar.` });
      }
      res.status(500).json({ error: 'Gagal memperbarui data kelas.' });
    }
  });

  app.delete('/api/kelas/:id', async (req, res) => {
    const { id } = req.params;
    const tahun_ajaran_id = nullableInt(req.query.tahun_ajaran_id);

    try {
      await db.query('BEGIN');

      // 1. Fetch class info
      const kelasRes = await db.query('SELECT * FROM kelas WHERE id = $1', [id]);
      if (!kelasRes.rows.length) {
        await db.query('ROLLBACK');
        return res.status(404).json({ error: 'Data kelas tidak ditemukan.' });
      }
      const targetKelas = kelasRes.rows[0];

      // CASE A: tahun_ajaran_id is provided -> Scoped removal from this academic year
      if (tahun_ajaran_id) {
        const studentYearCheck = await db.query(`
          SELECT COUNT(*) 
          FROM santri_tahun_ajaran sta
          WHERE (sta.kelas_diniyah_id = $1 OR sta.kelas_sekolah_id = $1)
            AND sta.tahun_ajaran_id = $2
        `, [id, tahun_ajaran_id]);

        const yearStudentCount = parseInt(studentYearCheck.rows[0].count, 10);
        if (yearStudentCount > 0) {
          await db.query('ROLLBACK');
          return res.status(400).json({
            error: `Kelas "${targetKelas.nama}" tidak dapat dihapus dari tahun ajaran ini karena masih memiliki ${yearStudentCount} santri terdaftar di tahun ajaran ini.`
          });
        }

        // Delete mapping from this specific academic year
        await db.query('DELETE FROM kelas_tahun_ajaran WHERE kelas_id = $1 AND tahun_ajaran_id = $2', [id, tahun_ajaran_id]);

        // Check if this class is used anywhere else across other academic years
        const globalStudentCheck = await db.query(`
          SELECT COUNT(*) 
          FROM santri_tahun_ajaran sta
          WHERE (sta.kelas_diniyah_id = $1 OR sta.kelas_sekolah_id = $1)
        `, [id]);
        const otherYearCount = parseInt(globalStudentCheck.rows[0].count, 10);

        const otherKtaCheck = await db.query('SELECT COUNT(*) FROM kelas_tahun_ajaran WHERE kelas_id = $1', [id]);
        const otherKtaCount = parseInt(otherKtaCheck.rows[0].count, 10);

        // If completely unused across all years, clean up the master template record too
        if (otherYearCount === 0 && otherKtaCount === 0) {
          await db.query('DELETE FROM kelas WHERE id = $1', [id]);
          console.log(`✅ Master kelas ${id} (${targetKelas.nama}) completely removed.`);
        }

        await db.query('COMMIT');
        return res.json({ message: `Kelas ${targetKelas.nama} berhasil dihapus dari tahun ajaran ini.` });
      }

      // CASE B: NO tahun_ajaran_id -> Global permanent deletion
      // Check if ANY students (aktif, alumni, lulus) are assigned to this class across ANY academic year
      const studentCheck = await db.query(`
        SELECT COUNT(*) 
        FROM santri_tahun_ajaran sta
        WHERE (sta.kelas_diniyah_id = $1 OR sta.kelas_sekolah_id = $1)
      `, [id]);

      const totalStudentCount = parseInt(studentCheck.rows[0].count, 10);

      // If students exist in this class, BLOCK deletion to protect historical integrity!
      if (totalStudentCount > 0) {
        await db.query('ROLLBACK');
        return res.status(400).json({
          error: `Kelas "${targetKelas.nama}" tidak dapat dihapus karena masih memiliki riwayat ${totalStudentCount} santri (aktif, alumni, atau riwayat tahun ajaran lain). Pindahkan atau bersihkan relasi santri terlebih dahulu.`
        });
      }

      // Check if exam participants are tied to this class
      const examCheck = await db.query(`
        SELECT COUNT(*) 
        FROM peserta_ujian 
        WHERE kelas_diniyah_id = $1
      `, [id]);
      const examCount = parseInt(examCheck.rows[0].count, 10);
      if (examCount > 0) {
        await db.query('ROLLBACK');
        return res.status(400).json({
          error: `Kelas "${targetKelas.nama}" tidak dapat dihapus karena masih digunakan dalam riwayat peserta ujian (${examCount} record).`
        });
      }

      // If NO students and no exams (empty class), proceed with clean deletion of orphan history/junction entries
      await db.query('DELETE FROM kelas_tahun_ajaran WHERE kelas_id = $1', [id]);
      await db.query('UPDATE santri SET kelas_diniyah_id = NULL WHERE kelas_diniyah_id = $1', [id]);
      await db.query('UPDATE santri SET kelas_sekolah_id = NULL WHERE kelas_sekolah_id = $1', [id]);
      await db.query('UPDATE santri_tahun_ajaran SET kelas_diniyah_id = NULL WHERE kelas_diniyah_id = $1', [id]);
      await db.query('UPDATE santri_tahun_ajaran SET kelas_sekolah_id = NULL WHERE kelas_sekolah_id = $1', [id]);
      await db.query('UPDATE santri_kelas_history SET kelas_diniyah_id = NULL WHERE kelas_diniyah_id = $1', [id]);
      await db.query('UPDATE santri_kelas_history SET kelas_sekolah_id = NULL WHERE kelas_sekolah_id = $1', [id]);

      await db.query('UPDATE peserta_ujian SET kelas_diniyah_id = NULL WHERE kelas_diniyah_id = $1', [id]).catch(() => {});
      await db.query('UPDATE jadwal_pelajaran_harian SET kelas_id = NULL WHERE kelas_id = $1', [id]).catch(() => {});
      await db.query('UPDATE setting_kriteria_nilai SET kelas_id = NULL WHERE kelas_id = $1', [id]).catch(() => {});
      await db.query('UPDATE chat_messages SET kelas_id = NULL WHERE kelas_id = $1', [id]).catch(() => {});
      await db.query('UPDATE saran_aplikasi SET kelas_id = NULL WHERE kelas_id = $1', [id]).catch(() => {});

      // Delete the main kelas record
      await db.query('DELETE FROM kelas WHERE id = $1', [id]);

      await db.query('COMMIT');
      console.log(`✅ Empty kelas ${id} (${targetKelas.nama}) deleted successfully`);
      res.json({ message: `Data kelas ${targetKelas.nama} berhasil dihapus.` });
    } catch (error) {
      await db.query('ROLLBACK');
      console.error('❌ Error deleting kelas:', error);
      res.status(500).json({ error: 'Gagal menghapus data kelas.' });
    }
  });
}

module.exports = registerKelasRoutes;
