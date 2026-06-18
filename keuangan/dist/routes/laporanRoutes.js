"use strict";
/**
 * laporanRoutes.ts + laporanSPPService — Semua laporan keuangan
 * Setiap laporan menampilkan angka Rupiah lengkap: Target · Terkumpul · Sisa · % Realisasi
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerLaporanRoutes = registerLaporanRoutes;
const db_1 = require("../db");
const validators_1 = require("../utils/validators");
const keuangan_1 = require("../types/keuangan");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { authenticateToken } = require('../../../src/middleware/authMiddleware');
const roleGuard_1 = require("../middleware/roleGuard");
function registerLaporanRoutes(app) {
    // ════════════════════════════════════════════════════════════
    // LAPORAN SPP PER BULAN
    // ════════════════════════════════════════════════════════════
    app.get('/api/keuangan/laporan/spp/bulanan', authenticateToken, roleGuard_1.requireLaporanKeuangan, async (req, res) => {
        try {
            const taId = (0, validators_1.validatePositiveInt)(req.query.tahun_ajaran_id, 'tahun_ajaran_id');
            const bulan = (0, validators_1.validateBulan)(req.query.bulan);
            const tahun = (0, validators_1.validateTahun)(req.query.tahun);
            // Ambil semua santri dengan tagihan SPP bulan ini
            const result = await db_1.pool.query(`SELECT
             s.id AS santri_id,
             COALESCE(sta.nama, s.nama) AS nama,
             COALESCE(sta.nis, s.nis) AS nis,
             -- SPP MAKAN
             MAX(CASE WHEN ji.kode='SPP_MAKAN' THEN t.id END)                                   AS tagihan_makan_id,
             COALESCE(MAX(CASE WHEN ji.kode='SPP_MAKAN' THEN t.nominal_tagihan END), 0)         AS nominal_tagihan_makan,
             COALESCE(SUM(CASE WHEN ji.kode='SPP_MAKAN' AND p.is_void=FALSE THEN p.nominal END), 0) AS nominal_dibayar_makan,
             MAX(CASE WHEN ji.kode='SPP_MAKAN' THEN t.status END)                               AS status_makan,
             -- SPP MADIN
             MAX(CASE WHEN ji.kode='SPP_MADIN' THEN t.id END)                                   AS tagihan_madin_id,
             COALESCE(MAX(CASE WHEN ji.kode='SPP_MADIN' THEN t.nominal_tagihan END), 0)         AS nominal_tagihan_madin,
             COALESCE(SUM(CASE WHEN ji.kode='SPP_MADIN' AND p.is_void=FALSE THEN p.nominal END), 0) AS nominal_dibayar_madin,
             MAX(CASE WHEN ji.kode='SPP_MADIN' THEN t.status END)                               AS status_madin
           FROM santri s
           JOIN santri_tahun_ajaran sta ON sta.santri_id=s.id AND sta.tahun_ajaran_id=$1
           LEFT JOIN tagihan t
             ON t.santri_id=s.id AND t.tahun_ajaran_id=$1
             AND t.periode_bulan=$2 AND t.periode_tahun=$3
           LEFT JOIN jenis_iuran ji ON ji.id=t.jenis_iuran_id AND ji.kode IN ('SPP_MAKAN','SPP_MADIN')
           LEFT JOIN pembayaran p ON p.tagihan_id=t.id
           WHERE sta.status IN ('aktif','draft','tidak_naik')
           GROUP BY s.id, sta.nama, sta.nis, s.nama, s.nis
           ORDER BY COALESCE(sta.nama, s.nama)`, [taId, bulan, tahun]);
            const rows = result.rows;
            const summary = {
                bulan, tahun,
                nama_bulan: keuangan_1.NAMA_BULAN[bulan],
                target_makan: rows.reduce((s, r) => s + Number(r.nominal_tagihan_makan), 0),
                terkumpul_makan: rows.reduce((s, r) => s + Number(r.nominal_dibayar_makan), 0),
                target_madin: rows.reduce((s, r) => s + Number(r.nominal_tagihan_madin), 0),
                terkumpul_madin: rows.reduce((s, r) => s + Number(r.nominal_dibayar_madin), 0),
                santri_bebas_makan: rows.filter((r) => r.status_makan === 'dibebaskan').length,
                santri_bebas_madin: rows.filter((r) => r.status_madin === 'dibebaskan').length,
                santri_lunas_makan: rows.filter((r) => r.status_makan === 'lunas').length,
                santri_lunas_madin: rows.filter((r) => r.status_madin === 'lunas').length,
                total_santri: rows.length,
            };
            const tmakan = summary.target_makan;
            const tmadin = summary.target_madin;
            Object.assign(summary, {
                total_target: tmakan + tmadin,
                total_terkumpul: summary.terkumpul_makan + summary.terkumpul_madin,
                total_tunggakan: (tmakan - summary.terkumpul_makan) + (tmadin - summary.terkumpul_madin),
                realisasi_makan_pct: tmakan > 0 ? Math.round((summary.terkumpul_makan / tmakan) * 100) : 0,
                realisasi_madin_pct: tmadin > 0 ? Math.round((summary.terkumpul_madin / tmadin) * 100) : 0,
                realisasi_pct: (tmakan + tmadin) > 0
                    ? Math.round(((summary.terkumpul_makan + summary.terkumpul_madin) / (tmakan + tmadin)) * 100) : 0,
            });
            return res.json({ summary, per_santri: rows });
        }
        catch (err) {
            if (err instanceof validators_1.ValidationError)
                return res.status(400).json({ error: err.message });
            console.error('laporan spp bulanan error:', err);
            return res.status(500).json({ error: 'Gagal menghasilkan laporan SPP bulanan.' });
        }
    });
    // ════════════════════════════════════════════════════════════
    // LAPORAN SPP PER SEMESTER
    // ════════════════════════════════════════════════════════════
    app.get('/api/keuangan/laporan/spp/semester', authenticateToken, roleGuard_1.requireLaporanKeuangan, async (req, res) => {
        try {
            const taId = (0, validators_1.validatePositiveInt)(req.query.tahun_ajaran_id, 'tahun_ajaran_id');
            const semester = req.query.semester; // 'ganjil' | 'genap'
            if (!['ganjil', 'genap'].includes(semester)) {
                return res.status(400).json({ error: 'Semester harus "ganjil" atau "genap".' });
            }
            // Ambil info tahun ajaran untuk menentukan tahun kalender
            const taResult = await db_1.pool.query(`SELECT id, kode, tahun_mulai FROM tahun_ajaran WHERE id=$1`, [taId]);
            if (!taResult.rows.length)
                return res.status(404).json({ error: 'Tahun ajaran tidak ditemukan.' });
            const ta = taResult.rows[0];
            const tahunMulai = Number(ta.tahun_mulai);
            // Ganjil: Jul-Des tahun mulai (bulan 7-12), Genap: Jan-Jun tahun berikutnya (bulan 1-6)
            const bulanList = semester === 'ganjil' ? [7, 8, 9, 10, 11, 12] : [1, 2, 3, 4, 5, 6];
            const tahunKal = semester === 'ganjil' ? tahunMulai : tahunMulai + 1;
            // Query per santri per bulan
            const result = await db_1.pool.query(`SELECT
             s.id AS santri_id,
             COALESCE(sta.nama, s.nama) AS nama,
             COALESCE(sta.nis, s.nis) AS nis,
             t.periode_bulan AS bulan,
             ji.kode AS kode_iuran,
             t.nominal_tagihan,
             t.status,
             COALESCE(SUM(p.nominal) FILTER (WHERE p.is_void=FALSE), 0) AS nominal_dibayar
           FROM santri s
           JOIN santri_tahun_ajaran sta ON sta.santri_id=s.id AND sta.tahun_ajaran_id=$1
           LEFT JOIN tagihan t ON t.santri_id=s.id AND t.tahun_ajaran_id=$1
             AND t.periode_bulan = ANY($2::int[])
             AND t.periode_tahun=$3
           LEFT JOIN jenis_iuran ji ON ji.id=t.jenis_iuran_id AND ji.kode IN ('SPP_MAKAN','SPP_MADIN')
           LEFT JOIN pembayaran p ON p.tagihan_id=t.id
           WHERE sta.status IN ('aktif','draft','tidak_naik')
           GROUP BY s.id, sta.nama, sta.nis, s.nama, s.nis, t.periode_bulan, ji.kode, t.nominal_tagihan, t.status
           ORDER BY COALESCE(sta.nama, s.nama), t.periode_bulan`, [taId, bulanList, tahunKal]);
            // Restrukturisasi: per santri
            const santriMap = {};
            for (const row of result.rows) {
                const key = row.santri_id;
                if (!santriMap[key]) {
                    santriMap[key] = {
                        santri_id: row.santri_id,
                        nama: row.nama,
                        nis: row.nis,
                        makan_per_bulan: {},
                        madin_per_bulan: {},
                        total_tagihan_makan: 0,
                        total_dibayar_makan: 0,
                        total_tagihan_madin: 0,
                        total_dibayar_madin: 0,
                    };
                }
                const santri = santriMap[key];
                if (row.kode_iuran === 'SPP_MAKAN') {
                    santri.makan_per_bulan[row.bulan] = {
                        tagihan: Number(row.nominal_tagihan), dibayar: Number(row.nominal_dibayar), status: row.status
                    };
                    santriMap[key].total_tagihan_makan += Number(row.nominal_tagihan);
                    santriMap[key].total_dibayar_makan += Number(row.nominal_dibayar);
                }
                else if (row.kode_iuran === 'SPP_MADIN') {
                    santri.madin_per_bulan[row.bulan] = {
                        tagihan: Number(row.nominal_tagihan), dibayar: Number(row.nominal_dibayar), status: row.status
                    };
                    santriMap[key].total_tagihan_madin += Number(row.nominal_tagihan);
                    santriMap[key].total_dibayar_madin += Number(row.nominal_dibayar);
                }
            }
            const perSantri = Object.values(santriMap).map(s => {
                const sm = s;
                return {
                    ...s,
                    total_tunggakan: (sm.total_tagihan_makan - sm.total_dibayar_makan) +
                        (sm.total_tagihan_madin - sm.total_dibayar_madin),
                };
            });
            const grandTargetMakan = perSantri.reduce((a, s) => a + s.total_tagihan_makan, 0);
            const grandTerkumpulMakan = perSantri.reduce((a, s) => a + s.total_dibayar_makan, 0);
            const grandTargetMadin = perSantri.reduce((a, s) => a + s.total_tagihan_madin, 0);
            const grandTerkumpulMadin = perSantri.reduce((a, s) => a + s.total_dibayar_madin, 0);
            const grandTarget = grandTargetMakan + grandTargetMadin;
            const grandTerkumpul = grandTerkumpulMakan + grandTerkumpulMadin;
            return res.json({
                semester,
                tahun_ajaran_id: taId,
                kode_tahun_ajaran: ta.kode,
                bulan_list: bulanList,
                tahun_kalender: tahunKal,
                nama_bulan_list: bulanList.map(b => keuangan_1.NAMA_BULAN[b]),
                per_santri: perSantri,
                grand_total: {
                    target_makan: grandTargetMakan,
                    terkumpul_makan: grandTerkumpulMakan,
                    target_madin: grandTargetMadin,
                    terkumpul_madin: grandTerkumpulMadin,
                    total_target: grandTarget,
                    total_terkumpul: grandTerkumpul,
                    total_tunggakan: grandTarget - grandTerkumpul,
                    realisasi_pct: grandTarget > 0 ? Math.round((grandTerkumpul / grandTarget) * 100) : 0,
                },
            });
        }
        catch (err) {
            if (err instanceof validators_1.ValidationError)
                return res.status(400).json({ error: err.message });
            console.error('laporan spp semester error:', err);
            return res.status(500).json({ error: 'Gagal menghasilkan laporan SPP semester.' });
        }
    });
    // ════════════════════════════════════════════════════════════
    // LAPORAN SPP PER TAHUN
    // ════════════════════════════════════════════════════════════
    app.get('/api/keuangan/laporan/spp/tahunan', authenticateToken, roleGuard_1.requireLaporanKeuangan, async (req, res) => {
        try {
            const taId = (0, validators_1.validatePositiveInt)(req.query.tahun_ajaran_id, 'tahun_ajaran_id');
            const result = await db_1.pool.query(`SELECT
             s.id AS santri_id,
             COALESCE(sta.nama, s.nama) AS nama,
             COALESCE(sta.nis, s.nis) AS nis,
             COALESCE(SUM(CASE WHEN ji.kode='SPP_MAKAN' THEN t.nominal_tagihan END), 0) AS target_makan,
             COALESCE(SUM(CASE WHEN ji.kode='SPP_MAKAN' AND p.is_void=FALSE THEN p.nominal END), 0) AS dibayar_makan,
             COALESCE(SUM(CASE WHEN ji.kode='SPP_MADIN' THEN t.nominal_tagihan END), 0) AS target_madin,
             COALESCE(SUM(CASE WHEN ji.kode='SPP_MADIN' AND p.is_void=FALSE THEN p.nominal END), 0) AS dibayar_madin,
             COUNT(DISTINCT CASE WHEN ji.kode='SPP_MAKAN' AND t.status='dibebaskan' THEN t.id END) AS bulan_bebas_makan,
             COUNT(DISTINCT CASE WHEN ji.kode='SPP_MADIN' AND t.status='dibebaskan' THEN t.id END) AS bulan_bebas_madin
           FROM santri s
           JOIN santri_tahun_ajaran sta ON sta.santri_id=s.id AND sta.tahun_ajaran_id=$1
           LEFT JOIN tagihan t ON t.santri_id=s.id AND t.tahun_ajaran_id=$1
           LEFT JOIN jenis_iuran ji ON ji.id=t.jenis_iuran_id AND ji.kode IN ('SPP_MAKAN','SPP_MADIN')
           LEFT JOIN pembayaran p ON p.tagihan_id=t.id
           WHERE sta.status IN ('aktif','draft','tidak_naik')
           GROUP BY s.id, sta.nama, sta.nis, s.nama, s.nis
           ORDER BY COALESCE(sta.nama, s.nama)`, [taId]);
            const perSantri = result.rows.map((r) => {
                const totalTarget = Number(r.target_makan) + Number(r.target_madin);
                const totalDibayar = Number(r.dibayar_makan) + Number(r.dibayar_madin);
                return {
                    ...r,
                    total_target: totalTarget,
                    total_dibayar: totalDibayar,
                    total_tunggakan: totalTarget - totalDibayar,
                    status_keseluruhan: totalDibayar >= totalTarget ? 'lunas_penuh' : 'masih_menunggak',
                };
            });
            const grandTargetMakan = perSantri.reduce((a, s) => a + Number(s.target_makan), 0);
            const grandDibayarMakan = perSantri.reduce((a, s) => a + Number(s.dibayar_makan), 0);
            const grandTargetMadin = perSantri.reduce((a, s) => a + Number(s.target_madin), 0);
            const grandDibayarMadin = perSantri.reduce((a, s) => a + Number(s.dibayar_madin), 0);
            const grandTarget = grandTargetMakan + grandTargetMadin;
            const grandTerkumpul = grandDibayarMakan + grandDibayarMadin;
            const taResult = await db_1.pool.query(`SELECT kode FROM tahun_ajaran WHERE id=$1`, [taId]);
            return res.json({
                tahun_ajaran_id: taId,
                kode_tahun_ajaran: taResult.rows[0]?.kode ?? '',
                per_santri: perSantri,
                summary: {
                    total_santri_aktif: perSantri.length,
                    santri_lunas_penuh: perSantri.filter((s) => s.status_keseluruhan === 'lunas_penuh').length,
                    santri_menunggak: perSantri.filter((s) => s.status_keseluruhan === 'masih_menunggak').length,
                    grand_target_makan: grandTargetMakan,
                    grand_terkumpul_makan: grandDibayarMakan,
                    grand_target_madin: grandTargetMadin,
                    grand_terkumpul_madin: grandDibayarMadin,
                    grand_target: grandTarget,
                    grand_terkumpul: grandTerkumpul,
                    grand_tunggakan: grandTarget - grandTerkumpul,
                    realisasi_pct: grandTarget > 0 ? Math.round((grandTerkumpul / grandTarget) * 100) : 0,
                },
            });
        }
        catch (err) {
            if (err instanceof validators_1.ValidationError)
                return res.status(400).json({ error: err.message });
            console.error('laporan spp tahunan error:', err);
            return res.status(500).json({ error: 'Gagal menghasilkan laporan SPP tahunan.' });
        }
    });
    // ════════════════════════════════════════════════════════════
    // LAPORAN DAFTAR ULANG
    // ════════════════════════════════════════════════════════════
    app.get('/api/keuangan/laporan/daftar-ulang', authenticateToken, roleGuard_1.requireLaporanKeuangan, async (req, res) => {
        try {
            const taId = (0, validators_1.validatePositiveInt)(req.query.tahun_ajaran_id, 'tahun_ajaran_id');
            const tipe = req.query.tipe; // 'baru' | 'lama'
            if (!['baru', 'lama'].includes(tipe)) {
                return res.status(400).json({ error: 'Tipe harus "baru" atau "lama".' });
            }
            const kategori = `daftar_ulang_${tipe}`;
            const result = await db_1.pool.query(`SELECT
             s.id AS santri_id,
             COALESCE(sta.nama, s.nama) AS nama,
             COALESCE(sta.nis, s.nis) AS nis,
             ji.id AS jenis_iuran_id,
             ji.kode, ji.nama AS nama_iuran, ji.urutan,
             t.id AS tagihan_id,
             t.nominal_tagihan,
             t.status,
             COALESCE(SUM(p.nominal) FILTER (WHERE p.is_void=FALSE), 0) AS nominal_dibayar
           FROM jenis_iuran ji
           LEFT JOIN tagihan t ON t.jenis_iuran_id=ji.id AND t.tahun_ajaran_id=$1
           LEFT JOIN santri s ON s.id=t.santri_id
           LEFT JOIN santri_tahun_ajaran sta
             ON sta.santri_id=s.id AND sta.tahun_ajaran_id=$1
           LEFT JOIN pembayaran p ON p.tagihan_id=t.id
           WHERE ji.kategori=$2 AND ji.is_active=TRUE
           GROUP BY s.id, sta.nama, sta.nis, s.nama, s.nis, ji.id, t.id
           ORDER BY ji.urutan, COALESCE(sta.nama, s.nama)`, [taId, kategori]);
            // Restrukturisasi: summary per item + detail per santri
            const itemMap = {};
            const santriMap = {};
            for (const row of result.rows) {
                // Summary per item
                if (!itemMap[row.kode]) {
                    itemMap[row.kode] = {
                        jenis_iuran_id: row.jenis_iuran_id,
                        kode: row.kode,
                        nama: row.nama_iuran,
                        urutan: row.urutan,
                        jumlah_santri: 0,
                        jumlah_lunas: 0,
                        jumlah_sebagian: 0,
                        jumlah_belum: 0,
                        terkumpul: 0,
                        target: 0,
                    };
                }
                const item = itemMap[row.kode];
                if (row.tagihan_id) {
                    item.jumlah_santri++;
                    item.target += Number(row.nominal_tagihan);
                    item.terkumpul += Number(row.nominal_dibayar);
                    if (row.status === 'lunas')
                        item.jumlah_lunas++;
                    else if (row.status === 'sebagian')
                        item.jumlah_sebagian++;
                    else
                        item.jumlah_belum++;
                }
                // Detail per santri
                if (row.santri_id) {
                    if (!santriMap[row.santri_id]) {
                        santriMap[row.santri_id] = {
                            santri_id: row.santri_id, nama: row.nama, nis: row.nis,
                            status_per_item: {}, total_tagihan: 0, total_dibayar: 0,
                        };
                    }
                    const s = santriMap[row.santri_id];
                    s.status_per_item[row.kode] = {
                        status: row.status,
                        tagihan: Number(row.nominal_tagihan),
                        dibayar: Number(row.nominal_dibayar),
                    };
                    santriMap[row.santri_id].total_tagihan += Number(row.nominal_tagihan);
                    santriMap[row.santri_id].total_dibayar += Number(row.nominal_dibayar);
                }
            }
            const summaryPerItem = Object.values(itemMap)
                .sort((a, b) => Number(a.urutan) - Number(b.urutan))
                .map(item => {
                const i = item;
                return {
                    ...item,
                    realisasi_pct: i.target > 0 ? Math.round((i.terkumpul / i.target) * 100) : 0,
                };
            });
            const perSantri = Object.values(santriMap).map(s => {
                const sm = s;
                return { ...s, total_sisa: sm.total_tagihan - sm.total_dibayar };
            });
            const grandTarget = summaryPerItem.reduce((a, i) => a + Number(i.target), 0);
            const grandTerkumpul = summaryPerItem.reduce((a, i) => a + Number(i.terkumpul), 0);
            return res.json({
                tipe,
                tahun_ajaran_id: taId,
                summary_per_item: summaryPerItem,
                per_santri: perSantri,
                grand_target: grandTarget,
                grand_terkumpul: grandTerkumpul,
                grand_tunggakan: grandTarget - grandTerkumpul,
                realisasi_pct: grandTarget > 0 ? Math.round((grandTerkumpul / grandTarget) * 100) : 0,
            });
        }
        catch (err) {
            if (err instanceof validators_1.ValidationError)
                return res.status(400).json({ error: err.message });
            console.error('laporan daftar ulang error:', err);
            return res.status(500).json({ error: 'Gagal menghasilkan laporan daftar ulang.' });
        }
    });
    // ════════════════════════════════════════════════════════════
    // LAPORAN EVENT
    // ════════════════════════════════════════════════════════════
    app.get('/api/keuangan/laporan/event', authenticateToken, roleGuard_1.requireLaporanKeuangan, async (req, res) => {
        try {
            const taId = (0, validators_1.validatePositiveInt)(req.query.tahun_ajaran_id, 'tahun_ajaran_id');
            const result = await db_1.pool.query(`SELECT
             ji.id AS jenis_iuran_id, ji.kode, ji.nama AS nama_event, ji.urutan,
             s.id AS santri_id,
             COALESCE(sta.nama, s.nama) AS nama_santri,
             COALESCE(sta.nis, s.nis) AS nis,
             t.id AS tagihan_id,
             t.nominal_tagihan,
             t.status,
             COALESCE(SUM(p.nominal) FILTER (WHERE p.is_void=FALSE), 0) AS nominal_dibayar
           FROM jenis_iuran ji
           LEFT JOIN tagihan t ON t.jenis_iuran_id=ji.id AND t.tahun_ajaran_id=$1
           LEFT JOIN santri s ON s.id=t.santri_id
           LEFT JOIN santri_tahun_ajaran sta ON sta.santri_id=s.id AND sta.tahun_ajaran_id=$1
           LEFT JOIN pembayaran p ON p.tagihan_id=t.id
           WHERE ji.kategori='event' AND ji.is_active=TRUE
           GROUP BY ji.id, s.id, sta.nama, sta.nis, s.nama, s.nis, t.id
           ORDER BY ji.urutan, COALESCE(sta.nama, s.nama)`, [taId]);
            // Grup per event
            const eventMap = {};
            for (const row of result.rows) {
                if (!eventMap[row.kode]) {
                    eventMap[row.kode] = {
                        jenis_iuran_id: row.jenis_iuran_id,
                        kode: row.kode,
                        nama: row.nama_event,
                        jumlah_santri: 0, jumlah_lunas: 0, jumlah_sebagian: 0, jumlah_belum: 0,
                        terkumpul: 0, target: 0,
                        detail_santri: [],
                    };
                }
                const ev = eventMap[row.kode];
                if (row.tagihan_id) {
                    ev.jumlah_santri;
                    ev.jumlah_santri++;
                    ev.target += Number(row.nominal_tagihan);
                    ev.terkumpul += Number(row.nominal_dibayar);
                    if (row.status === 'lunas')
                        ev.jumlah_lunas++;
                    else if (row.status === 'sebagian')
                        ev.jumlah_sebagian++;
                    else
                        ev.jumlah_belum++;
                    ev.detail_santri.push({
                        santri_id: row.santri_id,
                        nama: row.nama_santri,
                        nis: row.nis,
                        status: row.status,
                        tagihan: Number(row.nominal_tagihan),
                        dibayar: Number(row.nominal_dibayar),
                        sisa: Number(row.nominal_tagihan) - Number(row.nominal_dibayar),
                    });
                }
            }
            const perEvent = Object.values(eventMap).map(ev => {
                const e = ev;
                return {
                    ...ev,
                    realisasi_pct: e.target > 0 ? Math.round((e.terkumpul / e.target) * 100) : 0,
                };
            });
            const grandTarget = perEvent.reduce((a, e) => a + Number(e.target), 0);
            const grandTerkumpul = perEvent.reduce((a, e) => a + Number(e.terkumpul), 0);
            return res.json({
                tahun_ajaran_id: taId,
                per_event: perEvent,
                grand_target: grandTarget,
                grand_terkumpul: grandTerkumpul,
                grand_tunggakan: grandTarget - grandTerkumpul,
                realisasi_pct: grandTarget > 0 ? Math.round((grandTerkumpul / grandTarget) * 100) : 0,
            });
        }
        catch (err) {
            if (err instanceof validators_1.ValidationError)
                return res.status(400).json({ error: err.message });
            console.error('laporan event error:', err);
            return res.status(500).json({ error: 'Gagal menghasilkan laporan event.' });
        }
    });
    // ════════════════════════════════════════════════════════════
    // DASHBOARD SUMMARY
    // ════════════════════════════════════════════════════════════
    app.get('/api/keuangan/dashboard', authenticateToken, roleGuard_1.requireLaporanKeuangan, async (req, res) => {
        try {
            const taId = (0, validators_1.validatePositiveInt)(req.query.tahun_ajaran_id, 'tahun_ajaran_id');
            const now = new Date();
            const bulanIni = now.getMonth() + 1;
            const tahunIni = now.getFullYear();
            const bulanLalu = bulanIni === 1 ? 12 : bulanIni - 1;
            const tahunLalu = bulanIni === 1 ? tahunIni - 1 : tahunIni;
            // Pemasukan bulan ini
            const masuks = await db_1.pool.query(`SELECT
             ji.kategori,
             COALESCE(SUM(p.nominal) FILTER (
               WHERE DATE_TRUNC('month', p.tanggal_bayar) = DATE_TRUNC('month', CURRENT_DATE)
                 AND p.is_void=FALSE AND p.tahun_ajaran_id=$1
             ), 0) AS bulan_ini,
             COALESCE(SUM(p.nominal) FILTER (
               WHERE EXTRACT(MONTH FROM p.tanggal_bayar)=$2
                 AND EXTRACT(YEAR FROM p.tanggal_bayar)=$3
                 AND p.is_void=FALSE AND p.tahun_ajaran_id=$1
             ), 0) AS bulan_lalu
           FROM pembayaran p
           JOIN jenis_iuran ji ON ji.id=p.jenis_iuran_id
           WHERE p.tahun_ajaran_id=$1
           GROUP BY ji.kategori`, [taId, bulanLalu, tahunLalu]);
            // Pengeluaran bulan ini
            const keluars = await db_1.pool.query(`SELECT
             jenis_kas,
             COALESCE(SUM(nominal) FILTER (
               WHERE DATE_TRUNC('month', tanggal) = DATE_TRUNC('month', CURRENT_DATE)
                 AND is_void=FALSE AND tahun_ajaran_id=$1
             ), 0) AS bulan_ini,
             COALESCE(SUM(nominal) FILTER (
               WHERE EXTRACT(MONTH FROM tanggal)=$2
                 AND EXTRACT(YEAR FROM tanggal)=$3
                 AND is_void=FALSE AND tahun_ajaran_id=$1
             ), 0) AS bulan_lalu
           FROM kas_keluar
           WHERE tahun_ajaran_id=$1
           GROUP BY jenis_kas`, [taId, bulanLalu, tahunLalu]);
            // Tunggakan SPP
            const tunggakan = await db_1.pool.query(`SELECT
             s.id, COALESCE(sta.nama, s.nama) AS nama, COALESCE(sta.nis, s.nis) AS nis,
             SUM(t.nominal_tagihan - t.nominal_diskon - COALESCE(p.total_dibayar, 0)) AS total_tunggakan,
             COUNT(DISTINCT t.id) AS bulan_menunggak
           FROM santri s
           JOIN santri_tahun_ajaran sta ON sta.santri_id=s.id AND sta.tahun_ajaran_id=$1
           JOIN tagihan t ON t.santri_id=s.id AND t.tahun_ajaran_id=$1 AND t.status IN ('belum_lunas','sebagian')
           JOIN jenis_iuran ji ON ji.id=t.jenis_iuran_id AND ji.kode IN ('SPP_MAKAN','SPP_MADIN')
           LEFT JOIN (
             SELECT tagihan_id, SUM(nominal) AS total_dibayar
             FROM pembayaran
             WHERE is_void = FALSE
             GROUP BY tagihan_id
           ) p ON p.tagihan_id=t.id
           WHERE sta.status IN ('aktif','draft')
           GROUP BY s.id, sta.nama, sta.nis, s.nama, s.nis
           HAVING SUM(t.nominal_tagihan - t.nominal_diskon - COALESCE(p.total_dibayar, 0)) > 0
           ORDER BY total_tunggakan DESC
           LIMIT 10`, [taId]);
            // Kalkulasi totals
            let totalMasukIni = 0, totalMasukLalu = 0;
            const breakdownMasuk = { spp_makan: 0, spp_madin: 0, daftar_ulang: 0, event: 0 };
            for (const r of masuks.rows) {
                totalMasukIni += Number(r.bulan_ini);
                totalMasukLalu += Number(r.bulan_lalu);
                if (r.kategori === 'spp_bulanan') {
                    breakdownMasuk.spp_makan += Number(r.bulan_ini) / 2;
                    breakdownMasuk.spp_madin += Number(r.bulan_ini) / 2;
                }
                else if (r.kategori.startsWith('daftar_ulang'))
                    breakdownMasuk.daftar_ulang += Number(r.bulan_ini);
                else if (r.kategori === 'event')
                    breakdownMasuk.event += Number(r.bulan_ini);
            }
            let totalKeluarIni = 0, totalKeluarLalu = 0;
            const breakdownKeluar = { kas_pondok: 0, kas_madin: 0, kas_smt_ganjil: 0, kas_smt_genap: 0 };
            for (const r of keluars.rows) {
                totalKeluarIni += Number(r.bulan_ini);
                totalKeluarLalu += Number(r.bulan_lalu);
                if (r.jenis_kas in breakdownKeluar)
                    breakdownKeluar[r.jenis_kas] += Number(r.bulan_ini);
            }
            const totalTunggakan = tunggakan.rows.reduce((a, r) => a + Number(r.total_tunggakan), 0);
            return res.json({
                bulan: bulanIni,
                tahun: tahunIni,
                nama_bulan: keuangan_1.NAMA_BULAN[bulanIni],
                total_masuk_bulan_ini: totalMasukIni,
                total_masuk_bulan_lalu: totalMasukLalu,
                pct_change_masuk: totalMasukLalu > 0
                    ? Math.round(((totalMasukIni - totalMasukLalu) / totalMasukLalu) * 100) : 0,
                total_keluar_bulan_ini: totalKeluarIni,
                total_keluar_bulan_lalu: totalKeluarLalu,
                pct_change_keluar: totalKeluarLalu > 0
                    ? Math.round(((totalKeluarIni - totalKeluarLalu) / totalKeluarLalu) * 100) : 0,
                saldo_bersih: totalMasukIni - totalKeluarIni,
                total_tunggakan_aktif: totalTunggakan,
                jumlah_santri_menunggak: tunggakan.rows.length,
                breakdown_masuk: breakdownMasuk,
                breakdown_keluar: breakdownKeluar,
                top_tunggakan: tunggakan.rows,
            });
        }
        catch (err) {
            if (err instanceof validators_1.ValidationError)
                return res.status(400).json({ error: err.message });
            console.error('dashboard keuangan error:', err);
            return res.status(500).json({ error: 'Gagal memuat data dashboard.' });
        }
    });
    // ════════════════════════════════════════════════════════════
    // LAPORAN TUNGGAKAN AKTIF
    // ════════════════════════════════════════════════════════════
    app.get('/api/keuangan/laporan/tunggakan', authenticateToken, roleGuard_1.requireLaporanKeuangan, async (req, res) => {
        try {
            const taId = (0, validators_1.validatePositiveInt)(req.query.tahun_ajaran_id, 'tahun_ajaran_id');
            const result = await db_1.pool.query(`SELECT
             s.id AS santri_id,
             COALESCE(sta.nama, s.nama) AS nama,
             COALESCE(sta.nis, s.nis) AS nis,
             sta.kelas_diniyah,
             COUNT(DISTINCT t.id) AS jumlah_tagihan_belum,
             SUM(t.nominal_tagihan - t.nominal_diskon - COALESCE(p.total_dibayar, 0)) AS total_tunggakan,
             MIN(t.tanggal_jatuh_tempo) AS jatuh_tempo_tertua,
             ARRAY_AGG(DISTINCT t.periode_bulan) AS bulan_menunggak
           FROM santri s
           JOIN santri_tahun_ajaran sta ON sta.santri_id=s.id AND sta.tahun_ajaran_id=$1
           JOIN tagihan t ON t.santri_id=s.id AND t.tahun_ajaran_id=$1 AND t.status IN ('belum_lunas','sebagian')
           JOIN jenis_iuran ji ON ji.id=t.jenis_iuran_id AND ji.kode IN ('SPP_MAKAN','SPP_MADIN')
           LEFT JOIN (
             SELECT tagihan_id, SUM(nominal) AS total_dibayar
             FROM pembayaran
             WHERE is_void = FALSE
             GROUP BY tagihan_id
           ) p ON p.tagihan_id=t.id
           GROUP BY s.id, sta.nama, sta.nis, s.nama, s.nis, sta.kelas_diniyah
           HAVING SUM(t.nominal_tagihan - t.nominal_diskon - COALESCE(p.total_dibayar, 0)) > 0
           ORDER BY total_tunggakan DESC`, [taId]);
            const total = result.rows.reduce((a, r) => a + Number(r.total_tunggakan), 0);
            return res.json({
                data: result.rows,
                grand_total_tunggakan: total,
                jumlah_santri: result.rows.length,
            });
        }
        catch (err) {
            if (err instanceof validators_1.ValidationError)
                return res.status(400).json({ error: err.message });
            return res.status(500).json({ error: 'Gagal memuat laporan tunggakan.' });
        }
    });
}
//# sourceMappingURL=laporanRoutes.js.map