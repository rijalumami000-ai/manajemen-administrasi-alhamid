import express from 'express';
import db from '../../db';
import { getActiveTahunAjaran } from '../services/tahunAjaranService';
import { authenticateToken } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/errorHandler';

function registerSetoranHafalanRoutes(app) {
  const router = express.Router();
  router.use(authenticateToken);

  // Helper: Dapatkan Kategori Evaluasi ID untuk Ganjil dan Genap
  async function getSemesterCategories() {
    const categories = await db.query(
      `SELECT id, nama FROM kategori_evaluasi WHERE LOWER(nama) LIKE '%semester%' ORDER BY id ASC`
    );
    let ganjilId = 1;
    let genapId = 2;
    for (const c of categories.rows) {
      if (c.nama.toLowerCase().includes('ganjil')) ganjilId = c.id;
      if (c.nama.toLowerCase().includes('genap')) genapId = c.id;
    }
    return { ganjilId, genapId };
  }

  // Helper: Ambil kriteria evaluasi Muhafadzoh dari setting_kriteria_nilai
  async function getKriteriaMuhafadzoh(tingkat, mapelId, tahunAjaranId, kategoriId) {
    const query = `
      SELECT id, tipe_input, konfigurasi, tahun_ajaran_id, kategori_evaluasi_id
      FROM setting_kriteria_nilai
      WHERE (tahun_ajaran_id = $1 OR tahun_ajaran_id IS NULL)
        AND (kategori_evaluasi_id = $2 OR kategori_evaluasi_id IS NULL)
        AND (
          mata_pelajaran_id = $3
          OR mata_pelajaran_id IN (SELECT id FROM mata_pelajaran WHERE jenis = 'Muhafadzoh' OR nama ILIKE '%muhafadzoh%')
          OR jenis_mapel = 'Muhafadzoh'
          OR (mata_pelajaran_id IS NULL AND jenis_mapel IS NULL)
        )
        AND (tingkat = $4 OR ($4 = 99 AND tingkat = 2))
      ORDER BY 
        (CASE WHEN tahun_ajaran_id = $1 THEN 1 ELSE 2 END) ASC,
        (CASE WHEN kategori_evaluasi_id = $2 THEN 1 ELSE 2 END) ASC,
        (CASE WHEN mata_pelajaran_id = $3 THEN 1 
              WHEN mata_pelajaran_id IN (SELECT id FROM mata_pelajaran WHERE jenis = 'Muhafadzoh') THEN 2 
              ELSE 3 END) ASC,
        (CASE WHEN tingkat = $4 THEN 1 ELSE 2 END) ASC,
        id DESC
      LIMIT 1
    `;
    const res = await db.query(query, [tahunAjaranId, kategoriId, mapelId, tingkat]);
    if (res.rows.length > 0) {
      return res.rows[0];
    }
    // Fallback default jika belum diset di web
    return {
      tipe_input: tingkat === 0 || tingkat === 2 || tingkat === 99 ? 'Teks' : 'Angka',
      konfigurasi: null
    };
  }

  // Helper: Parse konfigurasi skala angka secara aman
  function parseConfigAngka(konfigurasi) {
    if (!konfigurasi || typeof konfigurasi !== 'object' || Array.isArray(konfigurasi)) {
      return null;
    }
    const mumtazMax = Number(konfigurasi.Mumtaz?.max) || 0;
    const jayyidMin = Number(konfigurasi.Jayyid?.min) || 0;
    const jayyidMax = Number(konfigurasi.Jayyid?.max) || 0;
    const mutawassithMin = Number(konfigurasi.Mutawassith?.min) || 0;
    const mutawassithMax = Number(konfigurasi.Mutawassith?.max) || 0;
    const rodiMin = Number(konfigurasi["Rodi'"]?.min) || 1;
    const rodiMax = Number(konfigurasi["Rodi'"]?.max) || 0;

    // Batas bawah Mumtaz otomatis tepat di atas nilai maksimum Jayyid
    const mumtazMin = jayyidMax > 0 ? (jayyidMax + 1) : (mumtazMax || 1);

    return {
      mumtaz: { min: mumtazMin, max: mumtazMax, label: 'Mumtaz' },
      jayyid: { min: jayyidMin, max: jayyidMax, label: 'Jayyid' },
      mutawassith: { min: mutawassithMin, max: mutawassithMax, label: 'Mutawassith' },
      rodi: { min: rodiMin, max: rodiMax, label: "Rodi'" }
    };
  }

  // Helper: Normalisasi teks Arab untuk pencocokan Bab
  function normalizeArabicText(text) {
    if (!text) return '';
    return text
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[\u064B-\u065F\u0670]/g, '') // remove tashkeel/harakat
      .replace(/\u0640/g, '') // remove tatweel/kashida
      .replace(/[أإآ]/g, 'ا') // normalize alif hamzah
      .replace(/[ى]/g, 'ي')
      .replace(/ة/g, 'ه')
      .replace(/\s+/g, ' ');
  }

  // Helper: Pencocokan nama bab secara cerdas (string, normalized, nomor bab, substring)
  function findBabMatch(queryBab, babList) {
    if (!queryBab || !Array.isArray(babList) || babList.length === 0) return null;
    const qStr = queryBab.toString().trim();
    const qNorm = normalizeArabicText(qStr);

    // 1. Direct or normalized match
    for (let i = 0; i < babList.length; i++) {
      const item = babList[i];
      const bStr = (item.bab || '').trim();
      if (bStr.toLowerCase() === qStr.toLowerCase()) {
        return { item, index: i + 1 };
      }
      if (normalizeArabicText(bStr) === qNorm) {
        return { item, index: i + 1 };
      }
    }

    // 2. Numeric / index match: "Bab 14", "14", "Bab ke-14"
    const numMatch = qStr.match(/\b(\d+)\b/);
    if (numMatch) {
      const num = parseInt(numMatch[1], 10);
      if (num >= 1 && num <= babList.length) {
        return { item: babList[num - 1], index: num };
      }
    }

    // 3. Substring match
    for (let i = 0; i < babList.length; i++) {
      const item = babList[i];
      const bNorm = normalizeArabicText(item.bab || '');
      if (bNorm.includes(qNorm) || qNorm.includes(bNorm)) {
        return { item, index: i + 1 };
      }
    }

    return null;
  }

  // Helper: Rentang bab teks per predikat
  function getBabRangeText(list, predikat) {
    if (!Array.isArray(list) || list.length === 0) return '-';
    const indices = [];
    list.forEach((b, idx) => {
      if ((b.predikat || '').toLowerCase() === predikat.toLowerCase()) {
        indices.push(idx + 1);
      }
    });
    if (indices.length === 0) return '-';
    if (indices.length === 1) return `Bab ke-${indices[0]}`;
    return `Bab ke-${indices[0]} s/d ${indices[indices.length - 1]}`;
  }

  // Helper: Evaluasi Predikat dan Pencapaian Santri
  function evaluateProgress(currentBait, currentBab, tipeInput, kriteriaGanjil, kriteriaGenap, isGanjilActive) {
    let predikat = '-';
    let persentase = 0;
    let isMelampauiGanjil = false;
    let targetSemesterAktif = 100;
    let targetGenap = 200;
    let babIndex = null;

    const parsedGanjil = parseConfigAngka(kriteriaGanjil?.konfigurasi);
    const parsedGenap = parseConfigAngka(kriteriaGenap?.konfigurasi);

    if (tipeInput === 'Angka') {
      const baitVal = Number(currentBait) || 0;

      // Target Mumtaz untuk Ganjil dan Genap
      const ganjilMumtaz = parsedGanjil?.mumtaz?.max || 100;
      const genapMumtaz = parsedGenap?.mumtaz?.max || ganjilMumtaz;

      targetSemesterAktif = isGanjilActive ? ganjilMumtaz : genapMumtaz;
      targetGenap = genapMumtaz;

      persentase = targetSemesterAktif > 0 ? Math.round((baitVal / targetSemesterAktif) * 100) : 0;

      if (baitVal <= 0) {
        predikat = 'Belum Setor';
        persentase = 0;
        return { predikat, persentase, isMelampauiGanjil: false, targetSemesterAktif, targetGenap, babIndex: null };
      }

      if (isGanjilActive) {
        // Semester Ganjil aktif
        if (baitVal >= genapMumtaz) {
          isMelampauiGanjil = true;
          predikat = 'Mumtaz (Tuntas Genap)';
        } else if (baitVal > ganjilMumtaz) {
          isMelampauiGanjil = true;
          predikat = 'Mumtaz (Melampaui Target Ganjil)';
        } else if (baitVal >= (parsedGanjil?.mumtaz?.min || ganjilMumtaz)) {
          predikat = 'Mumtaz';
        } else if (parsedGanjil?.jayyid && baitVal >= parsedGanjil.jayyid.min && baitVal <= (parsedGanjil.jayyid.max || 999999)) {
          predikat = 'Jayyid';
        } else if (parsedGanjil?.mutawassith && baitVal >= parsedGanjil.mutawassith.min && baitVal <= (parsedGanjil.mutawassith.max || 999999)) {
          predikat = 'Mutawassith';
        } else if (parsedGanjil?.rodi && baitVal >= parsedGanjil.rodi.min) {
          predikat = "Rodi'";
        } else {
          predikat = "Rodi'";
        }
      } else {
        // Semester Genap aktif
        const cfgGenap = parsedGenap || parsedGanjil;
        if (baitVal >= genapMumtaz) {
          predikat = 'Mumtaz (Tuntas Genap)';
        } else if (baitVal >= (cfgGenap?.mumtaz?.min || genapMumtaz)) {
          predikat = 'Mumtaz';
        } else if (cfgGenap?.jayyid && baitVal >= cfgGenap.jayyid.min && baitVal <= (cfgGenap.jayyid.max || 999999)) {
          predikat = 'Jayyid';
        } else if (cfgGenap?.mutawassith && baitVal >= cfgGenap.mutawassith.min && baitVal <= (cfgGenap.mutawassith.max || 999999)) {
          predikat = 'Mutawassith';
        } else if (cfgGenap?.rodi && baitVal >= cfgGenap.rodi.min) {
          predikat = "Rodi'";
        } else {
          predikat = "Rodi'";
        }
      }
    } else {
      // Model Bab / Teks
      const listGanjil = Array.isArray(kriteriaGanjil?.konfigurasi) ? kriteriaGanjil.konfigurasi : [];
      const listGenap = Array.isArray(kriteriaGenap?.konfigurasi) ? kriteriaGenap.konfigurasi : [];
      const totalBabGanjil = listGanjil.length || 14;
      const totalBabGenap = listGenap.length || totalBabGanjil || 26;

      targetSemesterAktif = isGanjilActive ? totalBabGanjil : totalBabGenap;
      targetGenap = totalBabGenap;

      if (!currentBab) {
        predikat = 'Belum Setor';
        persentase = 0;
        return { predikat, persentase, isMelampauiGanjil: false, targetSemesterAktif, targetGenap, babIndex: null };
      }

      // Cari di list Genap terlebih dahulu karena memuat daftar lengkap
      const matchGe = findBabMatch(currentBab, listGenap);
      const matchG = findBabMatch(currentBab, listGanjil);

      if (matchGe) {
        babIndex = matchGe.index;
      } else if (matchG) {
        babIndex = matchG.index;
      }

      if (isGanjilActive) {
        if (babIndex && babIndex >= totalBabGenap) {
          isMelampauiGanjil = true;
          predikat = 'Mumtaz (Tuntas Genap)';
          persentase = 100;
        } else if (babIndex && babIndex > totalBabGanjil) {
          isMelampauiGanjil = true;
          predikat = 'Mumtaz (Melampaui Target Ganjil)';
          persentase = 100;
        } else if (matchG) {
          predikat = matchG.item.predikat || 'Tuntas';
          persentase = Math.min(100, Math.round((matchG.index / totalBabGanjil) * 100));
        } else if (matchGe) {
          isMelampauiGanjil = true;
          predikat = matchGe.item.predikat ? `${matchGe.item.predikat} (Genap)` : 'Mumtaz (Melampaui Target Ganjil)';
          persentase = 100;
        } else {
          predikat = 'Tercatat';
          persentase = 50;
        }
      } else {
        // Genap aktif
        if (babIndex && babIndex >= totalBabGenap) {
          predikat = 'Mumtaz (Tuntas Genap)';
          persentase = 100;
        } else if (matchGe) {
          predikat = matchGe.item.predikat || 'Tuntas';
          persentase = Math.min(100, Math.round((matchGe.index / totalBabGenap) * 100));
        } else if (matchG) {
          predikat = matchG.item.predikat || 'Tercatat';
          persentase = Math.min(100, Math.round((matchG.index / totalBabGenap) * 100));
        } else {
          predikat = 'Tercatat';
          persentase = 50;
        }
      }
    }

    return { predikat, persentase, isMelampauiGanjil, targetSemesterAktif, targetGenap, babIndex };
  }

  /**
   * GET /api/my-mustahiq/setoran/overview
   * Mengembalikan:
   * - Data kelas, mustahiq, kitab muhafadzoh
   * - Pengaturan ritme setoran kelas saat ini
   * - Standar kriteria ganjil & genap
   * - Daftar seluruh santri beserta akumulasi capaian, predikat, & progress bar
   */
  router.get('/setoran/overview', asyncHandler(async (req, res) => {
    const guruId = req.user.guru_id;
    const { kelas_id, tahun_ajaran_id, semester } = req.query as any;

    const activeYear = tahun_ajaran_id
      ? (await db.query('SELECT id, kode FROM tahun_ajaran WHERE id = $1', [parseInt(tahun_ajaran_id, 10)])).rows[0]
      : await getActiveTahunAjaran();

    if (!activeYear) return res.status(404).json({ error: 'Tahun ajaran tidak ditemukan.' });

    const semResult = await db.query("SELECT value FROM system_settings WHERE key = 'active_semester' LIMIT 1");
    const systemActiveSemester = semResult.rows[0] ? semResult.rows[0].value : 'Ganjil';
    const activeSemester = semester || systemActiveSemester;
    const isSemesterActive = activeSemester.toLowerCase().trim() === systemActiveSemester.toLowerCase().trim();
    const isGanjilActive = activeSemester.toLowerCase().includes('ganjil');

    const { ganjilId, genapId } = await getSemesterCategories();
    const currentKategoriId = isGanjilActive ? ganjilId : genapId;

    // Tentukan Kelas ID: dari query (web / admin) atau dari kelas binaan mustahiq login
    let targetKelasId = kelas_id ? parseInt(kelas_id, 10) : null;
    if (!targetKelasId && guruId) {
      const mustahiqRes = await db.query(
        `SELECT kta.kelas_id 
         FROM kelas_tahun_ajaran kta
         WHERE kta.mustahiq_id = $1 AND kta.tahun_ajaran_id = $2
         LIMIT 1`,
        [guruId, activeYear.id]
      );
      if (mustahiqRes.rows.length > 0) {
        targetKelasId = mustahiqRes.rows[0].kelas_id;
      }
    }

    if (!targetKelasId) {
      return res.status(400).json({
        error: 'Kelas belum dipilih atau Anda belum terdaftar sebagai Mustahiq pada tahun ajaran ini.'
      });
    }

    // Detail Kelas & Muhafadzoh Kitab
    const classRes = await db.query(
      `SELECT k.id, k.nama, k.tingkat, k.jenis,
              kta.mustahiq_id, g.nama AS mustahiq_nama,
              kta.muhafadzoh_mapel_id, mp.nama AS muhafadzoh_nama
       FROM kelas k
       JOIN kelas_tahun_ajaran kta ON kta.kelas_id = k.id AND kta.tahun_ajaran_id = $2
       LEFT JOIN guru g ON g.id = kta.mustahiq_id
       LEFT JOIN mata_pelajaran mp ON mp.id = kta.muhafadzoh_mapel_id
       WHERE k.id = $1
       LIMIT 1`,
      [targetKelasId, activeYear.id]
    );

    if (classRes.rows.length === 0) {
      return res.status(404).json({ error: 'Informasi kelas untuk tahun ajaran ini tidak ditemukan.' });
    }
    const classDetail = classRes.rows[0];
    const effectiveTingkat = (classDetail.nama === 'SP' || classDetail.tingkat === 99) ? 99 : classDetail.tingkat;

    // Ambil Kriteria Penilaian Muhafadzoh dari Web (Pengaturan Kriteria)
    const kriteriaGanjil = await getKriteriaMuhafadzoh(effectiveTingkat, classDetail.muhafadzoh_mapel_id, activeYear.id, ganjilId);
    let kriteriaGenap = await getKriteriaMuhafadzoh(effectiveTingkat, classDetail.muhafadzoh_mapel_id, activeYear.id, genapId);

    // Jika model Ganjil adalah Teks (misal Kelas 0 Sifir atau Kelas 2/SP) dan Genap di TA aktif belum diset, samakan tipe inputnya
    if (kriteriaGanjil?.tipe_input === 'Teks' && kriteriaGenap?.tipe_input !== 'Teks' && kriteriaGenap?.tahun_ajaran_id !== activeYear.id) {
      kriteriaGenap = kriteriaGanjil;
    }

    // Tipe input efektif: 'Angka' atau 'Teks' (dinamis dari kriteria web)
    const activeKriteria = isGanjilActive ? kriteriaGanjil : kriteriaGenap;
    const tipeInput = activeKriteria?.tipe_input || (effectiveTingkat === 0 || effectiveTingkat === 2 || effectiveTingkat === 99 ? 'Teks' : 'Angka');

    // Daftar Santri di Kelas ini
    const isGenap = activeSemester.toLowerCase().includes('genap');
    let santriQuery = `
      SELECT sta.santri_id AS id, sta.nis, sta.nama, s.foto_url
      FROM santri_tahun_ajaran sta
      JOIN santri s ON s.id = sta.santri_id
      WHERE sta.kelas_diniyah_id = $1 AND sta.tahun_ajaran_id = $2 AND COALESCE(sta.status, 'aktif') IN ('aktif', 'draft', 'tidak_naik', 'lulus', 'alumni')
    `;
    if (isGenap) santriQuery += ' AND sta.aktif_genap = TRUE';
    else santriQuery += ' AND sta.aktif_ganjil = TRUE';
    santriQuery += ' ORDER BY sta.nama ASC';
    const santriRes = await db.query(santriQuery, [targetKelasId, activeYear.id]);

    // Agregasi Riwayat Setoran Santri per semester yang dipilih
    const setoranAggRes = await db.query(
      `SELECT 
         santri_id,
         COUNT(CASE WHEN kategori_evaluasi_id = $3 THEN id END) AS total_sesi_setoran,
         COALESCE(MAX(bait_akhir), 0) AS bait_terakhir,
         COALESCE(SUM(CASE WHEN kategori_evaluasi_id = $3 THEN jumlah_bait ELSE 0 END), 0) AS total_nadzom_disetor,
         MAX(CASE WHEN kategori_evaluasi_id = $3 THEN tanggal_setor END) AS tanggal_setor_terakhir
       FROM riwayat_setoran_nadzom
       WHERE kelas_id = $1 AND tahun_ajaran_id = $2
       GROUP BY santri_id`,
      [targetKelasId, activeYear.id, currentKategoriId]
    );

    const aggMap = new Map();
    for (const row of setoranAggRes.rows) {
      aggMap.set(row.santri_id, row);
    }

    // Ambil info setoran terakhir santri untuk status kelancaran & nama bab terakhir (sesuai semester)
    const latestSetoranRes = await db.query(
      `SELECT DISTINCT ON (santri_id) 
         santri_id, nama_bab, status_kelancaran, catatan, tanggal_setor, bait_akhir
       FROM riwayat_setoran_nadzom
       WHERE kelas_id = $1 AND tahun_ajaran_id = $2 AND kategori_evaluasi_id = $3
       ORDER BY santri_id, tanggal_setor DESC, id DESC`,
      [targetKelasId, activeYear.id, currentKategoriId]
    );

    const latestMap = new Map();
    for (const row of latestSetoranRes.rows) {
      latestMap.set(row.santri_id, row);
    }

    // Hitung tanggal 7 hari yang lalu untuk filter santri belum setor sepekan terakhir
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let countTuntasGanjil = 0;
    let countMelampaui = 0;
    let countBelumSetorPekanIni = 0;

    // Konfigurasi target Bab untuk model Teks
    const isTeks = tipeInput === 'Teks';
    const listBabGanjil = Array.isArray(kriteriaGanjil?.konfigurasi) ? kriteriaGanjil.konfigurasi : [];
    const listBabGenap = Array.isArray(kriteriaGenap?.konfigurasi) ? kriteriaGenap.konfigurasi : [];

    const totalBabGanjil = listBabGanjil.length || 14;
    const totalBabGenap = listBabGenap.length || totalBabGanjil || 26;

    const mumtazBabGanjil = listBabGanjil.find(b => (b.predikat || '').toLowerCase() === 'mumtaz') || listBabGanjil[listBabGanjil.length - 1];
    const mumtazBabGenap = listBabGenap.find(b => (b.predikat || '').toLowerCase() === 'mumtaz') || listBabGenap[listBabGenap.length - 1];

    const fullBabList = listBabGenap.length >= listBabGanjil.length ? listBabGenap : listBabGanjil;
    const daftarBabSemua = fullBabList.map((item, idx) => {
      const babNo = idx + 1;
      const isGanjilScope = babNo <= totalBabGanjil;
      const gItem = isGanjilScope && listBabGanjil[idx] ? listBabGanjil[idx] : null;
      const predGanjil = gItem ? gItem.predikat : (isGanjilScope ? 'Mumtaz' : 'Melampaui Target Ganjil');
      const predGenap = item.predikat || 'Tercatat';
      return {
        index: babNo,
        bab: item.bab,
        predikat: isGanjilActive ? (isGanjilScope ? predGanjil : 'Mumtaz (Melampaui Target Ganjil)') : predGenap,
        predikat_ganjil: predGanjil,
        predikat_genap: predGenap,
        is_target_ganjil: babNo === totalBabGanjil,
        is_target_genap: babNo === totalBabGenap,
        is_genap_scope: !isGanjilScope
      };
    });

    const skalaBab = {
      mumtaz: {
        label: 'Mumtaz (Target Puncak)',
        target_bab: isGanjilActive ? (mumtazBabGanjil?.bab || 'Bab Akhir') : (mumtazBabGenap?.bab || 'Khatam'),
        target_index: isGanjilActive ? totalBabGanjil : totalBabGenap,
        range_text: isGanjilActive 
          ? `Bab ke-${totalBabGanjil} (${mumtazBabGanjil?.bab || 'Bab Akhir'})` 
          : `Bab ke-${totalBabGenap} (${mumtazBabGenap?.bab || 'Khatam'})`,
        desc: isGanjilActive 
          ? `Tuntas Target Ganjil (Melampaui: Bab ${totalBabGanjil + 1} s/d ${totalBabGenap})` 
          : 'Tuntas Target Akhir (Khatam)'
      },
      jayyid: {
        label: 'Jayyid',
        items: listBabGanjil.filter(b => (b.predikat || '').toLowerCase() === 'jayyid').map(b => b.bab),
        range_text: getBabRangeText(listBabGanjil, 'Jayyid'),
        desc: 'Tingkat Baik'
      },
      mutawassith: {
        label: 'Mutawassith',
        items: listBabGanjil.filter(b => (b.predikat || '').toLowerCase() === 'mutawassith').map(b => b.bab),
        range_text: getBabRangeText(listBabGanjil, 'Mutawassith'),
        desc: 'Tingkat Cukup'
      },
      rodi: {
        label: "Rodi'",
        items: listBabGanjil.filter(b => (b.predikat || '').toLowerCase() === "rodi'").map(b => b.bab),
        range_text: getBabRangeText(listBabGanjil, "Rodi'"),
        desc: 'Tahap Awal / Bimbingan'
      }
    };

    const santriList = santriRes.rows.map(s => {
      const agg = aggMap.get(s.id) || {
        total_sesi_setoran: 0,
        bait_terakhir: 0,
        total_nadzom_disetor: 0,
        tanggal_setor_terakhir: null
      };

      const latest = latestMap.get(s.id) || null;

      const evalResult = evaluateProgress(
        agg.bait_terakhir,
        latest?.nama_bab,
        tipeInput,
        kriteriaGanjil,
        kriteriaGenap,
        isGanjilActive
      );

      const hasSetorThisWeek = agg.tanggal_setor_terakhir
        ? new Date(agg.tanggal_setor_terakhir) >= sevenDaysAgo
        : false;

      if (!hasSetorThisWeek) countBelumSetorPekanIni++;
      if (evalResult.persentase >= 100) countTuntasGanjil++;
      if (evalResult.isMelampauiGanjil) countMelampaui++;

      return {
        id: s.id,
        nis: s.nis,
        nama: s.nama,
        foto_url: s.foto_url,
        total_sesi_setoran: parseInt(agg.total_sesi_setoran, 10),
        bait_terakhir: parseInt(agg.bait_terakhir, 10),
        total_nadzom_disetor: parseInt(agg.total_nadzom_disetor, 10),
        nama_bab_terakhir: latest?.nama_bab || null,
        bab_index: evalResult.babIndex || null,
        status_kelancaran_terakhir: latest?.status_kelancaran || null,
        catatan_terakhir: latest?.catatan || null,
        tanggal_setor_terakhir: agg.tanggal_setor_terakhir,
        has_setor_this_week: hasSetorThisWeek,
        predikat: evalResult.predikat,
        persentase: evalResult.persentase,
        is_melampaui_ganjil: evalResult.isMelampauiGanjil,
        target_semester: isTeks ? (isGanjilActive ? totalBabGanjil : totalBabGenap) : evalResult.targetSemesterAktif,
        target_semester_nama: isTeks ? (isGanjilActive ? mumtazBabGanjil?.bab : mumtazBabGenap?.bab) : null,
        target_genap: isTeks ? totalBabGenap : evalResult.targetGenap,
        target_genap_nama: isTeks ? mumtazBabGenap?.bab : null
      };
    });

    const parsedGanjil = parseConfigAngka(kriteriaGanjil?.konfigurasi);
    const parsedGenap = parseConfigAngka(kriteriaGenap?.konfigurasi);
    const activeParsed = isGanjilActive ? parsedGanjil : (parsedGenap || parsedGanjil);
    const ganjilMumtaz = isTeks ? totalBabGanjil : (parsedGanjil?.mumtaz?.max || 100);
    const genapMumtaz = isTeks ? totalBabGenap : (parsedGenap?.mumtaz?.max || ganjilMumtaz);
    const activeTarget = isGanjilActive ? ganjilMumtaz : genapMumtaz;

    res.json({
      kelas: classDetail,
      tahunAjaran: activeYear,
      semester: activeSemester,
      is_semester_active: isSemesterActive,
      system_active_semester: systemActiveSemester,
      kategoriEvaluasiId: currentKategoriId,
      tipeInput,
      kriteria: {
        ganjil: kriteriaGanjil,
        genap: kriteriaGenap
      },
      kriteriaInfo: {
        tipe: tipeInput,
        target_semester_aktif: isTeks ? (isGanjilActive ? totalBabGanjil : totalBabGenap) : activeTarget,
        target_ganjil: isTeks ? totalBabGanjil : ganjilMumtaz,
        target_genap: isTeks ? totalBabGenap : genapMumtaz,
        target_ganjil_nama: mumtazBabGanjil?.bab || '',
        target_genap_nama: mumtazBabGenap?.bab || '',
        target_semester_nama: isGanjilActive ? (mumtazBabGanjil?.bab || '') : (mumtazBabGenap?.bab || ''),
        total_bab_ganjil: totalBabGanjil,
        total_bab_genap: totalBabGenap,
        batas_maksimal: isTeks ? totalBabGenap : genapMumtaz,
        is_ganjil: isGanjilActive,
        skala_aktif: isTeks ? null : activeParsed,
        skala_ganjil: isTeks ? null : parsedGanjil,
        skala_genap: isTeks ? null : parsedGenap,
        skala_bab: skalaBab,
        daftar_bab_ganjil: listBabGanjil,
        daftar_bab_genap: listBabGenap,
        daftar_bab_semua: daftarBabSemua
      },
      stats: {
        totalSantri: santriList.length,
        countTuntasGanjil,
        countMelampaui,
        countBelumSetorPekanIni
      },
      santriList
    });
  }));

  /**
   * POST /api/my-mustahiq/setoran/konfigurasi
   * Menyimpan / memperbarui ritme penarikan setoran kelas oleh Mustahiq
   */
  router.post('/setoran/konfigurasi', asyncHandler(async (req, res) => {
    const { kelas_id, tahun_ajaran_id, kategori_evaluasi_id, mode_frekuensi, interval_hari, target_per_setoran, catatan } = req.body;
    const mustahiqId = req.user.guru_id || null;

    if (!kelas_id || !tahun_ajaran_id || !kategori_evaluasi_id) {
      return res.status(400).json({ error: 'Parameter kelas_id, tahun_ajaran_id, dan kategori_evaluasi_id wajib diisi.' });
    }

    const upsertQuery = `
      INSERT INTO konfigurasi_setoran_kelas 
        (kelas_id, tahun_ajaran_id, kategori_evaluasi_id, mustahiq_id, mode_frekuensi, interval_hari, target_per_setoran, catatan, updated_at)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
      ON CONFLICT (kelas_id, tahun_ajaran_id, kategori_evaluasi_id)
      DO UPDATE SET
        mustahiq_id = EXCLUDED.mustahiq_id,
        mode_frekuensi = EXCLUDED.mode_frekuensi,
        interval_hari = EXCLUDED.interval_hari,
        target_per_setoran = EXCLUDED.target_per_setoran,
        catatan = EXCLUDED.catatan,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const result = await db.query(upsertQuery, [
      kelas_id,
      tahun_ajaran_id,
      kategori_evaluasi_id,
      mustahiqId,
      mode_frekuensi || 'mingguan',
      interval_hari || 7,
      target_per_setoran || 10,
      catatan || null
    ]);

    res.json({
      message: 'Konfigurasi ritme setoran berhasil disimpan.',
      konfigurasi: result.rows[0]
    });
  }));

  /**
   * GET /api/my-mustahiq/setoran/santri/:santriId
   * Mengembalikan seluruh riwayat timeline setoran seorang santri
   */
  router.get('/setoran/santri/:santriId', asyncHandler(async (req, res) => {
    const santriId = parseInt(req.params.santriId as string, 10);
    const { tahun_ajaran_id, kelas_id } = req.query as any;

    const santriRes = await db.query(
      `SELECT id, nis, nama, foto_url FROM santri WHERE id = $1`,
      [santriId]
    );
    if (santriRes.rows.length === 0) return res.status(404).json({ error: 'Santri tidak ditemukan.' });

    let query = `
      SELECT r.*, g.nama AS mustahiq_nama, ke.nama AS semester_nama
      FROM riwayat_setoran_nadzom r
      LEFT JOIN guru g ON g.id = r.mustahiq_id
      LEFT JOIN kategori_evaluasi ke ON ke.id = r.kategori_evaluasi_id
      WHERE r.santri_id = $1
    `;
    const params = [santriId];
    let idx = 2;

    if (tahun_ajaran_id) {
      query += ` AND r.tahun_ajaran_id = $${idx++}`;
      params.push(parseInt(tahun_ajaran_id, 10));
    }
    if (kelas_id) {
      query += ` AND r.kelas_id = $${idx++}`;
      params.push(parseInt(kelas_id, 10));
    }

    query += ' ORDER BY r.tanggal_setor DESC, r.id DESC';
    const historyRes = await db.query(query, params);

    res.json({
      santri: santriRes.rows[0],
      riwayat: historyRes.rows
    });
  }));

  /**
   * POST /api/my-mustahiq/setoran/input
   * Input setoran santri (mendukung sinkronisasi Bait Terakhir ATAU Jumlah Nadzom secara otomatis)
   */
  router.post('/setoran/input', asyncHandler(async (req, res) => {
    const guruId = req.user.guru_id || null;
    let {
      santri_id,
      kelas_id,
      tahun_ajaran_id,
      kategori_evaluasi_id,
      tanggal_setor,
      tipe_setoran,
      bait_awal,
      bait_akhir,
      jumlah_bait,
      nama_bab,
      status_kelancaran,
      catatan
    } = req.body;

    if (!santri_id || !kelas_id || !tahun_ajaran_id || !kategori_evaluasi_id) {
      return res.status(400).json({ error: 'santri_id, kelas_id, tahun_ajaran_id, dan kategori_evaluasi_id wajib disertakan.' });
    }

    // Ambil capaian terakhir santri saat ini
    const prevRes = await db.query(
      `SELECT COALESCE(MAX(bait_akhir), 0) AS max_bait
       FROM riwayat_setoran_nadzom
       WHERE santri_id = $1 AND tahun_ajaran_id = $2`,
      [santri_id, tahun_ajaran_id]
    );
    const prevBait = parseInt(prevRes.rows[0]?.max_bait || 0, 10);

    const isAngka = tipe_setoran !== 'Bab';

    if (isAngka) {
      // Dapatkan batas maksimal (Genap) untuk kelas ini
      const classInfo = await db.query(`
        SELECT k.id, k.nama, k.tingkat, COALESCE(kta.muhafadzoh_mapel_id, k.muhafadzoh_mapel_id) AS muhafadzoh_mapel_id
        FROM kelas k
        LEFT JOIN kelas_tahun_ajaran kta ON kta.kelas_id = k.id AND kta.tahun_ajaran_id = $2
        WHERE k.id = $1
      `, [kelas_id, tahun_ajaran_id]);
      const tingkatRaw = classInfo.rows[0]?.tingkat;
      const kelasNama = classInfo.rows[0]?.nama;
      const effectiveTingkat = (kelasNama === 'SP' || tingkatRaw === 99) ? 99 : tingkatRaw;
      const mapelId = classInfo.rows[0]?.muhafadzoh_mapel_id;
      const { ganjilId, genapId } = await getSemesterCategories();
      const kriteriaGenap = await getKriteriaMuhafadzoh(effectiveTingkat, mapelId, tahun_ajaran_id, genapId);
      const kriteriaGanjil = await getKriteriaMuhafadzoh(effectiveTingkat, mapelId, tahun_ajaran_id, ganjilId);
      const parsedGenap = parseConfigAngka(kriteriaGenap?.konfigurasi);
      const parsedGanjil = parseConfigAngka(kriteriaGanjil?.konfigurasi);
      const genapMumtaz = parsedGenap?.mumtaz?.max || parsedGanjil?.mumtaz?.max || 100;

      // Logika cerdas: Jika diberikan jumlah_bait, hitung bait_akhir = prevBait + jumlah_bait
      if (jumlah_bait !== undefined && jumlah_bait !== null) {
        bait_awal = prevBait;
        bait_akhir = prevBait + Number(jumlah_bait);
      } else if (bait_akhir !== undefined && bait_akhir !== null) {
        bait_awal = prevBait;
        jumlah_bait = Math.max(0, Number(bait_akhir) - prevBait);
      } else {
        bait_awal = prevBait;
        bait_akhir = prevBait;
        jumlah_bait = 0;
      }

      // Validasi batas maksimal kitab/kelas
      if (Number(bait_akhir) > genapMumtaz) {
        return res.status(400).json({
          error: `Penambahan tidak boleh melebihi batas maksimal target kitab/kelas (maksimal bait ke-${genapMumtaz}).`
        });
      }
    }

    const insertQuery = `
      INSERT INTO riwayat_setoran_nadzom
        (santri_id, kelas_id, tahun_ajaran_id, kategori_evaluasi_id, mustahiq_id,
         tanggal_setor, tipe_setoran, bait_awal, bait_akhir, jumlah_bait, nama_bab,
         status_kelancaran, catatan)
      VALUES
        ($1, $2, $3, $4, $5, COALESCE($6::DATE, CURRENT_DATE), $7, $8, $9, $10, $11, $12, $13)
      RETURNING *;
    `;

    const result = await db.query(insertQuery, [
      santri_id,
      kelas_id,
      tahun_ajaran_id,
      kategori_evaluasi_id,
      guruId,
      tanggal_setor || null,
      tipe_setoran || 'Angka',
      isAngka ? bait_awal : 0,
      isAngka ? bait_akhir : 0,
      isAngka ? jumlah_bait : 0,
      nama_bab || null,
      status_kelancaran || 'Lancar',
      catatan || null
    ]);

    res.json({
      message: 'Setoran hafalan berhasil dicatat.',
      data: result.rows[0]
    });
  }));

  /**
   * POST /api/my-mustahiq/setoran/bulk-input
   * Input massal untuk Mode Halaqoh saat menyimak banyak santri sekaligus
   */
  router.post('/setoran/bulk-input', asyncHandler(async (req, res) => {
    const guruId = req.user.guru_id || null;
    const { kelas_id, tahun_ajaran_id, kategori_evaluasi_id, tanggal_setor, tipe_setoran, items } = req.body;

    if (!kelas_id || !tahun_ajaran_id || !kategori_evaluasi_id || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Parameter tidak lengkap atau daftar setoran kosong.' });
    }

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      const insertedRows = [];

      for (const item of items) {
        if (!item.santri_id) continue;

        // Cari capaian santri
        const prevRes = await client.query(
          `SELECT COALESCE(MAX(bait_akhir), 0) AS max_bait
           FROM riwayat_setoran_nadzom
           WHERE santri_id = $1 AND tahun_ajaran_id = $2`,
          [item.santri_id, tahun_ajaran_id]
        );
        const prevBait = parseInt(prevRes.rows[0]?.max_bait || 0, 10);

        let baitAwal = item.bait_awal !== undefined ? Number(item.bait_awal) : prevBait;
        let baitAkhir = item.bait_akhir !== undefined ? Number(item.bait_akhir) : null;
        let jumlahBait = item.jumlah_bait !== undefined ? Number(item.jumlah_bait) : null;

        if (baitAkhir !== null && jumlahBait === null) {
          jumlahBait = Math.max(0, baitAkhir - baitAwal);
        } else if (jumlahBait !== null && baitAkhir === null) {
          baitAkhir = baitAwal + jumlahBait;
        } else if (baitAkhir === null && jumlahBait === null) {
          baitAkhir = prevBait;
          jumlahBait = 0;
        }

        const resIns = await client.query(
          `INSERT INTO riwayat_setoran_nadzom
            (santri_id, kelas_id, tahun_ajaran_id, kategori_evaluasi_id, mustahiq_id,
             tanggal_setor, tipe_setoran, bait_awal, bait_akhir, jumlah_bait, nama_bab,
             status_kelancaran, catatan)
           VALUES
            ($1, $2, $3, $4, $5, COALESCE($6::DATE, CURRENT_DATE), $7, $8, $9, $10, $11, $12, $13)
           RETURNING id, santri_id, bait_akhir, jumlah_bait, status_kelancaran;`,
          [
            item.santri_id,
            kelas_id,
            tahun_ajaran_id,
            kategori_evaluasi_id,
            guruId,
            tanggal_setor || null,
            tipe_setoran || 'Angka',
            baitAwal,
            baitAkhir,
            jumlahBait,
            item.nama_bab || null,
            item.status_kelancaran || 'Lancar',
            item.catatan || null
          ]
        );
        insertedRows.push(resIns.rows[0]);
      }

      await client.query('COMMIT');
      res.json({
        message: `Berhasil mencatat setoran untuk ${insertedRows.length} santri.`,
        data: insertedRows
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }));

  /**
   * PUT /api/my-mustahiq/setoran/:id
   * Edit catatan setoran hafalan
   */
  router.put('/setoran/:id', asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id as string, 10);
    let { bait_awal, bait_akhir, jumlah_bait, nama_bab, status_kelancaran, catatan, tanggal_setor } = req.body;

    const existingRes = await db.query('SELECT * FROM riwayat_setoran_nadzom WHERE id = $1', [id]);
    if (existingRes.rows.length === 0) return res.status(404).json({ error: 'Data setoran tidak ditemukan.' });
    const existing = existingRes.rows[0];

    // Cek target maksimal kitab/kelas
    const classInfo = await db.query(`
      SELECT k.id, k.nama, k.tingkat, COALESCE(kta.muhafadzoh_mapel_id, k.muhafadzoh_mapel_id) AS muhafadzoh_mapel_id
      FROM kelas k
      LEFT JOIN kelas_tahun_ajaran kta ON kta.kelas_id = k.id AND kta.tahun_ajaran_id = $2
      WHERE k.id = $1
    `, [existing.kelas_id, existing.tahun_ajaran_id]);
    const tingkatRaw = classInfo.rows[0]?.tingkat;
    const kelasNama = classInfo.rows[0]?.nama;
    const effectiveTingkat = (kelasNama === 'SP' || tingkatRaw === 99) ? 99 : tingkatRaw;
    const mapelId = classInfo.rows[0]?.muhafadzoh_mapel_id;
    const { ganjilId, genapId } = await getSemesterCategories();
    const kriteriaGenap = await getKriteriaMuhafadzoh(effectiveTingkat, mapelId, existing.tahun_ajaran_id, genapId);
    const kriteriaGanjil = await getKriteriaMuhafadzoh(effectiveTingkat, mapelId, existing.tahun_ajaran_id, ganjilId);
    const parsedGenap = parseConfigAngka(kriteriaGenap?.konfigurasi);
    const parsedGanjil = parseConfigAngka(kriteriaGanjil?.konfigurasi);
    const genapMumtaz = parsedGenap?.mumtaz?.max || parsedGanjil?.mumtaz?.max || 100;

    const effectiveBaitAwal = bait_awal !== undefined ? Number(bait_awal) : existing.bait_awal;
    let effectiveBaitAkhir = bait_akhir !== undefined ? Number(bait_akhir) : existing.bait_akhir;
    let effectiveJumlahBait = jumlah_bait !== undefined ? Number(jumlah_bait) : existing.jumlah_bait;

    if (existing.tipe_setoran !== 'Bab') {
      if (jumlah_bait !== undefined && bait_akhir === undefined) {
        effectiveBaitAkhir = effectiveBaitAwal + Number(jumlah_bait);
      } else if (bait_akhir !== undefined && jumlah_bait === undefined) {
        effectiveJumlahBait = Math.max(0, Number(bait_akhir) - effectiveBaitAwal);
      }

      if (effectiveBaitAkhir > genapMumtaz) {
        return res.status(400).json({
          error: `Penambahan tidak boleh melebihi batas maksimal target kitab/kelas (maksimal bait ke-${genapMumtaz}).`
        });
      }
    }

    const updatedRes = await db.query(
      `UPDATE riwayat_setoran_nadzom
       SET bait_awal = $1,
           bait_akhir = $2,
           jumlah_bait = $3,
           nama_bab = COALESCE($4, nama_bab),
           status_kelancaran = COALESCE($5, status_kelancaran),
           catatan = COALESCE($6, catatan),
           tanggal_setor = COALESCE($7::DATE, tanggal_setor),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *;`,
      [effectiveBaitAwal, effectiveBaitAkhir, effectiveJumlahBait, nama_bab, status_kelancaran, catatan, tanggal_setor, id]
    );

    res.json({
      message: 'Catatan setoran berhasil diperbarui.',
      data: updatedRes.rows[0]
    });
  }));

  /**
   * DELETE /api/my-mustahiq/setoran/:id
   * Hapus riwayat setoran yang salah input
   */
  router.delete('/setoran/:id', asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id as string, 10);
    const result = await db.query('DELETE FROM riwayat_setoran_nadzom WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Data setoran tidak ditemukan.' });
    res.json({ message: 'Riwayat setoran berhasil dihapus.', id });
  }));

  app.use('/api/my-mustahiq', router);
}

module.exports = registerSetoranHafalanRoutes;
export default registerSetoranHafalanRoutes;
