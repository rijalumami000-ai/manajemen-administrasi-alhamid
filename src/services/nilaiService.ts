import db from '../../db';
import { handleDatabaseError, ValidationError } from '../utils/errorHandler';

export class NilaiService {
  // Kategori Evaluasi
  async getKategoriEvaluasi(): Promise<any[]> {
    try {
      const result = await db.query('SELECT * FROM kategori_evaluasi ORDER BY id ASC');
      return result.rows;
    } catch (error) {
      handleDatabaseError(error);
      return [];
    }
  }

  // Mapel Tingkat (Jadwal Pelajaran)
  async getMapelTingkat(tahun_ajaran_id: number | string | null = null, kategori_evaluasi_id: number | string | null = null): Promise<any[]> {
    try {
      if (tahun_ajaran_id && kategori_evaluasi_id) {
        // 1. Ambil daftar tingkat yang sudah pernah dikonfigurasi/disimpan secara eksplisit
        const key = `mapel_tingkat_configured_${tahun_ajaran_id}_${kategori_evaluasi_id}`;
        let configuredTingkats = new Set<number>();
        try {
          const configRes = await db.query('SELECT value FROM system_settings WHERE key = $1 LIMIT 1', [key]);
          if (configRes.rows.length > 0 && configRes.rows[0].value) {
            const list = JSON.parse(configRes.rows[0].value);
            if (Array.isArray(list)) {
              configuredTingkats = new Set(list.map(Number));
            }
          }
        } catch (e: any) {
          console.warn('Warning getting configured tingkats setting:', e.message);
        }

        // 2. Query jadwal spesifik tahun ajaran dan semester aktif
        const specificResult = await db.query(
          `SELECT * FROM mapel_tingkat 
           WHERE tahun_ajaran_id = $1 AND kategori_evaluasi_id = $2`,
          [tahun_ajaran_id, kategori_evaluasi_id]
        );

        // Setiap tingkat yang memiliki data spesifik otomatis dianggap sudah terkonfigurasi
        specificResult.rows.forEach((r: { tingkat: any }) => configuredTingkats.add(Number(r.tingkat)));

        // 3. Query jadwal default (NULL, NULL) sebagai fallback HANYA untuk tingkat yang BELUM dikonfigurasi
        const defaultResult = await db.query(
          `SELECT * FROM mapel_tingkat 
           WHERE tahun_ajaran_id IS NULL AND kategori_evaluasi_id IS NULL`
        );

        const fallbackRows = defaultResult.rows.filter((r: { tingkat: any }) => !configuredTingkats.has(Number(r.tingkat)));

        return [...specificResult.rows, ...fallbackRows];
      }

      const result = await db.query(
        `SELECT * FROM mapel_tingkat 
         WHERE (tahun_ajaran_id = $1 OR tahun_ajaran_id IS NULL) 
           AND (kategori_evaluasi_id = $2 OR kategori_evaluasi_id IS NULL)`,
        [tahun_ajaran_id, kategori_evaluasi_id]
      );
      return result.rows;
    } catch (error) {
      handleDatabaseError(error);
      return [];
    }
  }

  async saveMapelTingkat(
    tingkat: number | string,
    mapelIds: (number | string)[],
    tahun_ajaran_id: number | string | null = null,
    kategori_evaluasi_id: number | string | null = null
  ): Promise<{ success: boolean }> {
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
      
      const validMapelIds = Array.isArray(mapelIds) ? mapelIds.filter(id => id !== null && id !== undefined) : [];
      for (const mapelId of validMapelIds) {
        await client.query(
          'INSERT INTO mapel_tingkat (tingkat, mata_pelajaran_id, tahun_ajaran_id, kategori_evaluasi_id) VALUES ($1, $2, $3, $4)', 
          [tingkat, mapelId, tahun_ajaran_id, kategori_evaluasi_id]
        );
      }

      // Tandai bahwa tingkat ini sudah dikonfigurasi untuk tahun ajaran dan semester ini
      if (tahun_ajaran_id && kategori_evaluasi_id) {
        const key = `mapel_tingkat_configured_${tahun_ajaran_id}_${kategori_evaluasi_id}`;
        try {
          const existingRes = await client.query('SELECT value FROM system_settings WHERE key = $1 LIMIT 1', [key]);
          let configuredList: number[] = [];
          if (existingRes.rows.length > 0 && existingRes.rows[0].value) {
            try {
              configuredList = JSON.parse(existingRes.rows[0].value);
            } catch (e) {
              configuredList = [];
            }
          }
          const numTingkat = Number(tingkat);
          if (!configuredList.includes(numTingkat)) {
            configuredList.push(numTingkat);
          }
          await client.query(
            `INSERT INTO system_settings (key, value) VALUES ($1, $2)
             ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
            [key, JSON.stringify(configuredList)]
          );
        } catch (setErr: any) {
          console.warn('Warning updating system_settings for mapel_tingkat_configured:', setErr.message);
        }
      }
      
      await client.query('COMMIT');
      return { success: true };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error in saveMapelTingkat:', error);
      handleDatabaseError(error);
      return { success: false };
    } finally {
      client.release();
    }
  }

  // Setting Kriteria
  async getKriteriaNilai(
    tingkat: number | string,
    mapelId: number | string,
    tahun_ajaran_id: number | string | null = null,
    kategori_evaluasi_id: number | string | null = null
  ): Promise<any | null> {
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
      return null;
    }
  }

  async saveKriteriaNilai(data: any): Promise<any> {
    const { kelas_id, mata_pelajaran_id, tingkat, jenis_mapel, tipe_input, konfigurasi, tahun_ajaran_id, kategori_evaluasi_id } = data;
    
    try {
      console.log('Saving kriteria with payload:', { tingkat, mata_pelajaran_id, jenis_mapel, tipe_input, tahun_ajaran_id, kategori_evaluasi_id });

      let deleteQuery = '';
      let deleteParams: any[] = [];

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
                      (tipe_input === 'Angka' && konfigurasi && Object.values(konfigurasi).every((v: any) => v.min === null && v.max === null));

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
  async getNilaiSantri(tahunAjaranId: number | string, kelasId: number | string, mapelId: number | string, kategoriId: number | string | null = null): Promise<any[]> {
    try {
      let query = `
        SELECT s.id as santri_id, s.nama, s.nis, s.foto_url, k.nama as nama_kelas,
               n.id as nilai_id, n.nilai_angka, n.predikat, n.capaian
        FROM santri_tahun_ajaran sta
        JOIN santri s ON sta.santri_id = s.id
        JOIN kelas k ON sta.kelas_diniyah_id = k.id
        LEFT JOIN nilai_santri n ON s.id = n.santri_id 
             AND n.mata_pelajaran_id = $3 
             AND n.tahun_ajaran_id = $1
      `;
      
      const params: any[] = [tahunAjaranId, kelasId, mapelId];
      
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

      query += ` WHERE sta.tahun_ajaran_id = $1 AND sta.kelas_diniyah_id = $2 AND COALESCE(sta.status, 'aktif') IN ('aktif', 'draft', 'tidak_naik', 'lulus', 'alumni')`;
      
      if (isGanjil) {
        query += ` AND sta.aktif_ganjil = true`;
      } else if (isGenap) {
        query += ` AND sta.aktif_genap = true`;
      }

      query += ` ORDER BY s.nama ASC`;
      
      const result = await db.query(query, params);
      return result.rows.map((row: any) => {
        let n = row.nilai_angka;
        if (n !== null && n !== undefined) {
          const num = Number(n);
          if (!isNaN(num)) {
            n = Number.isInteger(num) ? num : parseFloat(num.toFixed(2));
          }
        }
        return {
          ...row,
          nilai_angka: n
        };
      });
    } catch (error) {
      handleDatabaseError(error);
      return [];
    }
  }

  // Get all santri with their class for report search
  async getSantriForReport(tahunAjaranId: number | string, kategoriId: number | string | null = null): Promise<any[]> {
    try {
      let query = `
        SELECT s.id as santri_id, s.nama, k.id as kelas_id, k.nama as nama_kelas, k.tingkat
        FROM santri_tahun_ajaran sta
        JOIN santri s ON sta.santri_id = s.id
        JOIN kelas k ON sta.kelas_diniyah_id = k.id
        WHERE sta.tahun_ajaran_id = $1 AND COALESCE(sta.status, 'aktif') IN ('aktif', 'draft', 'tidak_naik', 'lulus', 'alumni')
      `;
      
      const params: any[] = [tahunAjaranId];
      
      let isGanjil = false;
      let isGenap = false;
      if (kategoriId && kategoriId !== 'null' && kategoriId !== '') {
        const katResult = await db.query('SELECT nama FROM kategori_evaluasi WHERE id = $1', [kategoriId]);
        const katNama = katResult.rows[0]?.nama || '';
        isGanjil = katNama.toLowerCase().includes('ganjil');
        isGenap = katNama.toLowerCase().includes('genap');
      }

      if (isGanjil) {
        query += ` AND sta.aktif_ganjil = true`;
      } else if (isGenap) {
        query += ` AND sta.aktif_genap = true`;
      }

      query += ` ORDER BY s.nama ASC`;
      
      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      handleDatabaseError(error);
      return [];
    }
  }

  // Get accumulation for all classes
  async getAkumulasiSemuaKelas(tahunAjaranId: number | string, mapelId: number | string, kategoriId: number | string): Promise<any[]> {
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
          COUNT(CASE WHEN n.predikat = 'Tam' OR n.capaian = 'Tam' THEN 1 END) as tam,
          COUNT(CASE WHEN n.predikat = 'Naqish' OR n.capaian = 'Naqish' THEN 1 END) as naqish,
          COUNT(CASE WHEN n.predikat IN ('Mumtaz', 'Jayyid', 'Mutawassith', 'Tam') OR n.capaian = 'Tam' THEN 1 END) as lulus,
          COUNT(CASE WHEN n.predikat IN ('Rodi''', 'Naqish') OR n.capaian = 'Naqish' THEN 1 END) as tidak,
          COUNT(CASE WHEN n.id IS NULL OR (n.nilai_angka IS NULL AND (n.capaian IS NULL OR TRIM(n.capaian) = '') AND (n.predikat IS NULL OR TRIM(n.predikat) = '')) THEN 1 END) as ghoib,
          ROUND(AVG(n.nilai_angka), 2) as rata_rata
        FROM santri_tahun_ajaran sta
        JOIN santri s ON sta.santri_id = s.id
        JOIN kelas k ON sta.kelas_diniyah_id = k.id
        LEFT JOIN nilai_santri n ON s.id = n.santri_id 
             AND n.mata_pelajaran_id = $2 
             AND n.tahun_ajaran_id = $1
             AND n.kategori_evaluasi_id = $3
        WHERE sta.tahun_ajaran_id = $1 AND COALESCE(sta.status, 'aktif') IN ('aktif', 'draft', 'tidak_naik', 'lulus', 'alumni')
      `;

      if (isGanjil) {
        query += ` AND sta.aktif_ganjil = true`;
      } else if (isGenap) {
        query += ` AND sta.aktif_genap = true`;
      }

      query += `
        GROUP BY k.id, k.nama, k.tingkat
        ORDER BY k.tingkat ASC, k.nama ASC
      `;

      const result = await db.query(query, [tahunAjaranId, mapelId, kategoriId]);
      return result.rows;
    } catch (error) {
      handleDatabaseError(error);
      return [];
    }
  }

  // Rekap Nilai
  async getRekapNilai(tahunAjaranId: number | string, kelasId: number | string, kategoriId: number | string): Promise<any[]> {
    try {
      // Fetch category name to check if it's Ganjil or Genap
      const katResult = await db.query('SELECT nama FROM kategori_evaluasi WHERE id = $1', [kategoriId]);
      const katNama = katResult.rows[0]?.nama || '';
      const isGanjil = katNama.toLowerCase().includes('ganjil');
      const isGenap = katNama.toLowerCase().includes('genap');

      let query = `
        SELECT 
          s.id as santri_id, s.nama, s.nis, s.foto_url,
          n.mata_pelajaran_id,
          m.nama as nama_mapel, m.jenis as jenis_mapel,
          n.nilai_angka, n.predikat, n.capaian,
          r.peringkat_manual
        FROM santri_tahun_ajaran sta
        JOIN santri s ON sta.santri_id = s.id
        LEFT JOIN nilai_santri n ON s.id = n.santri_id AND n.tahun_ajaran_id = $1
          AND n.kategori_evaluasi_id = $3
        LEFT JOIN mata_pelajaran m ON n.mata_pelajaran_id = m.id
        LEFT JOIN rapor_santri r ON r.santri_id = s.id AND r.tahun_ajaran_id = $1 AND r.kategori_evaluasi_id = $3
        WHERE sta.kelas_diniyah_id = $2
          AND sta.tahun_ajaran_id = $1
          AND COALESCE(sta.status, 'aktif') IN ('aktif', 'draft', 'tidak_naik', 'lulus', 'alumni')
      `;

      if (isGanjil) {
        query += ` AND sta.aktif_ganjil = true`;
      } else if (isGenap) {
        query += ` AND sta.aktif_genap = true`;
      }

      query += ` ORDER BY s.nama ASC, m.nama ASC`;
      const params = [tahunAjaranId, kelasId, kategoriId];
      
      const result = await db.query(query, params);
      
      // Return cleaned rows without .00 trailing decimals
      return result.rows.map((row: any) => {
        let n = row.nilai_angka;
        if (n !== null && n !== undefined) {
          const num = Number(n);
          if (!isNaN(num)) {
            n = Number.isInteger(num) ? num : parseFloat(num.toFixed(2));
          }
        }
        return {
          ...row,
          nilai_angka: n
        };
      });
    } catch (error) {
      handleDatabaseError(error);
      return [];
    }
  }

  async saveNilaiBulk(
    tahunAjaranId: number | string,
    mapelId: number | string,
    katId: number | string | null,
    dataList: any[]
  ): Promise<{ success: boolean; count?: number }> {
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
        let nilaiAngka = item.nilai_angka;
        if (nilaiAngka === '' || nilaiAngka === undefined || nilaiAngka === null) {
          nilaiAngka = null;
        } else {
          nilaiAngka = Number(nilaiAngka);
          if (isNaN(nilaiAngka)) nilaiAngka = null;
        }
        await client.query(
          `INSERT INTO nilai_santri (santri_id, mata_pelajaran_id, tahun_ajaran_id, kategori_evaluasi_id, nilai_angka, predikat, capaian)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [item.santri_id, mapelId, tahunAjaranId, katIdValue, nilaiAngka, item.predikat || null, item.capaian || null]
        );
      }

      await client.query('COMMIT');
      return { success: true, count: dataList.length };
    } catch (error) {
      await client.query('ROLLBACK');
      handleDatabaseError(error);
      return { success: false };
    } finally {
      client.release();
    }
  }

  async getRaporData(tahunAjaranId: number | string, kelasId: number | string, kategoriId: number | string): Promise<any[]> {
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
          r.keaktifan, r.akhlaq, r.kerapihan, r.catatan, r.keputusan_kenaikan
        FROM santri_tahun_ajaran sta
        JOIN santri s ON sta.santri_id = s.id
        LEFT JOIN rapor_santri r ON s.id = r.santri_id 
          AND r.tahun_ajaran_id = $1 
          AND r.kategori_evaluasi_id = $3
        WHERE sta.kelas_diniyah_id = $2
          AND sta.tahun_ajaran_id = $1
          AND COALESCE(sta.status, 'aktif') IN ('aktif', 'draft', 'tidak_naik', 'lulus', 'alumni')
      `;

      if (isGanjil) {
        query += ` AND sta.aktif_ganjil = true`;
      } else if (isGenap) {
        query += ` AND sta.aktif_genap = true`;
      }

      query += ` ORDER BY s.nama ASC`;

      const result = await db.query(query, [tahunAjaranId, kelasId, kategoriId]);
      const rows = result.rows;

      if (rows.length > 0) {
        const santriIds = rows.map((r: any) => r.santri_id);
        const detailRes = await db.query(
          `SELECT santri_id, bulan, sakit, izin, alpa 
           FROM absensi_bulanan_santri 
           WHERE tahun_ajaran_id = $1 AND kategori_evaluasi_id = $2 AND santri_id = ANY($3)`,
          [tahunAjaranId, kategoriId, santriIds]
        );

        // Buat map santri_id -> detail_absensi { [bulan]: { sakit, izin, alpa } }
        const detailMap: Record<number, any> = {};
        detailRes.rows.forEach((d: any) => {
          if (!detailMap[d.santri_id]) {
            detailMap[d.santri_id] = {};
          }
          detailMap[d.santri_id][d.bulan] = {
            sakit: d.sakit || 0,
            izin: d.izin || 0,
            alpa: d.alpa || 0
          };
        });

        // Masukkan detail ke rows
        rows.forEach((row: any) => {
          row.detail_absensi = detailMap[row.santri_id] || {};
        });
      }

      return rows;
    } catch (error) {
      handleDatabaseError(error);
      return [];
    }
  }

  async saveRaporBulk(tahunAjaranId: number | string, kategoriId: number | string, dataList: any[]): Promise<{ success: boolean; count?: number }> {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      for (const item of dataList) {
        if (!item.santri_id) continue;
        
        let finalSakit = item.sakit || 0;
        let finalIzin = item.izin || 0;
        let finalAlpa = item.alpa || 0;

        // Jika ada detail_absensi yang dikirim, simpan detail bulanan dan akumulasikan ke total
        if (item.detail_absensi && typeof item.detail_absensi === 'object') {
          let totalSakit = 0;
          let totalIzin = 0;
          let totalAlpa = 0;

          for (const bulan in item.detail_absensi) {
            const detail = item.detail_absensi[bulan];
            const s = detail.sakit || 0;
            const i = detail.izin || 0;
            const a = detail.alpa || 0;

            await client.query(
              `INSERT INTO absensi_bulanan_santri (santri_id, tahun_ajaran_id, kategori_evaluasi_id, bulan, sakit, izin, alpa)
               VALUES ($1, $2, $3, $4, $5, $6, $7)
               ON CONFLICT (santri_id, tahun_ajaran_id, kategori_evaluasi_id, bulan)
               DO UPDATE SET 
                sakit = EXCLUDED.sakit,
                izin = EXCLUDED.izin,
                alpa = EXCLUDED.alpa,
                updated_at = NOW()`,
              [item.santri_id, tahunAjaranId, kategoriId, bulan, s, i, a]
            );

            totalSakit += s;
            totalIzin += i;
            totalAlpa += a;
          }

          finalSakit = totalSakit;
          finalIzin = totalIzin;
          finalAlpa = totalAlpa;
        }
        
        await client.query(
          `INSERT INTO rapor_santri 
            (santri_id, tahun_ajaran_id, kategori_evaluasi_id, sakit, izin, alpa, keaktifan, akhlaq, kerapihan, catatan, keputusan_kenaikan)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (santri_id, tahun_ajaran_id, kategori_evaluasi_id)
           DO UPDATE SET 
            sakit = EXCLUDED.sakit,
            izin = EXCLUDED.izin,
            alpa = EXCLUDED.alpa,
            keaktifan = EXCLUDED.keaktifan,
            akhlaq = EXCLUDED.akhlaq,
            kerapihan = EXCLUDED.kerapihan,
            catatan = EXCLUDED.catatan,
            keputusan_kenaikan = EXCLUDED.keputusan_kenaikan`,
          [
            item.santri_id, 
            tahunAjaranId, 
            kategoriId, 
            finalSakit, 
            finalIzin, 
            finalAlpa, 
            item.keaktifan || null, 
            item.akhlaq || null, 
            item.kerapihan || null, 
            item.catatan || null,
            item.keputusan_kenaikan || null
          ]
        );
      }

      await client.query('COMMIT');
      return { success: true, count: dataList.length };
    } catch (error) {
      await client.query('ROLLBACK');
      handleDatabaseError(error);
      return { success: false };
    } finally {
      client.release();
    }
  }

  async getRekapAbsensiBulanan(tahunAjaranId: number | string, kategoriId: number | string, bulan: string): Promise<any> {
    try {
      if (!tahunAjaranId || !kategoriId || !bulan) {
        throw new ValidationError('tahun_ajaran_id, kategori_evaluasi_id, dan bulan dibutuhkan');
      }

      // 1. Fetch info tahun ajaran & kategori evaluasi
      const taRes = await db.query('SELECT id, kode FROM tahun_ajaran WHERE id = $1', [tahunAjaranId]);
      const tahunAjaran = taRes.rows[0] || null;

      const katRes = await db.query('SELECT id, nama, jenis FROM kategori_evaluasi WHERE id = $1', [kategoriId]);
      const kategoriEvaluasi = katRes.rows[0] || null;
      const katNama = kategoriEvaluasi?.nama || '';
      const isGanjil = katNama.toLowerCase().includes('ganjil');
      const isGenap = katNama.toLowerCase().includes('genap');

      // 2. Fetch seluruh kelas Diniyah
      const kelasRes = await db.query(
        "SELECT id, nama, tingkat FROM kelas WHERE LOWER(jenis) = 'diniyah' ORDER BY tingkat ASC, nama ASC"
      );
      let kelasList = kelasRes.rows;

      // Fungsi pembobot urutan kelas: Sifir -> 1A..1E -> SP -> 2A..2E -> 3A..3D -> 4A..4B -> 5A..5B -> 6
      const getKelasSortWeight = (nama: string, tingkat: any) => {
        const clean = (nama || '').trim().toUpperCase();
        if (clean.includes('SIFIR')) return 0;
        if (clean === 'SP') return 1.99;
        const match = clean.match(/^(\d+)([A-Z])?/);
        if (match) {
          const t = parseInt(match[1], 10);
          const suffix = match[2] ? match[2].charCodeAt(0) - 64 : 0;
          return t + (suffix * 0.01);
        }
        return (Number(tingkat) || 0) + 0.5;
      };

      kelasList.sort((a: any, b: any) => {
        const wA = getKelasSortWeight(a.nama, a.tingkat);
        const wB = getKelasSortWeight(b.nama, b.tingkat);
        if (wA !== wB) return wA - wB;
        return a.nama.localeCompare(b.nama);
      });

      // 3. Fetch seluruh santri aktif di semester ini beserta absensi bulanan untuk bulan yang dipilih
      let santriQuery = `
        SELECT 
          sta.kelas_diniyah_id as kelas_id,
          k.nama as nama_kelas,
          k.tingkat as kelas_tingkat,
          s.id as santri_id,
          s.nama,
          s.nis,
          COALESCE(abs.sakit, 0)::INTEGER as sakit,
          COALESCE(abs.izin, 0)::INTEGER as izin,
          COALESCE(abs.alpa, 0)::INTEGER as alpa,
          (COALESCE(abs.sakit, 0) + COALESCE(abs.izin, 0) + COALESCE(abs.alpa, 0))::INTEGER as total_absen
        FROM santri_tahun_ajaran sta
        JOIN santri s ON sta.santri_id = s.id
        JOIN kelas k ON sta.kelas_diniyah_id = k.id
        LEFT JOIN absensi_bulanan_santri abs 
          ON abs.santri_id = s.id 
         AND abs.tahun_ajaran_id = sta.tahun_ajaran_id 
         AND abs.kategori_evaluasi_id = $2
         AND LOWER(abs.bulan) = LOWER($3)
        WHERE sta.tahun_ajaran_id = $1
          AND COALESCE(sta.status, 'aktif') IN ('aktif', 'draft', 'tidak_naik', 'lulus', 'alumni')
      `;

      if (isGanjil) {
        santriQuery += ` AND sta.aktif_ganjil = true`;
      } else if (isGenap) {
        santriQuery += ` AND sta.aktif_genap = true`;
      }

      santriQuery += ` ORDER BY s.nama ASC`;

      const santriRes = await db.query(santriQuery, [tahunAjaranId, kategoriId, bulan]);
      const allSantri = santriRes.rows;

      // 4. Kelompokkan santri per kelas
      const santriByKelas: Record<number, any[]> = {};
      allSantri.forEach((s: any) => {
        if (!santriByKelas[s.kelas_id]) {
          santriByKelas[s.kelas_id] = [];
        }
        santriByKelas[s.kelas_id].push(s);
      });

      const rekapKelas = kelasList.map((kls: any) => {
        const santriList = santriByKelas[kls.id] || [];
        return {
          kelas_id: kls.id,
          nama_kelas: kls.nama,
          tingkat: kls.tingkat,
          sort_weight: getKelasSortWeight(kls.nama, kls.tingkat),
          total_santri: santriList.length,
          santri: santriList
        };
      }).filter((kls: any) => kls.santri.length > 0);

      // 5. Filter Santri Terjaring Batasan Absen:
      // Alfa minimal 1 (>= 1)
      // Izin minimal 4 (>= 4)
      // Sakit minimal 6 (>= 6)
      const sortTerjaring = (list: any[]) => {
        return list.slice().sort((a, b) => {
          const wA = getKelasSortWeight(a.nama_kelas, a.kelas_tingkat);
          const wB = getKelasSortWeight(b.nama_kelas, b.kelas_tingkat);
          if (wA !== wB) return wA - wB;
          return a.nama.localeCompare(b.nama);
        });
      };

      const terjaringAlfa = sortTerjaring(allSantri.filter((s: any) => s.alpa >= 1));
      const terjaringIzin = sortTerjaring(allSantri.filter((s: any) => s.izin >= 4));
      const terjaringSakit = sortTerjaring(allSantri.filter((s: any) => s.sakit >= 6));

      return {
        tahun_ajaran: tahunAjaran,
        kategori_evaluasi: kategoriEvaluasi,
        bulan: bulan,
        rekap_kelas: rekapKelas,
        santri_terjaring: {
          alfa: terjaringAlfa,
          izin: terjaringIzin,
          sakit: terjaringSakit
        }
      };
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  async savePeringkatManual(tahunAjaranId: number | string, kategoriId: number | string, dataList: any[]): Promise<{ success: boolean }> {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      for (const item of dataList) {
        if (!item.santri_id) continue;
        await client.query(
          `INSERT INTO rapor_santri 
            (santri_id, tahun_ajaran_id, kategori_evaluasi_id, peringkat_manual)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (santri_id, tahun_ajaran_id, kategori_evaluasi_id)
           DO UPDATE SET peringkat_manual = EXCLUDED.peringkat_manual`,
          [item.santri_id, tahunAjaranId, kategoriId, item.peringkat_manual]
        );
      }
      await client.query('COMMIT');
      return { success: true };
    } catch (error) {
      await client.query('ROLLBACK');
      handleDatabaseError(error);
      return { success: false };
    } finally {
      client.release();
    }
  }

  async getCetakRapor(tahunAjaranId: number | string, kelasId: number | string, kategoriId: number | string, santriId: number | string): Promise<any> {
    try {
      const kelasRes = await db.query(`
        SELECT k.id, k.jenis, k.nama, k.tingkat, k.created_at,
               COALESCE(kta.mustahiq_id, k.mustahiq_id) as mustahiq_id,
               COALESCE(kta.muhafadzoh_mapel_id, k.muhafadzoh_mapel_id) as muhafadzoh_mapel_id,
               COALESCE(kta.qiroatul_mapel_id, k.qiroatul_mapel_id) as qiroatul_mapel_id,
               g.nama as mustahiq_nama, g.ttd_url as mustahiq_ttd_url,
               m.nama as muhafadzoh_nama, m.nama_arab as muhafadzoh_arab,
               q.nama as qiroatul_nama, q.nama_arab as qiroatul_arab
        FROM kelas k
        LEFT JOIN kelas_tahun_ajaran kta ON k.id = kta.kelas_id AND kta.tahun_ajaran_id = $2
        LEFT JOIN guru g ON COALESCE(kta.mustahiq_id, k.mustahiq_id) = g.id
        LEFT JOIN mata_pelajaran m ON COALESCE(kta.muhafadzoh_mapel_id, k.muhafadzoh_mapel_id) = m.id
        LEFT JOIN mata_pelajaran q ON COALESCE(kta.qiroatul_mapel_id, k.qiroatul_mapel_id) = q.id
        WHERE k.id = $1
      `, [kelasId, tahunAjaranId]);
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
      const taRes = await db.query('SELECT kode as nama FROM tahun_ajaran WHERE id = $1', [tahunAjaranId]);
      const tahunAjaranName = taRes.rows[0]?.nama || '';

      // 6. Get Nilai for this santri specifically with mapel details
      const tingkatParam = (kelasData.nama === 'SP' && kelasData.tingkat === 1) ? 99 : kelasData.tingkat;
      const allMt = await this.getMapelTingkat(tahunAjaranId, kategoriId);
      let allowedMtIds = (allMt || [])
        .filter((mt: any) => Number(mt.tingkat) === Number(tingkatParam))
        .map((mt: any) => Number(mt.mata_pelajaran_id));

      if (tingkatParam === 99 && allowedMtIds.length === 0) {
        const key = `mapel_tingkat_configured_${tahunAjaranId}_${kategoriId}`;
        let isConfigured99 = false;
        try {
          const confRes = await db.query('SELECT value FROM system_settings WHERE key = $1 LIMIT 1', [key]);
          if (confRes.rows.length > 0 && confRes.rows[0].value) {
            const arr = JSON.parse(confRes.rows[0].value);
            if (Array.isArray(arr) && arr.includes(99)) isConfigured99 = true;
          }
        } catch (e) {}
        if (!isConfigured99) {
          allowedMtIds = (allMt || [])
            .filter((mt: any) => Number(mt.tingkat) === 2)
            .map((mt: any) => Number(mt.mata_pelajaran_id));
        }
      }

      const nilaiRes = await db.query(`
        SELECT n.*, m.nama as mapel_nama, m.nama_arab as mapel_arab, m.jenis as mapel_jenis
        FROM nilai_santri n
        JOIN mata_pelajaran m ON n.mata_pelajaran_id = m.id
        WHERE n.santri_id = $1 AND n.tahun_ajaran_id = $2 AND n.kategori_evaluasi_id = $3
          AND (
            m.jenis != 'Reguler'
            OR m.id = ANY($4::int[])
          )
      `, [santriId, tahunAjaranId, kategoriId, allowedMtIds]);
      const nilaiList = nilaiRes.rows;

      // 7. Get Rekap Data to find Peringkat and Total (Call existing method)
      const rekapData = await this.getRekapNilai(tahunAjaranId, kelasId, kategoriId);

      // Compute Peringkat logic 
      const pivoted: Record<number, any> = {};
      rekapData.forEach((row: any) => {
        if (!pivoted[row.santri_id]) {
          pivoted[row.santri_id] = {
            santri_id: row.santri_id,
            total_nilai: 0,
            mapel_count: 0,
            peringkat_manual: row.peringkat_manual
          };
        }
        if (row.jenis_mapel === 'Reguler' || row.jenis_mapel === 'Qiroah') {
          if (row.nilai_angka !== null) {
            pivoted[row.santri_id].total_nilai += Number(row.nilai_angka);
            pivoted[row.santri_id].mapel_count++;
          }
        }
      });
      const rekapArr = Object.values(pivoted);
      // Sort by total_nilai 
      rekapArr.sort((a, b) => b.total_nilai - a.total_nilai);
      rekapArr.forEach((item, idx) => {
        item.peringkat_sistem = idx + 1;
        item.peringkat = item.peringkat_manual || item.peringkat_sistem;
      });
      const rankIndex = rekapArr.findIndex(r => r.santri_id == santriId);
      const peringkat = rankIndex >= 0 ? rekapArr[rankIndex].peringkat : '-';
      // Total and rata-rata 
      const totalNilai = rankIndex >= 0 ? rekapArr[rankIndex].total_nilai : 0;
      const rataRata = rankIndex >= 0 && rekapArr[rankIndex].mapel_count > 0 
        ? (rekapArr[rankIndex].total_nilai / rekapArr[rankIndex].mapel_count).toFixed(2) 
        : 0;

      // 8. Get Settings
      const settingsRes = await db.query("SELECT key, value FROM system_settings WHERE key LIKE 'rapor_%'");
      const settings: Record<string, any> = {};
      settingsRes.rows.forEach((r: { key: string; value: any }) => settings[r.key] = r.value);

      return {
        santri: santriData,
        kelas: kelasData,
        tahun_ajaran: tahunAjaranName,
        semester: kategoriName,
        nilai: nilaiList,
        tambahan: raporTambahan,
        settings,
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

const nilaiService = new NilaiService();
module.exports = nilaiService;
export default nilaiService;
