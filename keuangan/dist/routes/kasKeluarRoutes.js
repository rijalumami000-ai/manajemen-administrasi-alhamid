"use strict";
/**
 * kasKeluarRoutes.ts — Pencatatan pengeluaran kas (4 jenis)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerKasKeluarRoutes = registerKasKeluarRoutes;
const db_1 = require("../db");
const auditLogger_1 = require("../utils/auditLogger");
const validators_1 = require("../utils/validators");
const keuangan_1 = require("../types/keuangan");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { authenticateToken } = require('../../../src/middleware/authMiddleware');
const roleGuard_1 = require("../middleware/roleGuard");
const VALID_JENIS_KAS = ['kas_pondok', 'kas_madin', 'kas_smt_ganjil', 'kas_smt_genap'];
function registerKasKeluarRoutes(app) {
    // GET /api/keuangan/kas-keluar
    app.get('/api/keuangan/kas-keluar', authenticateToken, roleGuard_1.requireLaporanKeuangan, async (req, res) => {
        try {
            const { jenis_kas, tahun_ajaran_id, tanggal_dari, tanggal_sampai, page = 1, limit = 50 } = req.query;
            const conditions = ['kk.is_void = FALSE'];
            const params = [];
            let idx = 1;
            if (jenis_kas && VALID_JENIS_KAS.includes(jenis_kas)) {
                conditions.push(`kk.jenis_kas=$${idx++}`);
                params.push(jenis_kas);
            }
            if (tahun_ajaran_id) {
                conditions.push(`kk.tahun_ajaran_id=$${idx++}`);
                params.push((0, validators_1.validatePositiveInt)(tahun_ajaran_id, 'tahun_ajaran_id'));
            }
            if (tanggal_dari) {
                conditions.push(`kk.tanggal >= $${idx++}`);
                params.push(tanggal_dari);
            }
            if (tanggal_sampai) {
                conditions.push(`kk.tanggal <= $${idx++}`);
                params.push(tanggal_sampai);
            }
            const where = 'WHERE ' + conditions.join(' AND ');
            const offset = (Number(page) - 1) * Number(limit);
            // Summary total per jenis (untuk saldo berjalan)
            const summaryResult = await db_1.pool.query(`SELECT jenis_kas, COALESCE(SUM(nominal), 0) AS total
           FROM kas_keluar
           ${where.replace('kk.', '')}
           GROUP BY jenis_kas`, params);
            const summary = {};
            for (const row of summaryResult.rows) {
                summary[row.jenis_kas] = Number(row.total);
            }
            const countResult = await db_1.pool.query(`SELECT COUNT(*) AS total FROM kas_keluar kk ${where}`, params);
            const total = Number(countResult.rows[0].total);
            const result = await db_1.pool.query(`SELECT kk.*, u.full_name AS nama_bendahara, ta.kode AS kode_tahun_ajaran,
                  SUM(kk.nominal) OVER (
                    PARTITION BY kk.jenis_kas
                    ORDER BY kk.tanggal, kk.id
                    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
                  ) AS saldo_berjalan
           FROM kas_keluar kk
           LEFT JOIN users u ON u.id = kk.dicatat_oleh
           LEFT JOIN tahun_ajaran ta ON ta.id = kk.tahun_ajaran_id
           ${where}
           ORDER BY kk.tanggal DESC, kk.id DESC
           LIMIT $${idx} OFFSET $${idx + 1}`, [...params, Number(limit), offset]);
            return res.json({
                data: result.rows,
                summary,
                jenis_kas_labels: keuangan_1.LABEL_JENIS_KAS,
                pagination: { total, page: Number(page), limit: Number(limit), total_pages: Math.ceil(total / Number(limit)) },
            });
        }
        catch (err) {
            if (err instanceof validators_1.ValidationError)
                return res.status(400).json({ error: err.message });
            console.error('GET /api/keuangan/kas-keluar error:', err);
            return res.status(500).json({ error: 'Gagal memuat kas keluar.' });
        }
    });
    // POST /api/keuangan/kas-keluar — Catat pengeluaran baru
    app.post('/api/keuangan/kas-keluar', authenticateToken, roleGuard_1.requireKeuangan, async (req, res) => {
        try {
            const data = (0, validators_1.validateCatatKasKeluar)(req.body);
            const tanggal = (0, validators_1.validateTanggalBayar)(data.tanggal, req.user.role === 'admin');
            const client = await db_1.pool.connect();
            try {
                await client.query('BEGIN');
                const result = await client.query(`INSERT INTO kas_keluar
               (jenis_kas, tahun_ajaran_id, nominal, tanggal, keterangan, penerima, dicatat_oleh)
             VALUES ($1,$2,$3,$4,$5,$6,$7)
             RETURNING *`, [
                    data.jenis_kas, data.tahun_ajaran_id ?? null, data.nominal,
                    tanggal.toISOString().split('T')[0],
                    data.keterangan, data.penerima ?? null, req.user.id,
                ]);
                await (0, auditLogger_1.logAudit)({
                    client, userId: req.user.id, action: 'CATAT_KAS_KELUAR',
                    entityType: 'kas_keluar', entityId: result.rows[0].id,
                    nilaiBaru: result.rows[0],
                    keterangan: `${keuangan_1.LABEL_JENIS_KAS[data.jenis_kas]}: ${data.keterangan} — Rp ${data.nominal.toLocaleString('id-ID')}`,
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
            console.error('POST /api/keuangan/kas-keluar error:', err);
            return res.status(500).json({ error: 'Gagal mencatat kas keluar.' });
        }
    });
    // PUT /api/keuangan/kas-keluar/:id — Edit pengeluaran
    app.put('/api/keuangan/kas-keluar/:id', authenticateToken, roleGuard_1.requireKeuangan, async (req, res) => {
        try {
            const id = (0, validators_1.validatePositiveInt)(req.params.id, 'id');
            const { keterangan, penerima, nominal } = req.body;
            const client = await db_1.pool.connect();
            try {
                await client.query('BEGIN');
                const old = await client.query(`SELECT * FROM kas_keluar WHERE id=$1`, [id]);
                if (!old.rowCount)
                    return res.status(404).json({ error: 'Data tidak ditemukan.' });
                if (old.rows[0].is_void)
                    return res.status(409).json({ error: 'Data sudah dibatalkan dan tidak bisa diedit.' });
                const result = await client.query(`UPDATE kas_keluar
             SET keterangan=$1, penerima=$2, nominal=$3, updated_at=NOW()
             WHERE id=$4 RETURNING *`, [
                    keterangan ?? old.rows[0].keterangan,
                    penerima ?? old.rows[0].penerima,
                    nominal ? (0, validators_1.validatePositiveInt)(nominal, 'nominal') : old.rows[0].nominal,
                    id,
                ]);
                await (0, auditLogger_1.logAudit)({
                    client, userId: req.user.id, action: 'EDIT_KAS_KELUAR',
                    entityType: 'kas_keluar', entityId: id,
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
            return res.status(500).json({ error: 'Gagal mengedit kas keluar.' });
        }
    });
    // PATCH /api/keuangan/kas-keluar/:id/void — Batalkan pengeluaran
    app.patch('/api/keuangan/kas-keluar/:id/void', authenticateToken, roleGuard_1.requireKeuangan, async (req, res) => {
        try {
            const id = (0, validators_1.validatePositiveInt)(req.params.id, 'id');
            const { void_reason } = req.body;
            if (!void_reason?.trim()) {
                return res.status(400).json({ error: 'Alasan pembatalan wajib diisi.' });
            }
            const client = await db_1.pool.connect();
            try {
                await client.query('BEGIN');
                const old = await client.query(`SELECT * FROM kas_keluar WHERE id=$1`, [id]);
                if (!old.rowCount)
                    return res.status(404).json({ error: 'Data tidak ditemukan.' });
                if (old.rows[0].is_void)
                    return res.status(409).json({ error: 'Data sudah dibatalkan.' });
                await client.query(`UPDATE kas_keluar
             SET is_void=TRUE, void_reason=$1, void_oleh=$2, void_at=NOW()
             WHERE id=$3`, [void_reason.trim(), req.user.id, id]);
                await (0, auditLogger_1.logAudit)({
                    client, userId: req.user.id, action: 'VOID_KAS_KELUAR',
                    entityType: 'kas_keluar', entityId: id,
                    nilaiLama: old.rows[0],
                    nilaiBaru: { is_void: true, void_reason: void_reason.trim() },
                    ipAddress: req.ip,
                });
                await client.query('COMMIT');
                return res.json({ message: 'Pengeluaran berhasil dibatalkan.' });
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
            return res.status(500).json({ error: 'Gagal membatalkan kas keluar.' });
        }
    });
}
//# sourceMappingURL=kasKeluarRoutes.js.map