"use strict";
/**
 * pembayaranRoutes.ts — Catat, void, dan cetak kwitansi pembayaran
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPembayaranRoutes = registerPembayaranRoutes;
const db_1 = require("../db");
const tagihanService_1 = require("../services/tagihanService");
const noKwitansi_1 = require("../utils/noKwitansi");
const validators_1 = require("../utils/validators");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { authenticateToken } = require('../../../src/middleware/authMiddleware');
const roleGuard_1 = require("../middleware/roleGuard");
function registerPembayaranRoutes(app) {
    // GET /api/keuangan/pembayaran — Riwayat pembayaran
    app.get('/api/keuangan/pembayaran', authenticateToken, roleGuard_1.requireLaporanKeuangan, async (req, res) => {
        try {
            const { tahun_ajaran_id, santri_id, jenis_iuran_id, tanggal_dari, tanggal_sampai, is_void, page = 1, limit = 50, } = req.query;
            const conditions = [];
            const params = [];
            let idx = 1;
            if (tahun_ajaran_id) {
                conditions.push(`p.tahun_ajaran_id=$${idx++}`);
                params.push((0, validators_1.validatePositiveInt)(tahun_ajaran_id, 'tahun_ajaran_id'));
            }
            if (santri_id) {
                conditions.push(`p.santri_id=$${idx++}`);
                params.push((0, validators_1.validatePositiveInt)(santri_id, 'santri_id'));
            }
            if (jenis_iuran_id) {
                conditions.push(`p.jenis_iuran_id=$${idx++}`);
                params.push((0, validators_1.validatePositiveInt)(jenis_iuran_id, 'jenis_iuran_id'));
            }
            if (tanggal_dari) {
                conditions.push(`p.tanggal_bayar >= $${idx++}`);
                params.push(tanggal_dari);
            }
            if (tanggal_sampai) {
                conditions.push(`p.tanggal_bayar <= $${idx++}`);
                params.push(tanggal_sampai);
            }
            // Default: tampilkan valid (non-void) kecuali diminta semua
            if (is_void === 'true') {
                conditions.push(`p.is_void = TRUE`);
            }
            else if (is_void !== 'semua') {
                conditions.push(`p.is_void = FALSE`);
            }
            const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
            const offset = (Number(page) - 1) * Number(limit);
            const countResult = await db_1.pool.query(`SELECT COUNT(*) AS total FROM pembayaran p ${where}`, params);
            const total = Number(countResult.rows[0].total);
            const result = await db_1.pool.query(`SELECT p.*,
                  COALESCE(sta.nama, s.nama) AS nama_santri,
                  COALESCE(sta.nis, s.nis) AS nis,
                  ji.nama AS nama_iuran, ji.kode AS kode_iuran,
                  u.full_name AS nama_bendahara,
                  uv.full_name AS nama_void_oleh
           FROM pembayaran p
           JOIN santri s ON s.id = p.santri_id
           LEFT JOIN santri_tahun_ajaran sta
             ON sta.santri_id=s.id AND sta.tahun_ajaran_id=p.tahun_ajaran_id
           JOIN jenis_iuran ji ON ji.id = p.jenis_iuran_id
           LEFT JOIN users u ON u.id = p.dicatat_oleh
           LEFT JOIN users uv ON uv.id = p.void_oleh
           ${where}
           ORDER BY p.tanggal_bayar DESC, p.created_at DESC
           LIMIT $${idx} OFFSET $${idx + 1}`, [...params, Number(limit), offset]);
            return res.json({
                data: result.rows,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    total_pages: Math.ceil(total / Number(limit)),
                },
            });
        }
        catch (err) {
            if (err instanceof validators_1.ValidationError)
                return res.status(400).json({ error: err.message });
            console.error('GET /api/keuangan/pembayaran error:', err);
            return res.status(500).json({ error: 'Gagal memuat riwayat pembayaran.' });
        }
    });
    // POST /api/keuangan/pembayaran — Catat pembayaran baru
    app.post('/api/keuangan/pembayaran', authenticateToken, roleGuard_1.requireKeuangan, async (req, res) => {
        try {
            const isAdmin = req.user.role === 'admin';
            const pembayaran = await (0, tagihanService_1.catatPembayaran)(req.body, req.user.id, isAdmin, req.ip);
            return res.status(201).json({
                message: `Pembayaran ${pembayaran.no_kwitansi} berhasil dicatat.`,
                pembayaran,
            });
        }
        catch (err) {
            if (err instanceof validators_1.ValidationError)
                return res.status(400).json({ error: err.message });
            console.error('POST /api/keuangan/pembayaran error:', err);
            return res.status(500).json({ error: 'Gagal mencatat pembayaran.' });
        }
    });
    // PATCH /api/keuangan/pembayaran/:id/void — Batalkan pembayaran
    app.patch('/api/keuangan/pembayaran/:id/void', authenticateToken, roleGuard_1.requireKeuangan, async (req, res) => {
        try {
            const id = (0, validators_1.validatePositiveInt)(req.params.id, 'id');
            const { void_reason } = req.body;
            await (0, tagihanService_1.voidPembayaran)(id, void_reason, req.user.id, req.user.role, req.ip);
            return res.json({ message: 'Pembayaran berhasil dibatalkan.' });
        }
        catch (err) {
            if (err instanceof validators_1.ValidationError)
                return res.status(400).json({ error: err.message });
            console.error('PATCH /pembayaran/void error:', err);
            return res.status(500).json({ error: 'Gagal membatalkan pembayaran.' });
        }
    });
    // GET /api/keuangan/pembayaran/:id/kwitansi — Data kwitansi lengkap untuk cetak
    app.get('/api/keuangan/pembayaran/:id/kwitansi', authenticateToken, roleGuard_1.requireLaporanKeuangan, async (req, res) => {
        try {
            const id = (0, validators_1.validatePositiveInt)(req.params.id, 'id');
            const result = await db_1.pool.query(`SELECT
             p.*,
             COALESCE(sta.nama, s.nama) AS nama_santri,
             COALESCE(sta.nis, s.nis) AS nis,
             kd.nama AS kelas_diniyah,
             ji.nama AS nama_iuran, ji.kode AS kode_iuran, ji.kategori,
             u.full_name AS nama_bendahara,
             ta.kode AS kode_tahun_ajaran,
             -- Lembaga info (ambil dari config atau hardcode)
             'Pondok Pesantren Al-Hamid' AS nama_lembaga
           FROM pembayaran p
           JOIN santri s ON s.id = p.santri_id
           LEFT JOIN santri_tahun_ajaran sta
             ON sta.santri_id=s.id AND sta.tahun_ajaran_id=p.tahun_ajaran_id
           LEFT JOIN kelas kd ON kd.id = sta.kelas_diniyah_id
           JOIN jenis_iuran ji ON ji.id = p.jenis_iuran_id
           LEFT JOIN users u ON u.id = p.dicatat_oleh
           JOIN tahun_ajaran ta ON ta.id = p.tahun_ajaran_id
           WHERE p.id=$1`, [id]);
            if (!result.rows.length) {
                return res.status(404).json({ error: 'Pembayaran tidak ditemukan.' });
            }
            const row = result.rows[0];
            // Tambahkan terbilang ke response
            const kwitansiData = {
                ...row,
                nominal_terbilang: (0, noKwitansi_1.terbilang)(Number(row.nominal)),
                is_valid: !row.is_void,
            };
            return res.json(kwitansiData);
        }
        catch (err) {
            if (err instanceof validators_1.ValidationError)
                return res.status(400).json({ error: err.message });
            return res.status(500).json({ error: 'Gagal memuat data kwitansi.' });
        }
    });
}
//# sourceMappingURL=pembayaranRoutes.js.map