"use strict";
/**
 * tagihanService.ts — Logika bisnis utama tagihan keuangan
 *
 * Fitur utama:
 * 1. Generate tagihan SPP massal (free SPP + override tarif bulanan)
 * 2. Update status tagihan otomatis berdasarkan pembayaran
 * 3. Semua operasi dalam PostgreSQL transaction (atomic)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTagihanSPPBulanan = generateTagihanSPPBulanan;
exports.catatPembayaran = catatPembayaran;
exports.voidPembayaran = voidPembayaran;
exports.updateStatusTagihan = updateStatusTagihan;
exports.generateTagihanDaftarUlang = generateTagihanDaftarUlang;
exports.generateTagihanEvent = generateTagihanEvent;
const db_1 = require("../db");
const auditLogger_1 = require("../utils/auditLogger");
const noKwitansi_1 = require("../utils/noKwitansi");
const validators_1 = require("../utils/validators");
const roleGuard_1 = require("../middleware/roleGuard");
// ════════════════════════════════════════════════════════════════════════════
// GENERATE TAGIHAN SPP MASSAL
// ════════════════════════════════════════════════════════════════════════════
/**
 * Generate tagihan SPP Makan dan SPP Madin untuk SEMUA santri aktif
 * dalam satu tahun ajaran, bulan, dan tahun kalender tertentu.
 *
 * Logic:
 * 1. Ambil semua santri aktif di tahun ajaran
 * 2. Ambil tarif SPP (cek override bulanan dulu, fallback ke tarif tahunan)
 * 3. Untuk setiap santri:
 *    a. Cek pengecualian → jika ada: tagihan dibebaskan (nominal 0, status 'dibebaskan')
 *    b. Jika tidak: buat tagihan normal
 *    c. Skip jika sudah ada (UNIQUE constraint)
 * 4. Semua dalam satu PostgreSQL transaction
 */
async function generateTagihanSPPBulanan(params, userId, ipAddress) {
    const { tahun_ajaran_id, bulan, tahun } = params;
    const client = await db_1.pool.connect();
    try {
        await client.query('BEGIN');
        // ── Ambil jenis iuran SPP ──────────────────────────────────────────────
        const jenisResult = await client.query(`SELECT id, kode, nama FROM jenis_iuran
       WHERE kode IN ('SPP_MAKAN', 'SPP_MADIN') AND is_active = TRUE
       ORDER BY urutan`);
        const jenisSPP = jenisResult.rows;
        if (jenisSPP.length === 0) {
            throw new validators_1.ValidationError('Jenis iuran SPP tidak ditemukan. Pastikan data master sudah diinisialisasi.');
        }
        // ── Ambil tarif (override bulanan > default tahunan) ──────────────────
        const tarifMap = {};
        for (const j of jenisSPP) {
            // Cek override bulanan dulu
            const overrideResult = await client.query(`SELECT nominal FROM tarif_iuran_bulanan
         WHERE jenis_iuran_id = $1 AND tahun_ajaran_id = $2
           AND bulan = $3 AND tahun_kalender = $4`, [j.id, tahun_ajaran_id, bulan, tahun]);
            if (overrideResult.rows.length > 0) {
                tarifMap[j.id] = Number(overrideResult.rows[0].nominal);
            }
            else {
                // Fallback ke tarif default tahunan
                const defaultResult = await client.query(`SELECT nominal FROM tarif_iuran
           WHERE jenis_iuran_id = $1 AND tahun_ajaran_id = $2`, [j.id, tahun_ajaran_id]);
                if (defaultResult.rows.length === 0) {
                    throw new validators_1.ValidationError(`Tarif untuk ${j.nama} belum diset untuk tahun ajaran ini. ` +
                        `Silakan atur tarif terlebih dahulu di Setup Keuangan.`);
                }
                tarifMap[j.id] = Number(defaultResult.rows[0].nominal);
            }
        }
        // ── Ambil semua santri aktif ──────────────────────────────────────────
        const santriResult = await client.query(`SELECT s.id, COALESCE(sta.nama, s.nama) AS nama, COALESCE(sta.nis, s.nis) AS nis
       FROM santri s
       JOIN santri_tahun_ajaran sta ON sta.santri_id = s.id AND sta.tahun_ajaran_id = $1
       WHERE sta.status IN ('aktif', 'draft', 'tidak_naik')
         AND NOT EXISTS (SELECT 1 FROM alumni a WHERE a.santri_id = s.id)
       ORDER BY COALESCE(sta.nama, s.nama)`, [tahun_ajaran_id]);
        const santriAktif = santriResult.rows;
        // ── Ambil semua pengecualian untuk tahun ajaran ini ───────────────────
        const pengecualianResult = await client.query(`SELECT santri_id, jenis_iuran_id FROM pengecualian_iuran
       WHERE tahun_ajaran_id = $1`, [tahun_ajaran_id]);
        // Buat Set untuk lookup O(1): "santriId-jenisIuranId"
        const pengecualianSet = new Set(pengecualianResult.rows.map(r => `${r.santri_id}-${r.jenis_iuran_id}`));
        // ── Tanggal jatuh tempo (tanggal 10 bulan yang sama) ─────────────────
        const jatuhTempo = new Date(tahun, bulan - 1, 10);
        // ── Generate tagihan per santri per jenis SPP ─────────────────────────
        const hasil = {
            berhasil: 0,
            dibebaskan: 0,
            sudah_ada: 0,
            errors: [],
            detail: [],
        };
        for (const santri of santriAktif) {
            for (const jenis of jenisSPP) {
                const isBebas = pengecualianSet.has(`${santri.id}-${jenis.id}`);
                const nominalTagihan = isBebas ? 0 : tarifMap[jenis.id];
                const status = isBebas ? 'dibebaskan' : 'belum_lunas';
                try {
                    const insertResult = await client.query(`INSERT INTO tagihan
               (santri_id, jenis_iuran_id, tahun_ajaran_id,
                periode_bulan, periode_tahun,
                nominal_tagihan, status, tanggal_jatuh_tempo,
                catatan)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (santri_id, jenis_iuran_id, tahun_ajaran_id, periode_bulan, periode_tahun)
               DO NOTHING
             RETURNING id`, [
                        santri.id, jenis.id, tahun_ajaran_id,
                        bulan, tahun,
                        nominalTagihan, status,
                        jatuhTempo.toISOString().split('T')[0],
                        isBebas ? `Dibebaskan dari ${jenis.nama}` : null,
                    ]);
                    if (insertResult.rowCount && insertResult.rowCount > 0) {
                        if (isBebas) {
                            hasil.dibebaskan++;
                            hasil.detail.push({ santri_id: santri.id, nama: santri.nama, hasil: 'dibebaskan' });
                        }
                        else {
                            hasil.berhasil++;
                            hasil.detail.push({ santri_id: santri.id, nama: santri.nama, hasil: 'berhasil' });
                        }
                    }
                    else {
                        hasil.sudah_ada++;
                        hasil.detail.push({ santri_id: santri.id, nama: santri.nama, hasil: 'sudah_ada' });
                    }
                }
                catch (err) {
                    const msg = err instanceof Error ? err.message : String(err);
                    hasil.errors.push(`${santri.nama} (${jenis.nama}): ${msg}`);
                    hasil.detail.push({ santri_id: santri.id, nama: santri.nama, hasil: 'error', pesan: msg });
                }
            }
        }
        // ── Audit log ─────────────────────────────────────────────────────────
        await (0, auditLogger_1.logAudit)({
            client,
            userId,
            action: 'GENERATE_TAGIHAN_MASSAL',
            entityType: 'tagihan',
            nilaiBaru: { bulan, tahun, tahun_ajaran_id, hasil: { berhasil: hasil.berhasil, dibebaskan: hasil.dibebaskan } },
            keterangan: `Generate SPP bulan ${bulan}/${tahun}: ${hasil.berhasil} berhasil, ${hasil.dibebaskan} dibebaskan, ${hasil.sudah_ada} sudah ada`,
            ipAddress,
        });
        await client.query('COMMIT');
        return hasil;
    }
    catch (err) {
        await client.query('ROLLBACK');
        throw err;
    }
    finally {
        client.release();
    }
}
// ════════════════════════════════════════════════════════════════════════════
// CATAT PEMBAYARAN
// ════════════════════════════════════════════════════════════════════════════
/**
 * Catat pembayaran baru dan otomatis update status tagihan.
 * Semua dalam satu transaction. Generate nomor kwitansi otomatis.
 */
async function catatPembayaran(rawBody, userId, isAdmin, ipAddress) {
    const data = (0, validators_1.validateCatatPembayaran)(rawBody);
    // Validasi tanggal dengan batasan role
    const tanggalBayar = (0, validators_1.validateTanggalBayar)(data.tanggal_bayar, isAdmin);
    const client = await db_1.pool.connect();
    try {
        await client.query('BEGIN');
        // ── Double-submit check (5 detik) ─────────────────────────────────────
        const doubleCheck = await client.query(`SELECT id FROM pembayaran
       WHERE santri_id = $1
         AND jenis_iuran_id = $2
         AND nominal = $3
         AND is_void = FALSE
         AND created_at > NOW() - INTERVAL '5 seconds'`, [data.santri_id, data.jenis_iuran_id, data.nominal]);
        if (doubleCheck.rowCount && doubleCheck.rowCount > 0) {
            throw new validators_1.ValidationError('Pembayaran duplikat terdeteksi. Tunggu beberapa saat sebelum mencoba lagi.');
        }
        // ── Generate nomor kwitansi ───────────────────────────────────────────
        const noKwitansi = await (0, noKwitansi_1.generateNoKwitansi)(client);
        // ── Insert pembayaran ─────────────────────────────────────────────────
        const insertResult = await client.query(`INSERT INTO pembayaran
         (no_kwitansi, tagihan_id, santri_id, jenis_iuran_id, tahun_ajaran_id,
          nominal, metode_bayar, tanggal_bayar, periode_bulan, periode_tahun,
          dicatat_oleh, keterangan)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id`, [
            noKwitansi,
            data.tagihan_id ?? null,
            data.santri_id,
            data.jenis_iuran_id,
            data.tahun_ajaran_id,
            data.nominal,
            data.metode_bayar ?? 'tunai',
            tanggalBayar.toISOString().split('T')[0],
            data.periode_bulan ?? null,
            data.periode_tahun ?? null,
            userId,
            data.keterangan ?? null,
        ]);
        const pembayaranId = insertResult.rows[0].id;
        // ── Update status tagihan jika ada tagihan_id ─────────────────────────
        if (data.tagihan_id) {
            await updateStatusTagihan(client, data.tagihan_id);
        }
        // ── Audit log ─────────────────────────────────────────────────────────
        await (0, auditLogger_1.logAudit)({
            client,
            userId,
            action: 'CATAT_PEMBAYARAN',
            entityType: 'pembayaran',
            entityId: pembayaranId,
            nilaiBaru: {
                no_kwitansi: noKwitansi,
                santri_id: data.santri_id,
                jenis_iuran_id: data.jenis_iuran_id,
                nominal: data.nominal,
                tanggal_bayar: tanggalBayar.toISOString().split('T')[0],
            },
            keterangan: `Pembayaran ${noKwitansi} — Rp ${data.nominal.toLocaleString('id-ID')}`,
            ipAddress,
        });
        await client.query('COMMIT');
        // ── Ambil data lengkap untuk response ────────────────────────────────
        const fullResult = await db_1.pool.query(`SELECT p.*,
              COALESCE(sta.nama, s.nama) AS nama_santri,
              COALESCE(sta.nis, s.nis) AS nis,
              ji.nama AS nama_iuran,
              u.full_name AS nama_bendahara
       FROM pembayaran p
       JOIN santri s ON s.id = p.santri_id
       LEFT JOIN santri_tahun_ajaran sta ON sta.santri_id = s.id AND sta.tahun_ajaran_id = p.tahun_ajaran_id
       JOIN jenis_iuran ji ON ji.id = p.jenis_iuran_id
       LEFT JOIN users u ON u.id = p.dicatat_oleh
       WHERE p.id = $1`, [pembayaranId]);
        return fullResult.rows[0];
    }
    catch (err) {
        await client.query('ROLLBACK');
        throw err;
    }
    finally {
        client.release();
    }
}
// ════════════════════════════════════════════════════════════════════════════
// VOID PEMBAYARAN
// ════════════════════════════════════════════════════════════════════════════
async function voidPembayaran(pembayaranId, voidReason, userId, userRole, ipAddress) {
    if (!voidReason?.trim()) {
        throw new validators_1.ValidationError('Alasan pembatalan wajib diisi');
    }
    const client = await db_1.pool.connect();
    try {
        await client.query('BEGIN');
        // Ambil data pembayaran existing
        const existing = await client.query(`SELECT id, is_void, tanggal_bayar, tagihan_id, nominal, no_kwitansi
       FROM pembayaran WHERE id = $1`, [pembayaranId]);
        if (!existing.rows.length) {
            throw new validators_1.ValidationError('Pembayaran tidak ditemukan');
        }
        const pem = existing.rows[0];
        if (pem.is_void) {
            throw new validators_1.ValidationError('Pembayaran ini sudah dibatalkan sebelumnya');
        }
        // Cek izin void berdasarkan role
        const voidCheck = (0, roleGuard_1.canVoidPembayaran)(userRole, new Date(pem.tanggal_bayar));
        if (!voidCheck.allowed) {
            throw new validators_1.ValidationError(voidCheck.reason ?? 'Tidak diizinkan void pembayaran ini');
        }
        // Mark as void
        await client.query(`UPDATE pembayaran
       SET is_void = TRUE, void_reason = $1, void_oleh = $2, void_at = NOW()
       WHERE id = $3`, [voidReason.trim(), userId, pembayaranId]);
        // Recalculate status tagihan jika ada
        if (pem.tagihan_id) {
            await updateStatusTagihan(client, pem.tagihan_id);
        }
        // Audit log
        await (0, auditLogger_1.logAudit)({
            client,
            userId,
            action: 'VOID_PEMBAYARAN',
            entityType: 'pembayaran',
            entityId: pembayaranId,
            nilaiLama: { is_void: false, nominal: pem.nominal, no_kwitansi: pem.no_kwitansi },
            nilaiBaru: { is_void: true, void_reason: voidReason.trim() },
            keterangan: `Void ${pem.no_kwitansi}: ${voidReason.trim()}`,
            ipAddress,
        });
        await client.query('COMMIT');
    }
    catch (err) {
        await client.query('ROLLBACK');
        throw err;
    }
    finally {
        client.release();
    }
}
// ════════════════════════════════════════════════════════════════════════════
// HELPER: Update status tagihan berdasarkan total pembayaran
// ════════════════════════════════════════════════════════════════════════════
async function updateStatusTagihan(client, tagihanId) {
    // Ambil nominal tagihan
    const tagihanResult = await client.query(`SELECT nominal_tagihan, nominal_diskon, status FROM tagihan WHERE id = $1`, [tagihanId]);
    if (!tagihanResult.rows.length)
        return;
    const tagihan = tagihanResult.rows[0];
    if (tagihan.status === 'dibebaskan')
        return; // Tidak berubah
    const nominalEfektif = Number(tagihan.nominal_tagihan) - Number(tagihan.nominal_diskon);
    // Hitung total pembayaran yang valid (is_void = false)
    const bayarResult = await client.query(`SELECT COALESCE(SUM(nominal), 0) AS total
     FROM pembayaran
     WHERE tagihan_id = $1 AND is_void = FALSE`, [tagihanId]);
    const totalDibayar = Number(bayarResult.rows[0].total);
    let newStatus;
    if (totalDibayar <= 0) {
        newStatus = 'belum_lunas';
    }
    else if (totalDibayar >= nominalEfektif) {
        newStatus = 'lunas';
    }
    else {
        newStatus = 'sebagian';
    }
    await client.query(`UPDATE tagihan SET status = $1, updated_at = NOW() WHERE id = $2`, [newStatus, tagihanId]);
}
/**
 * Generate tagihan Daftar Ulang (massal) untuk semua santri aktif
 * di tahun ajaran tertentu, otomatis memisahkan baru dan lama.
 */
async function generateTagihanDaftarUlang(params, userId, ipAddress) {
    const { tahun_ajaran_id } = params;
    const client = await db_1.pool.connect();
    try {
        await client.query('BEGIN');
        // 1. Ambil semua jenis iuran daftar ulang (baru dan lama)
        const jenisResult = await client.query(`SELECT id, kode, nama, kategori FROM jenis_iuran
       WHERE kategori IN ('daftar_ulang_baru', 'daftar_ulang_lama') AND is_active = TRUE
       ORDER BY urutan`);
        const jenisDU = jenisResult.rows;
        if (jenisDU.length === 0) {
            throw new validators_1.ValidationError('Jenis iuran Daftar Ulang tidak ditemukan. Pastikan data master sudah diinisialisasi.');
        }
        // 2. Ambil tarif iuran default tahunan untuk DU
        const defaultTarifResult = await client.query(`SELECT jenis_iuran_id, nominal FROM tarif_iuran
       WHERE tahun_ajaran_id = $1`, [tahun_ajaran_id]);
        const tarifMap = {};
        for (const t of defaultTarifResult.rows) {
            tarifMap[t.jenis_iuran_id] = Number(t.nominal);
        }
        // 3. Ambil semua santri aktif di tahun ajaran ini
        const santriResult = await client.query(`SELECT s.id, COALESCE(sta.nama, s.nama) AS nama, COALESCE(sta.nis, s.nis) AS nis
       FROM santri s
       JOIN santri_tahun_ajaran sta ON sta.santri_id = s.id AND sta.tahun_ajaran_id = $1
       WHERE sta.status IN ('aktif', 'draft', 'tidak_naik')
         AND NOT EXISTS (SELECT 1 FROM alumni a WHERE a.santri_id = s.id)
       ORDER BY COALESCE(sta.nama, s.nama)`, [tahun_ajaran_id]);
        const santriAktif = santriResult.rows;
        // 4. Ambil semua pengecualian
        const pengecualianResult = await client.query(`SELECT santri_id, jenis_iuran_id FROM pengecualian_iuran
       WHERE tahun_ajaran_id = $1`, [tahun_ajaran_id]);
        const pengecualianSet = new Set(pengecualianResult.rows.map(r => `${r.santri_id}-${r.jenis_iuran_id}`));
        const hasil = {
            berhasil: 0,
            dibebaskan: 0,
            sudah_ada: 0,
            errors: [],
            detail: [],
        };
        // 5. Generate tagihan per santri
        for (const santri of santriAktif) {
            // Cek apakah santri lama atau baru
            const checkLamaResult = await client.query(`SELECT EXISTS (
           SELECT 1 FROM santri_tahun_ajaran
           WHERE santri_id = $1 AND tahun_ajaran_id < $2
         ) AS is_lama`, [santri.id, tahun_ajaran_id]);
            const isLama = checkLamaResult.rows[0].is_lama;
            const targetKategori = isLama ? 'daftar_ulang_lama' : 'daftar_ulang_baru';
            // Saring iuran daftar ulang yang cocok dengan status santri
            const targetIuran = jenisDU.filter(j => j.kategori === targetKategori);
            for (const jenis of targetIuran) {
                const rate = tarifMap[jenis.id] ?? 0;
                const isBebas = pengecualianSet.has(`${santri.id}-${jenis.id}`);
                const nominalTagihan = isBebas ? 0 : rate;
                const status = isBebas ? 'dibebaskan' : 'belum_lunas';
                try {
                    // Check if already exists manually since NULL fields in UNIQUE allow duplicates in Postgres
                    const existResult = await client.query(`SELECT id FROM tagihan
             WHERE santri_id = $1 AND jenis_iuran_id = $2 AND tahun_ajaran_id = $3
               AND periode_bulan IS NULL`, [santri.id, jenis.id, tahun_ajaran_id]);
                    if (existResult.rows.length > 0) {
                        hasil.sudah_ada++;
                        hasil.detail.push({ santri_id: santri.id, nama: santri.nama, hasil: 'sudah_ada' });
                        continue;
                    }
                    await client.query(`INSERT INTO tagihan
               (santri_id, jenis_iuran_id, tahun_ajaran_id,
                periode_bulan, periode_tahun,
                nominal_tagihan, status, tanggal_jatuh_tempo,
                catatan)
             VALUES ($1, $2, $3, NULL, NULL, $4, $5, NULL, $6)`, [
                        santri.id, jenis.id, tahun_ajaran_id,
                        nominalTagihan, status,
                        isBebas ? `Dibebaskan dari ${jenis.nama}` : null,
                    ]);
                    if (isBebas) {
                        hasil.dibebaskan++;
                        hasil.detail.push({ santri_id: santri.id, nama: santri.nama, hasil: 'dibebaskan' });
                    }
                    else {
                        hasil.berhasil++;
                        hasil.detail.push({ santri_id: santri.id, nama: santri.nama, hasil: 'berhasil' });
                    }
                }
                catch (err) {
                    const msg = err instanceof Error ? err.message : String(err);
                    hasil.errors.push(`${santri.nama} (${jenis.nama}): ${msg}`);
                    hasil.detail.push({ santri_id: santri.id, nama: santri.nama, hasil: 'error', pesan: msg });
                }
            }
        }
        await (0, auditLogger_1.logAudit)({
            client,
            userId,
            action: 'GENERATE_TAGIHAN_MASSAL',
            entityType: 'tagihan',
            nilaiBaru: { kategori: 'daftar_ulang', tahun_ajaran_id, hasil: { berhasil: hasil.berhasil, dibebaskan: hasil.dibebaskan } },
            keterangan: `Generate Daftar Ulang: ${hasil.berhasil} berhasil, ${hasil.dibebaskan} dibebaskan, ${hasil.sudah_ada} sudah ada`,
            ipAddress,
        });
        await client.query('COMMIT');
        return hasil;
    }
    catch (err) {
        await client.query('ROLLBACK');
        throw err;
    }
    finally {
        client.release();
    }
}
/**
 * Generate tagihan Event (massal) untuk semua santri aktif
 * di tahun ajaran tertentu untuk iuran event spesifik.
 */
async function generateTagihanEvent(params, userId, ipAddress) {
    const { tahun_ajaran_id, jenis_iuran_id } = params;
    const client = await db_1.pool.connect();
    try {
        await client.query('BEGIN');
        // 1. Ambil data event
        const jenisResult = await client.query(`SELECT id, kode, nama, kategori FROM jenis_iuran
       WHERE id = $1 AND kategori = 'event' AND is_active = TRUE`, [jenis_iuran_id]);
        if (jenisResult.rows.length === 0) {
            throw new validators_1.ValidationError('Jenis iuran Event tidak ditemukan atau tidak aktif.');
        }
        const jenisEvent = jenisResult.rows[0];
        // 2. Ambil tarif iuran default tahunan untuk Event ini
        const tarifResult = await client.query(`SELECT nominal FROM tarif_iuran
       WHERE jenis_iuran_id = $1 AND tahun_ajaran_id = $2`, [jenis_iuran_id, tahun_ajaran_id]);
        if (tarifResult.rows.length === 0) {
            throw new validators_1.ValidationError(`Tarif untuk event ${jenisEvent.nama} belum diset untuk tahun ajaran ini.`);
        }
        const rate = Number(tarifResult.rows[0].nominal);
        // 3. Ambil semua santri aktif di tahun ajaran ini
        const santriResult = await client.query(`SELECT s.id, COALESCE(sta.nama, s.nama) AS nama, COALESCE(sta.nis, s.nis) AS nis
       FROM santri s
       JOIN santri_tahun_ajaran sta ON sta.santri_id = s.id AND sta.tahun_ajaran_id = $1
       WHERE sta.status IN ('aktif', 'draft', 'tidak_naik')
         AND NOT EXISTS (SELECT 1 FROM alumni a WHERE a.santri_id = s.id)
       ORDER BY COALESCE(sta.nama, s.nama)`, [tahun_ajaran_id]);
        const santriAktif = santriResult.rows;
        // 4. Ambil semua pengecualian
        const pengecualianResult = await client.query(`SELECT santri_id FROM pengecualian_iuran
       WHERE tahun_ajaran_id = $1 AND jenis_iuran_id = $2`, [tahun_ajaran_id, jenis_iuran_id]);
        const pengecualianSet = new Set(pengecualianResult.rows.map(r => r.santri_id));
        const hasil = {
            berhasil: 0,
            dibebaskan: 0,
            sudah_ada: 0,
            errors: [],
            detail: [],
        };
        // 5. Generate tagihan per santri
        for (const santri of santriAktif) {
            const isBebas = pengecualianSet.has(santri.id);
            const nominalTagihan = isBebas ? 0 : rate;
            const status = isBebas ? 'dibebaskan' : 'belum_lunas';
            try {
                // Check if already exists manually
                const existResult = await client.query(`SELECT id FROM tagihan
           WHERE santri_id = $1 AND jenis_iuran_id = $2 AND tahun_ajaran_id = $3
             AND periode_bulan IS NULL`, [santri.id, jenis_iuran_id, tahun_ajaran_id]);
                if (existResult.rows.length > 0) {
                    hasil.sudah_ada++;
                    hasil.detail.push({ santri_id: santri.id, nama: santri.nama, hasil: 'sudah_ada' });
                    continue;
                }
                await client.query(`INSERT INTO tagihan
             (santri_id, jenis_iuran_id, tahun_ajaran_id,
              periode_bulan, periode_tahun,
              nominal_tagihan, status, tanggal_jatuh_tempo,
              catatan)
           VALUES ($1, $2, $3, NULL, NULL, $4, $5, NULL, $6)`, [
                    santri.id, jenis_iuran_id, tahun_ajaran_id,
                    nominalTagihan, status,
                    isBebas ? `Dibebaskan dari ${jenisEvent.nama}` : null,
                ]);
                if (isBebas) {
                    hasil.dibebaskan++;
                    hasil.detail.push({ santri_id: santri.id, nama: santri.nama, hasil: 'dibebaskan' });
                }
                else {
                    hasil.berhasil++;
                    hasil.detail.push({ santri_id: santri.id, nama: santri.nama, hasil: 'berhasil' });
                }
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                hasil.errors.push(`${santri.nama} (${jenisEvent.nama}): ${msg}`);
                hasil.detail.push({ santri_id: santri.id, nama: santri.nama, hasil: 'error', pesan: msg });
            }
        }
        await (0, auditLogger_1.logAudit)({
            client,
            userId,
            action: 'GENERATE_TAGIHAN_MASSAL',
            entityType: 'tagihan',
            nilaiBaru: { kategori: 'event', jenis_iuran_id, tahun_ajaran_id, hasil: { berhasil: hasil.berhasil, dibebaskan: hasil.dibebaskan } },
            keterangan: `Generate Event ${jenisEvent.nama}: ${hasil.berhasil} berhasil, ${hasil.dibebaskan} dibebaskan, ${hasil.sudah_ada} sudah ada`,
            ipAddress,
        });
        await client.query('COMMIT');
        return hasil;
    }
    catch (err) {
        await client.query('ROLLBACK');
        throw err;
    }
    finally {
        client.release();
    }
}
//# sourceMappingURL=tagihanService.js.map