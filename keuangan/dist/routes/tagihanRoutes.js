"use strict";
/**
 * tagihanRoutes.ts — CRUD tagihan + generate massal SPP
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerTagihanRoutes = registerTagihanRoutes;
const db_1 = require("../db");
const tagihanService_1 = require("../services/tagihanService");
const auditLogger_1 = require("../utils/auditLogger");
const validators_1 = require("../utils/validators");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { authenticateToken } = require('../../../src/middleware/authMiddleware');
const roleGuard_1 = require("../middleware/roleGuard");
function registerTagihanRoutes(app) {
    // GET /api/keuangan/tagihan — Daftar tagihan dengan filter
    app.get('/api/keuangan/tagihan', authenticateToken, roleGuard_1.requireLaporanKeuangan, async (req, res) => {
        try {
            const { tahun_ajaran_id, santri_id, status, jenis_iuran_id, bulan, tahun, kategori, kelas_diniyah_id, kelas_sekolah_id, kode_iuran, page = 1, limit = 50, } = req.query;
            const conditions = [];
            const params = [];
            let idx = 1;
            if (tahun_ajaran_id) {
                conditions.push(`t.tahun_ajaran_id = $${idx++}`);
                params.push((0, validators_1.validatePositiveInt)(tahun_ajaran_id, 'tahun_ajaran_id'));
            }
            if (santri_id) {
                conditions.push(`t.santri_id = $${idx++}`);
                params.push((0, validators_1.validatePositiveInt)(santri_id, 'santri_id'));
            }
            if (status && status !== 'semua') {
                conditions.push(`t.status = $${idx++}`);
                params.push(status);
            }
            if (jenis_iuran_id) {
                conditions.push(`t.jenis_iuran_id = $${idx++}`);
                params.push((0, validators_1.validatePositiveInt)(jenis_iuran_id, 'jenis_iuran_id'));
            }
            if (bulan) {
                conditions.push(`t.periode_bulan = $${idx++}`);
                params.push((0, validators_1.validateBulan)(bulan));
            }
            if (tahun) {
                conditions.push(`t.periode_tahun = $${idx++}`);
                params.push((0, validators_1.validateTahun)(tahun));
            }
            if (kategori) {
                const kats = String(kategori).split(',');
                if (kats.length === 1) {
                    conditions.push(`ji.kategori = $${idx++}`);
                    params.push(kats[0]);
                }
                else {
                    const placeholders = kats.map(() => `$${idx++}`).join(', ');
                    conditions.push(`ji.kategori IN (${placeholders})`);
                    params.push(...kats);
                }
            }
            if (kelas_diniyah_id) {
                conditions.push(`sta.kelas_diniyah_id = $${idx++}`);
                params.push((0, validators_1.validatePositiveInt)(kelas_diniyah_id, 'kelas_diniyah_id'));
            }
            if (kelas_sekolah_id) {
                conditions.push(`sta.kelas_sekolah_id = $${idx++}`);
                params.push((0, validators_1.validatePositiveInt)(kelas_sekolah_id, 'kelas_sekolah_id'));
            }
            if (kode_iuran) {
                conditions.push(`ji.kode = $${idx++}`);
                params.push(kode_iuran);
            }
            const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
            const offset = (Number(page) - 1) * Number(limit);
            const countResult = await db_1.pool.query(`SELECT COUNT(*) AS total
           FROM tagihan t
           JOIN jenis_iuran ji ON ji.id = t.jenis_iuran_id
           JOIN santri s ON s.id = t.santri_id
           LEFT JOIN santri_tahun_ajaran sta
             ON sta.santri_id = s.id AND sta.tahun_ajaran_id = t.tahun_ajaran_id
           ${where}`, params);
            const total = Number(countResult.rows[0].total);
            const result = await db_1.pool.query(`SELECT t.*,
                  COALESCE(sta.nama, s.nama) AS nama_santri,
                  COALESCE(sta.nis, s.nis) AS nis,
                  ji.kode AS kode_iuran,
                  ji.nama AS nama_iuran,
                  ji.kategori,
                  MAX(p.id) FILTER (WHERE p.is_void = FALSE) AS pembayaran_id,
                  COALESCE(SUM(p.nominal) FILTER (WHERE p.is_void = FALSE), 0) AS total_dibayar,
                  (t.nominal_tagihan - t.nominal_diskon -
                    COALESCE(SUM(p.nominal) FILTER (WHERE p.is_void = FALSE), 0)) AS sisa_tagihan
           FROM tagihan t
           JOIN santri s ON s.id = t.santri_id
           LEFT JOIN santri_tahun_ajaran sta
             ON sta.santri_id = s.id AND sta.tahun_ajaran_id = t.tahun_ajaran_id
           JOIN jenis_iuran ji ON ji.id = t.jenis_iuran_id
           LEFT JOIN pembayaran p ON p.tagihan_id = t.id
           ${where}
           GROUP BY t.id, s.id, sta.nama, sta.nis, ji.id
           ORDER BY COALESCE(sta.nama, s.nama), t.periode_tahun, t.periode_bulan
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
            console.error('GET /api/keuangan/tagihan error:', err);
            return res.status(500).json({ error: 'Gagal memuat tagihan.' });
        }
    });
    // POST /api/keuangan/tagihan/generate-spp — Generate SPP massal 1 klik
    app.post('/api/keuangan/tagihan/generate-spp', authenticateToken, roleGuard_1.requireKeuangan, async (req, res) => {
        try {
            const { tahun_ajaran_id, bulan, tahun } = req.body;
            const params = {
                tahun_ajaran_id: (0, validators_1.validatePositiveInt)(tahun_ajaran_id, 'tahun_ajaran_id'),
                bulan: (0, validators_1.validateBulan)(bulan),
                tahun: (0, validators_1.validateTahun)(tahun),
            };
            const isAdmin = req.user.role === 'admin';
            const hasil = await (0, tagihanService_1.generateTagihanSPPBulanan)(params, req.user.id, req.ip);
            return res.status(201).json({
                message: `Generate SPP berhasil: ${hasil.berhasil} tagihan baru, ${hasil.dibebaskan} dibebaskan, ${hasil.sudah_ada} sudah ada.`,
                hasil,
                isAdmin,
            });
        }
        catch (err) {
            if (err instanceof validators_1.ValidationError)
                return res.status(400).json({ error: err.message });
            console.error('POST generate-spp error:', err);
            return res.status(500).json({ error: 'Gagal generate tagihan SPP.' });
        }
    });
    // POST /api/keuangan/tagihan/generate-du — Generate Daftar Ulang massal
    app.post('/api/keuangan/tagihan/generate-du', authenticateToken, roleGuard_1.requireKeuangan, async (req, res) => {
        try {
            const { tahun_ajaran_id } = req.body;
            const params = {
                tahun_ajaran_id: (0, validators_1.validatePositiveInt)(tahun_ajaran_id, 'tahun_ajaran_id'),
            };
            const hasil = await (0, tagihanService_1.generateTagihanDaftarUlang)(params, req.user.id, req.ip);
            return res.status(201).json({
                message: `Generate Daftar Ulang berhasil: ${hasil.berhasil} tagihan baru, ${hasil.dibebaskan} dibebaskan, ${hasil.sudah_ada} sudah ada.`,
                hasil,
            });
        }
        catch (err) {
            if (err instanceof validators_1.ValidationError)
                return res.status(400).json({ error: err.message });
            console.error('POST generate-du error:', err);
            return res.status(500).json({ error: 'Gagal generate tagihan Daftar Ulang.' });
        }
    });
    // POST /api/keuangan/tagihan/generate-event — Generate Event massal
    app.post('/api/keuangan/tagihan/generate-event', authenticateToken, roleGuard_1.requireKeuangan, async (req, res) => {
        try {
            const { tahun_ajaran_id, jenis_iuran_id } = req.body;
            const params = {
                tahun_ajaran_id: (0, validators_1.validatePositiveInt)(tahun_ajaran_id, 'tahun_ajaran_id'),
                jenis_iuran_id: (0, validators_1.validatePositiveInt)(jenis_iuran_id, 'jenis_iuran_id'),
            };
            const hasil = await (0, tagihanService_1.generateTagihanEvent)(params, req.user.id, req.ip);
            return res.status(201).json({
                message: `Generate Event berhasil: ${hasil.berhasil} tagihan baru, ${hasil.dibebaskan} dibebaskan, ${hasil.sudah_ada} sudah ada.`,
                hasil,
            });
        }
        catch (err) {
            if (err instanceof validators_1.ValidationError)
                return res.status(400).json({ error: err.message });
            console.error('POST generate-event error:', err);
            return res.status(500).json({ error: 'Gagal generate tagihan Event.' });
        }
    });
    // POST /api/keuangan/tagihan — Tambah tagihan manual (event, daftar ulang)
    app.post('/api/keuangan/tagihan', authenticateToken, roleGuard_1.requireKeuangan, async (req, res) => {
        try {
            const { santri_id, jenis_iuran_id, tahun_ajaran_id, nominal_tagihan, nominal_diskon = 0, periode_bulan, periode_tahun, catatan, } = req.body;
            const santriId = (0, validators_1.validatePositiveInt)(santri_id, 'santri_id');
            const jenisId = (0, validators_1.validatePositiveInt)(jenis_iuran_id, 'jenis_iuran_id');
            const taId = (0, validators_1.validatePositiveInt)(tahun_ajaran_id, 'tahun_ajaran_id');
            const client = await db_1.pool.connect();
            try {
                await client.query('BEGIN');
                const result = await client.query(`INSERT INTO tagihan
               (santri_id, jenis_iuran_id, tahun_ajaran_id, nominal_tagihan, nominal_diskon,
                periode_bulan, periode_tahun, catatan)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
             RETURNING *`, [
                    santriId, jenisId, taId, nominal_tagihan, nominal_diskon,
                    periode_bulan ?? null, periode_tahun ?? null, catatan ?? null,
                ]);
                await (0, auditLogger_1.logAudit)({
                    client, userId: req.user.id, action: 'CREATE_TAGIHAN_MANUAL',
                    entityType: 'tagihan', entityId: result.rows[0].id,
                    nilaiBaru: result.rows[0],
                    ipAddress: req.ip,
                });
                await client.query('COMMIT');
                return res.status(201).json(result.rows[0]);
            }
            catch (e) {
                await client.query('ROLLBACK');
                throw e;
            }
            finally {
                client.release();
            }
        }
        catch (err) {
            if (err instanceof validators_1.ValidationError)
                return res.status(400).json({ error: err.message });
            console.error('POST /api/keuangan/tagihan error:', err);
            return res.status(500).json({ error: 'Gagal membuat tagihan.' });
        }
    });
    // PUT /api/keuangan/tagihan/:id — Update tagihan (diskon, catatan)
    app.put('/api/keuangan/tagihan/:id', authenticateToken, roleGuard_1.requireKeuangan, async (req, res) => {
        try {
            const id = (0, validators_1.validatePositiveInt)(req.params.id, 'id');
            const { nominal_diskon, catatan } = req.body;
            const client = await db_1.pool.connect();
            try {
                await client.query('BEGIN');
                const old = await client.query(`SELECT * FROM tagihan WHERE id=$1`, [id]);
                if (!old.rowCount)
                    return res.status(404).json({ error: 'Tagihan tidak ditemukan.' });
                const result = await client.query(`UPDATE tagihan
             SET nominal_diskon=$1, catatan=$2, updated_at=NOW()
             WHERE id=$3
             RETURNING *`, [nominal_diskon ?? old.rows[0].nominal_diskon, catatan ?? old.rows[0].catatan, id]);
                await (0, auditLogger_1.logAudit)({
                    client, userId: req.user.id, action: 'UPDATE_TAGIHAN',
                    entityType: 'tagihan', entityId: id,
                    nilaiLama: old.rows[0], nilaiBaru: result.rows[0],
                    ipAddress: req.ip,
                });
                await client.query('COMMIT');
                return res.json(result.rows[0]);
            }
            catch (e) {
                await client.query('ROLLBACK');
                throw e;
            }
            finally {
                client.release();
            }
        }
        catch (err) {
            if (err instanceof validators_1.ValidationError)
                return res.status(400).json({ error: err.message });
            return res.status(500).json({ error: 'Gagal mengupdate tagihan.' });
        }
    });
    // GET /api/keuangan/santri/:id/ringkasan — Profil keuangan lengkap satu santri
    app.get('/api/keuangan/santri/:id/ringkasan', authenticateToken, roleGuard_1.requireLaporanKeuangan, async (req, res) => {
        try {
            const santriId = (0, validators_1.validatePositiveInt)(req.params.id, 'id');
            const taId = req.query.tahun_ajaran_id
                ? (0, validators_1.validatePositiveInt)(req.query.tahun_ajaran_id, 'tahun_ajaran_id')
                : null;
            const taCondition = taId ? 'AND t.tahun_ajaran_id = $2' : '';
            const params = taId ? [santriId, taId] : [santriId];
            const tagihan = await db_1.pool.query(`SELECT t.*,
                  ji.kode AS kode_iuran, ji.nama AS nama_iuran, ji.kategori,
                  COALESCE(SUM(p.nominal) FILTER (WHERE p.is_void=FALSE), 0) AS total_dibayar,
                  (t.nominal_tagihan - t.nominal_diskon -
                    COALESCE(SUM(p.nominal) FILTER (WHERE p.is_void=FALSE), 0)) AS sisa_tagihan
           FROM tagihan t
           JOIN jenis_iuran ji ON ji.id = t.jenis_iuran_id
           LEFT JOIN pembayaran p ON p.tagihan_id = t.id
           WHERE t.santri_id = $1 ${taCondition}
           GROUP BY t.id, ji.id
           ORDER BY t.periode_tahun DESC, t.periode_bulan DESC, ji.urutan`, params);
            const pembayaran = await db_1.pool.query(`SELECT p.*, ji.nama AS nama_iuran, u.full_name AS nama_bendahara
           FROM pembayaran p
           JOIN jenis_iuran ji ON ji.id = p.jenis_iuran_id
           LEFT JOIN users u ON u.id = p.dicatat_oleh
           WHERE p.santri_id = $1 AND p.is_void = FALSE ${taId ? 'AND p.tahun_ajaran_id=$2' : ''}
           ORDER BY p.tanggal_bayar DESC`, params);
            const santri = await db_1.pool.query(`SELECT s.id, COALESCE(sta.nama, s.nama) AS nama, COALESCE(sta.nis, s.nis) AS nis,
                  sta.kelas_diniyah
           FROM santri s
           LEFT JOIN santri_tahun_ajaran sta ON sta.santri_id=s.id ${taId ? 'AND sta.tahun_ajaran_id=$2' : ''}
           WHERE s.id=$1`, params);
            const rows = tagihan.rows;
            const totalTagihan = rows.reduce((s, r) => s + Number(r.nominal_tagihan), 0);
            const totalDibayar = rows.reduce((s, r) => s + Number(r.total_dibayar), 0);
            return res.json({
                santri: santri.rows[0] ?? null,
                summary: {
                    total_tagihan: totalTagihan,
                    total_dibayar: totalDibayar,
                    total_tunggakan: totalTagihan - totalDibayar,
                    jumlah_tagihan_belum_lunas: rows.filter((r) => r.status === 'belum_lunas').length,
                    jumlah_tagihan_dibebaskan: rows.filter((r) => r.status === 'dibebaskan').length,
                },
                tagihan: rows,
                pembayaran: pembayaran.rows,
            });
        }
        catch (err) {
            if (err instanceof validators_1.ValidationError)
                return res.status(400).json({ error: err.message });
            return res.status(500).json({ error: 'Gagal memuat ringkasan keuangan santri.' });
        }
    });
}
//# sourceMappingURL=tagihanRoutes.js.map