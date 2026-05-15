const db = require('../../db');
const { handleDatabaseError, ValidationError } = require('../utils/errorHandler');

class NilaiService {
  // Kategori Evaluasi
  async getKategoriEvaluasi() {
    try {
      const result = await db.query('SELECT * FROM kategori_evaluasi ORDER BY id ASC');
      return result.rows;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  // Mapel Tingkat (Jadwal Pelajaran)
  async getMapelTingkat(tahun_ajaran_id = null, kategori_evaluasi_id = null) {
    try {
      const result = await db.query(
        `SELECT * FROM mapel_tingkat 
         WHERE (tahun_ajaran_id = $1 OR tahun_ajaran_id IS NULL) 
           AND (kategori_evaluasi_id = $2 OR kategori_evaluasi_id IS NULL)`,
        [tahun_ajaran_id, kategori_evaluasi_id]
      );
      return result.rows;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  async saveMapelTingkat(tingkat, mapelIds, tahun_ajaran_id = null, kategori_evaluasi_id = null) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `DELETE FROM mapel_tingkat 
         WHERE tingkat = $1 
           AND tahun_ajaran_id IS NOT DISTINCT FROM $2 
           AND kategori_evaluasi_id IS NOT DISTINCT FROM $3`, 
        [tingkat, tahun_ajaran_id, kategori_evaluasi_id]
      );
      
      for (const mapelId of mapelIds) {
        await client.query(
          'INSERT INTO mapel_tingkat (tingkat, mata_pelajaran_id, tahun_ajaran_id, kategori_evaluasi_id) VALUES ($1, $2, $3, $4)', 
          [tingkat, mapelId, tahun_ajaran_id, kategori_evaluasi_id]
        );
      }
      
      await client.query('COMMIT');
      return { success: true };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error in saveMapelTingkat:', error);
      handleDatabaseError(error);
    } finally {
      client.release();
    }
  }

  // Setting Kriteria
  async getKriteriaNilai(tingkat, mapelId, tahun_ajaran_id = null, kategori_evaluasi_id = null) {
    try {
      // 1. Dapatkan info jenis mapel
      const mapelResult = await db.query('SELECT jenis FROM mata_pelajaran WHERE id = $1', [mapelId]);
      const jenisMapel = mapelResult.rows[0]?.jenis;

      // 2. Cari kriteria dengan prioritas:
      // a. Spesifik Tingkat + Mapel + TA + Semester
      // b. Fallback ke global
      const query = `
        SELECT * FROM setting_kriteria_nilai
        WHERE ((tingkat = $1 AND mata_pelajaran_id = $2)
           OR (tingkat = $1 AND jenis_mapel = $3))
          AND (tahun_ajaran_id = $4 OR tahun_ajaran_id IS NULL)
          AND kategori_evaluasi_id = $5
        ORDER BY tahun_ajaran_id DESC NULLS LAST, kategori_evaluasi_id DESC NULLS LAST, mata_pelajaran_id NULLS LAST
        LIMIT 1
      `;
      const result = await db.query(query, [tingkat, mapelId, jenisMapel, tahun_ajaran_id, kategori_evaluasi_id]);
      return result.rows[0] || null;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  async saveKriteriaNilai(data) {
    const { kelas_id, mata_pelajaran_id, tingkat, jenis_mapel, tipe_input, konfigurasi, tahun_ajaran_id, kategori_evaluasi_id } = data;
    
    try {
      console.log('Saving kriteria with payload:', { tingkat, mata_pelajaran_id, jenis_mapel, tipe_input, tahun_ajaran_id, kategori_evaluasi_id });

      let deleteQuery = '';
      let deleteParams = [];

      if (kelas_id && mata_pelajaran_id) {
        deleteQuery = `DELETE FROM setting_kriteria_nilai 
                       WHERE kelas_id = $1 AND mata_pelajaran_id = $2 
                         AND tahun_ajaran_id IS NOT DISTINCT FROM $3 
                         AND kategori_evaluasi_id IS NOT DISTINCT FROM $4`;
        deleteParams = [kelas_id, mata_pelajaran_id, tahun_ajaran_id, kategori_evaluasi_id];
      } else if (tingkat !== undefined && mata_pelajaran_id) {
        deleteQuery = `DELETE FROM setting_kriteria_nilai 
                       WHERE tingkat = $1 AND mata_pelajaran_id = $2 
                         AND tahun_ajaran_id IS NOT DISTINCT FROM $3 
                         AND kategori_evaluasi_id IS NOT DISTINCT FROM $4`;
        deleteParams = [tingkat, mata_pelajaran_id, tahun_ajaran_id, kategori_evaluasi_id];
      } else if (tingkat !== undefined && jenis_mapel) {
        deleteQuery = `DELETE FROM setting_kriteria_nilai 
                       WHERE tingkat = $1 AND jenis_mapel = $2 
                         AND tahun_ajaran_id IS NOT DISTINCT FROM $3 
                         AND kategori_evaluasi_id IS NOT DISTINCT FROM $4`;
        deleteParams = [tingkat, jenis_mapel, tahun_ajaran_id, kategori_evaluasi_id];
      }

      if (deleteQuery) await db.query(deleteQuery, deleteParams);

      // Check if configuration is empty
      const isEmpty = (tipe_input === 'Teks' && (!konfigurasi || konfigurasi.length === 0)) ||
                      (tipe_input === 'Angka' && Object.values(konfigurasi).every(v => v.min === null && v.max === null));

      if (isEmpty) {
        return { success: true, message: 'Kriteria dihapus karena kosong.' };
      }

      const result = await db.query(
        `INSERT INTO setting_kriteria_nilai (kelas_id, mata_pelajaran_id, tingkat, jenis_mapel, tipe_input, konfigurasi, tahun_ajaran_id, kategori_evaluasi_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          kelas_id ?? null, 
          mata_pelajaran_id ?? null, 
          tingkat ?? null, 
          jenis_mapel ?? null, 
          tipe_input, 
          JSON.stringify(konfigurasi),
          tahun_ajaran_id ?? null,
          kategori_evaluasi_id ?? null
        ]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error saving kriteria:', error);
      handleDatabaseError(error);
    }
  }

  // Nilai Santri
  async getNilaiSantri(tahunAjaranId, kelasId, mapelId, kategoriId = null) {
    try {
      let query = `
        SELECT s.id as santri_id, s.nama, s.nis, k.nama as nama_kelas,
               n.id as nilai_id, n.nilai_angka, n.predikat, n.capaian
        FROM santri_tahun_ajaran sta
        JOIN santri s ON sta.santri_id = s.id
        JOIN kelas k ON sta.kelas_diniyah_id = k.id
        LEFT JOIN nilai_santri n ON s.id = n.santri_id 
             AND n.mata_pelajaran_id = $3 
             AND n.tahun_ajaran_id = $1
      `;
      
      const params = [tahunAjaranId, kelasId, mapelId];
      
      if (kategoriId && kategoriId !== 'null' && kategoriId !== '') {
         query += ` AND n.kategori_evaluasi_id = $4`;
         params.push(kategoriId);
      } else {
         query += ` AND n.kategori_evaluasi_id IS NULL`;
      }
      
      // Fetch category name to check if it's Ganjil or Genap
      let isGanjil = false;
      let isGenap = false;
      if (kategoriId && kategoriId !== 'null' && kategoriId !== '') {
        const katResult = await db.query('SELECT nama FROM kategori_evaluasi WHERE id = $1', [kategoriId]);
        const katNama = katResult.rows[0]?.nama || '';
        isGanjil = katNama.toLowerCase().includes('ganjil');
        isGenap = katNama.toLowerCase().includes('genap');
      }

      query += ` WHERE sta.tahun_ajaran_id = $1 AND sta.kelas_diniyah_id = $2 AND sta.status = 'aktif'`;
      
      if (isGanjil) {
        query += ` AND (sta.aktif_ganjil = true OR n.id IS NOT NULL)`;
      } else if (isGenap) {
        query += ` AND (sta.aktif_genap = true OR n.id IS NOT NULL)`;
      }

      query += ` ORDER BY s.nama ASC`;
      
      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  // Get all santri with their class for report search
  async getSantriForReport(tahunAjaranId) {
    try {
      const query = `
        SELECT s.id as santri_id, s.nama, k.id as kelas_id, k.nama as nama_kelas, k.tingkat
        FROM santri_tahun_ajaran sta
        JOIN santri s ON sta.santri_id = s.id
        JOIN kelas k ON sta.kelas_diniyah_id = k.id
        WHERE sta.tahun_ajaran_id = $1 AND sta.status = 'aktif'
        ORDER BY s.nama ASC
      `;
      const result = await db.query(query, [tahunAjaranId]);
      return result.rows;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  // Get accumulation for all classes
  async getAkumulasiSemuaKelas(tahunAjaranId, mapelId, kategoriId) {
    try {
      // Fetch category name to check if it's Ganjil or Genap
      let isGanjil = false;
      let isGenap = false;
      if (kategoriId && kategoriId !== 'null' && kategoriId !== '') {
        const katResult = await db.query('SELECT nama FROM kategori_evaluasi WHERE id = $1', [kategoriId]);
        const katNama = katResult.rows[0]?.nama || '';
        isGanjil = katNama.toLowerCase().includes('ganjil');
        isGenap = katNama.toLowerCase().includes('genap');
      }

      let query = `
        SELECT 
          k.id as kelas_id, k.nama as nama_kelas, k.tingkat,
          COUNT(s.id) as jumlah_siswa,
          COUNT(CASE WHEN n.predikat = 'Mumtaz' THEN 1 END) as mumtaz,
          COUNT(CASE WHEN n.predikat = 'Jayyid' THEN 1 END) as jayyid,
          COUNT(CASE WHEN n.predikat = 'Mutawassith' THEN 1 END) as mutawassith,
          COUNT(CASE WHEN n.predikat = 'Rodi''' THEN 1 END) as rodi,
          COUNT(CASE WHEN n.predikat = 'Tam' THEN 1 END) as tam,
          COUNT(CASE WHEN n.predikat = 'Naqish' THEN 1 END) as naqish,
          COUNT(CASE WHEN n.predikat IN ('Mumtaz', 'Jayyid', 'Mutawassith', 'Tam') THEN 1 END) as lulus,
          COUNT(CASE WHEN n.predikat IN ('Rodi''', 'Naqish') THEN 1 END) as tidak,
          COUNT(CASE WHEN n.id IS NULL THEN 1 END) as ghoib,
          ROUND(AVG(n.nilai_angka), 2) as rata_rata
        FROM santri_tahun_ajaran sta
        JOIN santri s ON sta.santri_id = s.id
        JOIN kelas k ON sta.kelas_diniyah_id = k.id
        LEFT JOIN nilai_santri n ON s.id = n.santri_id 
             AND n.mata_pelajaran_id = $2 
             AND n.tahun_ajaran_id = $1
             AND n.kategori_evaluasi_id = $3
        WHERE sta.tahun_ajaran_id = $1 AND sta.status = 'aktif'
      `;

      if (isGanjil) {
        query += ` AND (sta.aktif_ganjil = true OR n.id IS NOT NULL)`;
      } else if (isGenap) {
        query += ` AND (sta.aktif_genap = true OR n.id IS NOT NULL)`;
      }

      query += `
        GROUP BY k.id, k.nama, k.tingkat
        ORDER BY k.tingkat ASC, k.nama ASC
      `;

      const result = await db.query(query, [tahunAjaranId, mapelId, kategoriId]);
      return result.rows;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  // Rekap Nilai
  async getRekapNilai(tahunAjaranId, kelasId, kategoriId) {
    try {
      // Fetch category name to check if it's Ganjil or Genap
      const katResult = await db.query('SELECT nama FROM kategori_evaluasi WHERE id = $1', [kategoriId]);
      const katNama = katResult.rows[0]?.nama || '';
      const isGanjil = katNama.toLowerCase().includes('ganjil');
      const isGenap = katNama.toLowerCase().includes('genap');

      let query = `
        SELECT 
          s.id as santri_id, s.nama, s.nis, 
          n.mata_pelajaran_id,
          m.nama as nama_mapel, m.jenis as jenis_mapel,
          n.nilai_angka, n.predikat, n.capaian
        FROM santri_tahun_ajaran sta
        JOIN santri s ON sta.santri_id = s.id
        LEFT JOIN nilai_santri n ON s.id = n.santri_id AND n.tahun_ajaran_id = $1
          AND n.kategori_evaluasi_id = $3
        LEFT JOIN mata_pelajaran m ON n.mata_pelajaran_id = m.id
        WHERE sta.kelas_diniyah_id = $2
          AND sta.tahun_ajaran_id = $1
          AND sta.status = 'aktif'
      `;

      if (isGanjil) {
        query += ` AND (sta.aktif_ganjil = true OR n.id IS NOT NULL)`;
      } else if (isGenap) {
        query += ` AND (sta.aktif_genap = true OR n.id IS NOT NULL)`;
      }

      query += ` ORDER BY s.nama ASC, m.nama ASC`;
      const params = [tahunAjaranId, kelasId, kategoriId];
      
      const result = await db.query(query, params);
      
      // Pivot the data in backend or send raw for frontend to pivot
      // Sending raw is fine, frontend can group by santri_id
      return result.rows;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  async saveNilaiBulk(tahunAjaranId, mapelId, katId, dataList) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      const katIdValue = (katId === 'null' || katId === '' || !katId) ? null : katId;

      // Hapus nilai lama untuk santri-santri ini agar tidak konflik
      const santriIds = dataList.map(d => d.santri_id);
      
      if (katIdValue === null) {
        await client.query(
          'DELETE FROM nilai_santri WHERE tahun_ajaran_id = $1 AND mata_pelajaran_id = $2 AND kategori_evaluasi_id IS NULL AND santri_id = ANY($3)',
          [tahunAjaranId, mapelId, santriIds]
        );
      } else {
        await client.query(
          'DELETE FROM nilai_santri WHERE tahun_ajaran_id = $1 AND mata_pelajaran_id = $2 AND kategori_evaluasi_id = $3 AND santri_id = ANY($4)',
          [tahunAjaranId, mapelId, katIdValue, santriIds]
        );
      }

      // Insert nilai baru
      for (const item of dataList) {
        await client.query(
          `INSERT INTO nilai_santri (santri_id, mata_pelajaran_id, tahun_ajaran_id, kategori_evaluasi_id, nilai_angka, predikat, capaian)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [item.santri_id, mapelId, tahunAjaranId, katIdValue, item.nilai_angka, item.predikat, item.capaian]
        );
      }

      await client.query('COMMIT');
      return { success: true, count: dataList.length };
    } catch (error) {
      await client.query('ROLLBACK');
      handleDatabaseError(error);
    } finally {
      client.release();
    }
  }

  async getRaporData(tahunAjaranId, kelasId, kategoriId) {
    try {
      // Fetch category name to check if it's Ganjil or Genap
      let isGanjil = false;
      let isGenap = false;
      if (kategoriId && kategoriId !== 'null' && kategoriId !== '') {
        const katResult = await db.query('SELECT nama FROM kategori_evaluasi WHERE id = $1', [kategoriId]);
        const katNama = katResult.rows[0]?.nama || '';
        isGanjil = katNama.toLowerCase().includes('ganjil');
        isGenap = katNama.toLowerCase().includes('genap');
      }

      let query = `
        SELECT 
          s.id as santri_id, s.nama, s.nis,
          r.sakit, r.izin, r.alpa,
          r.keaktifan, r.akhlaq, r.kerapihan, r.catatan
        FROM santri_tahun_ajaran sta
        JOIN santri s ON sta.santri_id = s.id
        LEFT JOIN rapor_santri r ON s.id = r.santri_id 
          AND r.tahun_ajaran_id = $1 
          AND r.kategori_evaluasi_id = $3
        WHERE sta.kelas_diniyah_id = $2
          AND sta.tahun_ajaran_id = $1
          AND sta.status = 'aktif'
      `;

      if (isGanjil) {
        query += ` AND (sta.aktif_ganjil = true OR r.santri_id IS NOT NULL)`;
      } else if (isGenap) {
        query += ` AND (sta.aktif_genap = true OR r.santri_id IS NOT NULL)`;
      }

      query += ` ORDER BY s.nama ASC`;

      const result = await db.query(query, [tahunAjaranId, kelasId, kategoriId]);
      return result.rows;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  async saveRaporBulk(tahunAjaranId, kategoriId, dataList) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      for (const item of dataList) {
        if (!item.santri_id) continue;
        
        await client.query(
          `INSERT INTO rapor_santri 
            (santri_id, tahun_ajaran_id, kategori_evaluasi_id, sakit, izin, alpa, keaktifan, akhlaq, kerapihan, catatan)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (santri_id, tahun_ajaran_id, kategori_evaluasi_id)
           DO UPDATE SET 
            sakit = EXCLUDED.sakit,
            izin = EXCLUDED.izin,
            alpa = EXCLUDED.alpa,
            keaktifan = EXCLUDED.keaktifan,
            akhlaq = EXCLUDED.akhlaq,
            kerapihan = EXCLUDED.kerapihan,
            catatan = EXCLUDED.catatan`,
          [
            item.santri_id, 
            tahunAjaranId, 
            kategoriId, 
            item.sakit || 0, 
            item.izin || 0, 
            item.alpa || 0, 
            item.keaktifan || null, 
            item.akhlaq || null, 
            item.kerapihan || null, 
            item.catatan || null
          ]
        );
      }

      await client.query('COMMIT');
      return { success: true, count: dataList.length };
    } catch (error) {
      await client.query('ROLLBACK');
      handleDatabaseError(error);
    } finally {
      client.release();
    }
  }

  async getCetakRapor(tahunAjaranId, kelasId, kategoriId, santriId) {
    try {
      // 1. Get Kelas Data
      const kelasRes = await db.query(`
        SELECT k.*, g.nama as mustahiq_nama, 
               m.nama as muhafadzoh_nama, m.nama_arab as muhafadzoh_arab,
               q.nama as qiroatul_nama, q.nama_arab as qiroatul_arab
        FROM kelas k
        LEFT JOIN guru g ON k.mustahiq_id = g.id
        LEFT JOIN mata_pelajaran m ON k.muhafadzoh_mapel_id = m.id
        LEFT JOIN mata_pelajaran q ON k.qiroatul_mapel_id = q.id
        WHERE k.id = $1
      `, [kelasId]);
      const kelasData = kelasRes.rows[0];

      // 2. Get Santri Data
      const santriRes = await db.query('SELECT nis, nama FROM santri WHERE id = $1', [santriId]);
      const santriData = santriRes.rows[0];

      // 3. Get Rapor Tambahan Data
      const raporRes = await db.query(
        'SELECT * FROM rapor_santri WHERE santri_id = $1 AND tahun_ajaran_id = $2 AND kategori_evaluasi_id = $3',
        [santriId, tahunAjaranId, kategoriId]
      );
      const raporTambahan = raporRes.rows[0] || {};

      // 4. Get Kategori Name
      const katRes = await db.query('SELECT nama FROM kategori_evaluasi WHERE id = $1', [kategoriId]);
      const kategoriName = katRes.rows[0]?.nama || '';

      // 5. Get Tahun Ajaran Name
      const taRes = await db.query('SELECT nama FROM tahun_ajaran WHERE id = $1', [tahunAjaranId]);
      const tahunAjaranName = taRes.rows[0]?.nama || '';

      // 6. Get Nilai for this santri specifically with mapel details
      const nilaiRes = await db.query(`
        SELECT n.*, m.nama as mapel_nama, m.nama_arab as mapel_arab, m.jenis as mapel_jenis
        FROM nilai_santri n
        JOIN mata_pelajaran m ON n.mata_pelajaran_id = m.id
        WHERE n.santri_id = $1 AND n.tahun_ajaran_id = $2 AND n.kategori_evaluasi_id = $3
      `, [santriId, tahunAjaranId, kategoriId]);
      const nilaiList = nilaiRes.rows;

      // 7. Get Rekap Data to find Peringkat and Total (Call existing method)
      const rekapData = await this.getRekapNilai(tahunAjaranId, kelasId, kategoriId);
      
      // Compute Peringkat logic
      const pivoted = {};
      rekapData.forEach(row => {
        if (!pivoted[row.santri_id]) {
          pivoted[row.santri_id] = {
            santri_id: row.santri_id,
            total_nilai: 0,
            mapel_count: 0
          };
        }
        if (row.jenis_mapel === 'Reguler' || row.jenis_mapel.includes('Qiroatul')) {
          if (row.nilai_angka !== null) {
            pivoted[row.santri_id].total_nilai += Number(row.nilai_angka);
            pivoted[row.santri_id].mapel_count++;
          }
        }
      });
      const rekapArr = Object.values(pivoted);
      rekapArr.sort((a, b) => b.total_nilai - a.total_nilai);
      const rankIndex = rekapArr.findIndex(r => r.santri_id == santriId);
      const peringkat = rankIndex >= 0 ? rankIndex + 1 : '-';
      const totalNilai = rankIndex >= 0 ? rekapArr[rankIndex].total_nilai : 0;
      const rataRata = rankIndex >= 0 && rekapArr[rankIndex].mapel_count > 0 
        ? (rekapArr[rankIndex].total_nilai / rekapArr[rankIndex].mapel_count).toFixed(2) 
        : 0;

      return {
        santri: santriData,
        kelas: kelasData,
        tahun_ajaran: tahunAjaranName,
        semester: kategoriName,
        nilai: nilaiList,
        tambahan: raporTambahan,
        statistik: {
          peringkat,
          total: totalNilai,
          rata_rata: rataRata,
          jumlah_santri: rekapArr.length
        }
      };

    } catch (error) {
      handleDatabaseError(error);
    }
  }
}

module.exports = new NilaiService();
