/**
 * tagihanService.ts — Logika bisnis utama tagihan keuangan
 *
 * Fitur utama:
 * 1. Generate tagihan SPP massal (free SPP + override tarif bulanan)
 * 2. Update status tagihan otomatis berdasarkan pembayaran
 * 3. Semua operasi dalam PostgreSQL transaction (atomic)
 */

import type { PoolClient } from 'pg';
import { pool } from '../db';
import { logAudit } from '../utils/auditLogger';
import { generateNoKwitansi } from '../utils/noKwitansi';
import { validateTanggalBayar, validateCatatPembayaran, ValidationError } from '../utils/validators';
import { canVoidPembayaran } from '../middleware/roleGuard';
import {
  GenerateTagihanBulananRequest,
  HasilGenerateTagihan,
  CatatPembayaranRequest,
  Pembayaran,
  StatusTagihan,
} from '../types/keuangan';

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
export async function generateTagihanSPPBulanan(
  params: GenerateTagihanBulananRequest,
  userId: number,
  ipAddress?: string
): Promise<HasilGenerateTagihan> {
  const { tahun_ajaran_id, bulan, tahun } = params;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── Ambil jenis iuran SPP ──────────────────────────────────────────────
    const jenisResult = await client.query<{ id: number; kode: string; nama: string }>(
      `SELECT id, kode, nama FROM jenis_iuran
       WHERE kode IN ('SPP_MAKAN', 'SPP_MADIN') AND is_active = TRUE
       ORDER BY urutan`
    );
    const jenisSPP = jenisResult.rows;
    if (jenisSPP.length === 0) {
      throw new ValidationError('Jenis iuran SPP tidak ditemukan. Pastikan data master sudah diinisialisasi.');
    }

    // ── Ambil tarif (override bulanan > default tahunan) ──────────────────
    const tarifMap: Record<number, number> = {};
    for (const j of jenisSPP) {
      // Cek override bulanan dulu
      const overrideResult = await client.query<{ nominal: string }>(
        `SELECT nominal FROM tarif_iuran_bulanan
         WHERE jenis_iuran_id = $1 AND tahun_ajaran_id = $2
           AND bulan = $3 AND tahun_kalender = $4`,
        [j.id, tahun_ajaran_id, bulan, tahun]
      );

      if (overrideResult.rows.length > 0) {
        tarifMap[j.id] = Number(overrideResult.rows[0].nominal);
      } else {
        // Fallback ke tarif default tahunan
        const defaultResult = await client.query<{ nominal: string }>(
          `SELECT nominal FROM tarif_iuran
           WHERE jenis_iuran_id = $1 AND tahun_ajaran_id = $2`,
          [j.id, tahun_ajaran_id]
        );
        if (defaultResult.rows.length === 0) {
          throw new ValidationError(
            `Tarif untuk ${j.nama} belum diset untuk tahun ajaran ini. ` +
            `Silakan atur tarif terlebih dahulu di Setup Keuangan.`
          );
        }
        tarifMap[j.id] = Number(defaultResult.rows[0].nominal);
      }
    }

    // ── Ambil semua santri aktif ──────────────────────────────────────────
    const santriResult = await client.query<{ id: number; nama: string; nis: string }>(
      `SELECT s.id, COALESCE(sta.nama, s.nama) AS nama, COALESCE(sta.nis, s.nis) AS nis
       FROM santri s
       JOIN santri_tahun_ajaran sta ON sta.santri_id = s.id AND sta.tahun_ajaran_id = $1
       WHERE sta.status IN ('aktif', 'draft', 'tidak_naik')
         AND NOT EXISTS (SELECT 1 FROM alumni a WHERE a.santri_id = s.id)
       ORDER BY COALESCE(sta.nama, s.nama)`,
      [tahun_ajaran_id]
    );
    const santriAktif = santriResult.rows;

    // ── Ambil semua pengecualian untuk tahun ajaran ini ───────────────────
    const pengecualianResult = await client.query<{ santri_id: number; jenis_iuran_id: number }>(
      `SELECT santri_id, jenis_iuran_id FROM pengecualian_iuran
       WHERE tahun_ajaran_id = $1`,
      [tahun_ajaran_id]
    );
    // Buat Set untuk lookup O(1): "santriId-jenisIuranId"
    const pengecualianSet = new Set(
      pengecualianResult.rows.map(r => `${r.santri_id}-${r.jenis_iuran_id}`)
    );

    // ── Tanggal jatuh tempo (tanggal 10 bulan yang sama) ─────────────────
    const jatuhTempo = new Date(tahun, bulan - 1, 10);

    // ── Generate tagihan per santri per jenis SPP ─────────────────────────
    const hasil: HasilGenerateTagihan = {
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
        const status: StatusTagihan = isBebas ? 'dibebaskan' : 'belum_lunas';

        try {
          const insertResult = await client.query(
            `INSERT INTO tagihan
               (santri_id, jenis_iuran_id, tahun_ajaran_id,
                periode_bulan, periode_tahun,
                nominal_tagihan, status, tanggal_jatuh_tempo,
                catatan)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (santri_id, jenis_iuran_id, tahun_ajaran_id, periode_bulan, periode_tahun)
               DO NOTHING
             RETURNING id`,
            [
              santri.id, jenis.id, tahun_ajaran_id,
              bulan, tahun,
              nominalTagihan, status,
              jatuhTempo.toISOString().split('T')[0],
              isBebas ? `Dibebaskan dari ${jenis.nama}` : null,
            ]
          );

          if (insertResult.rowCount && insertResult.rowCount > 0) {
            if (isBebas) {
              hasil.dibebaskan++;
              hasil.detail.push({ santri_id: santri.id, nama: santri.nama, hasil: 'dibebaskan' });
            } else {
              hasil.berhasil++;
              hasil.detail.push({ santri_id: santri.id, nama: santri.nama, hasil: 'berhasil' });
            }
          } else {
            hasil.sudah_ada++;
            hasil.detail.push({ santri_id: santri.id, nama: santri.nama, hasil: 'sudah_ada' });
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          hasil.errors.push(`${santri.nama} (${jenis.nama}): ${msg}`);
          hasil.detail.push({ santri_id: santri.id, nama: santri.nama, hasil: 'error', pesan: msg });
        }
      }
    }

    // ── Audit log ─────────────────────────────────────────────────────────
    await logAudit({
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

  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
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
export async function catatPembayaran(
  rawBody: unknown,
  userId: number,
  isAdmin: boolean,
  ipAddress?: string
): Promise<Pembayaran> {
  const data: CatatPembayaranRequest = validateCatatPembayaran(rawBody);

  // Validasi tanggal dengan batasan role
  const tanggalBayar = validateTanggalBayar(data.tanggal_bayar, isAdmin);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── Double-submit check (5 detik) ─────────────────────────────────────
    const doubleCheck = await client.query(
      `SELECT id FROM pembayaran
       WHERE santri_id = $1
         AND jenis_iuran_id = $2
         AND nominal = $3
         AND is_void = FALSE
         AND created_at > NOW() - INTERVAL '5 seconds'`,
      [data.santri_id, data.jenis_iuran_id, data.nominal]
    );
    if (doubleCheck.rowCount && doubleCheck.rowCount > 0) {
      throw new ValidationError('Pembayaran duplikat terdeteksi. Tunggu beberapa saat sebelum mencoba lagi.');
    }

    // ── Generate nomor kwitansi ───────────────────────────────────────────
    const noKwitansi = await generateNoKwitansi(client);

    // ── Insert pembayaran ─────────────────────────────────────────────────
    const insertResult = await client.query<{ id: number }>(
      `INSERT INTO pembayaran
         (no_kwitansi, tagihan_id, santri_id, jenis_iuran_id, tahun_ajaran_id,
          nominal, metode_bayar, tanggal_bayar, periode_bulan, periode_tahun,
          dicatat_oleh, keterangan)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id`,
      [
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
      ]
    );
    const pembayaranId = insertResult.rows[0].id;

    // ── Update status tagihan jika ada tagihan_id ─────────────────────────
    if (data.tagihan_id) {
      await updateStatusTagihan(client, data.tagihan_id);
    }

    // ── Audit log ─────────────────────────────────────────────────────────
    await logAudit({
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
    const fullResult = await pool.query<Pembayaran>(
      `SELECT p.*,
              COALESCE(sta.nama, s.nama) AS nama_santri,
              COALESCE(sta.nis, s.nis) AS nis,
              ji.nama AS nama_iuran,
              u.full_name AS nama_bendahara
       FROM pembayaran p
       JOIN santri s ON s.id = p.santri_id
       LEFT JOIN santri_tahun_ajaran sta ON sta.santri_id = s.id AND sta.tahun_ajaran_id = p.tahun_ajaran_id
       JOIN jenis_iuran ji ON ji.id = p.jenis_iuran_id
       LEFT JOIN users u ON u.id = p.dicatat_oleh
       WHERE p.id = $1`,
      [pembayaranId]
    );

    return fullResult.rows[0];

  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ════════════════════════════════════════════════════════════════════════════
// VOID PEMBAYARAN
// ════════════════════════════════════════════════════════════════════════════

export async function voidPembayaran(
  pembayaranId: number,
  voidReason: string,
  userId: number,
  userRole: string,
  ipAddress?: string
): Promise<void> {
  if (!voidReason?.trim()) {
    throw new ValidationError('Alasan pembatalan wajib diisi');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Ambil data pembayaran existing
    const existing = await client.query<{
      id: number; is_void: boolean; tanggal_bayar: Date;
      tagihan_id: number | null; nominal: number; no_kwitansi: string;
    }>(
      `SELECT id, is_void, tanggal_bayar, tagihan_id, nominal, no_kwitansi
       FROM pembayaran WHERE id = $1`,
      [pembayaranId]
    );

    if (!existing.rows.length) {
      throw new ValidationError('Pembayaran tidak ditemukan');
    }

    const pem = existing.rows[0];
    if (pem.is_void) {
      throw new ValidationError('Pembayaran ini sudah dibatalkan sebelumnya');
    }

    // Cek izin void berdasarkan role
    const voidCheck = canVoidPembayaran(userRole, new Date(pem.tanggal_bayar));
    if (!voidCheck.allowed) {
      throw new ValidationError(voidCheck.reason ?? 'Tidak diizinkan void pembayaran ini');
    }

    // Mark as void
    await client.query(
      `UPDATE pembayaran
       SET is_void = TRUE, void_reason = $1, void_oleh = $2, void_at = NOW()
       WHERE id = $3`,
      [voidReason.trim(), userId, pembayaranId]
    );

    // Recalculate status tagihan jika ada
    if (pem.tagihan_id) {
      await updateStatusTagihan(client, pem.tagihan_id);
    }

    // Audit log
    await logAudit({
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

  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ════════════════════════════════════════════════════════════════════════════
// HELPER: Update status tagihan berdasarkan total pembayaran
// ════════════════════════════════════════════════════════════════════════════

export async function updateStatusTagihan(
  client: PoolClient,
  tagihanId: number
): Promise<void> {
  // Ambil nominal tagihan
  const tagihanResult = await client.query<{
    nominal_tagihan: string; nominal_diskon: string; status: StatusTagihan;
  }>(
    `SELECT nominal_tagihan, nominal_diskon, status FROM tagihan WHERE id = $1`,
    [tagihanId]
  );
  if (!tagihanResult.rows.length) return;

  const tagihan = tagihanResult.rows[0];
  if (tagihan.status === 'dibebaskan') return; // Tidak berubah

  const nominalEfektif = Number(tagihan.nominal_tagihan) - Number(tagihan.nominal_diskon);

  // Hitung total pembayaran yang valid (is_void = false)
  const bayarResult = await client.query<{ total: string }>(
    `SELECT COALESCE(SUM(nominal), 0) AS total
     FROM pembayaran
     WHERE tagihan_id = $1 AND is_void = FALSE`,
    [tagihanId]
  );
  const totalDibayar = Number(bayarResult.rows[0].total);

  let newStatus: StatusTagihan;
  if (totalDibayar <= 0) {
    newStatus = 'belum_lunas';
  } else if (totalDibayar >= nominalEfektif) {
    newStatus = 'lunas';
  } else {
    newStatus = 'sebagian';
  }

  await client.query(
    `UPDATE tagihan SET status = $1, updated_at = NOW() WHERE id = $2`,
    [newStatus, tagihanId]
  );
}

/**
 * Generate tagihan Daftar Ulang (massal) untuk semua santri aktif
 * di tahun ajaran tertentu, otomatis memisahkan baru dan lama.
 */
export async function generateTagihanDaftarUlang(
  params: { tahun_ajaran_id: number },
  userId: number,
  ipAddress?: string
): Promise<HasilGenerateTagihan> {
  const { tahun_ajaran_id } = params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Ambil semua jenis iuran daftar ulang (baru dan lama)
    const jenisResult = await client.query<{ id: number; kode: string; nama: string; kategori: string }>(
      `SELECT id, kode, nama, kategori FROM jenis_iuran
       WHERE kategori IN ('daftar_ulang_baru', 'daftar_ulang_lama') AND is_active = TRUE
       ORDER BY urutan`
    );
    const jenisDU = jenisResult.rows;
    if (jenisDU.length === 0) {
      throw new ValidationError('Jenis iuran Daftar Ulang tidak ditemukan. Pastikan data master sudah diinisialisasi.');
    }

    // 2. Ambil tarif iuran default tahunan untuk DU
    const defaultTarifResult = await client.query<{ jenis_iuran_id: number; nominal: string }>(
      `SELECT jenis_iuran_id, nominal FROM tarif_iuran
       WHERE tahun_ajaran_id = $1`,
      [tahun_ajaran_id]
    );
    const tarifMap: Record<number, number> = {};
    for (const t of defaultTarifResult.rows) {
      tarifMap[t.jenis_iuran_id] = Number(t.nominal);
    }

    // 3. Ambil semua santri aktif di tahun ajaran ini
    const santriResult = await client.query<{ id: number; nama: string; nis: string }>(
      `SELECT s.id, COALESCE(sta.nama, s.nama) AS nama, COALESCE(sta.nis, s.nis) AS nis
       FROM santri s
       JOIN santri_tahun_ajaran sta ON sta.santri_id = s.id AND sta.tahun_ajaran_id = $1
       WHERE sta.status IN ('aktif', 'draft', 'tidak_naik')
         AND NOT EXISTS (SELECT 1 FROM alumni a WHERE a.santri_id = s.id)
       ORDER BY COALESCE(sta.nama, s.nama)`,
      [tahun_ajaran_id]
    );
    const santriAktif = santriResult.rows;

    // 4. Ambil semua pengecualian
    const pengecualianResult = await client.query<{ santri_id: number; jenis_iuran_id: number }>(
      `SELECT santri_id, jenis_iuran_id FROM pengecualian_iuran
       WHERE tahun_ajaran_id = $1`,
      [tahun_ajaran_id]
    );
    const pengecualianSet = new Set(
      pengecualianResult.rows.map(r => `${r.santri_id}-${r.jenis_iuran_id}`)
    );

    const hasil: HasilGenerateTagihan = {
      berhasil: 0,
      dibebaskan: 0,
      sudah_ada: 0,
      errors: [],
      detail: [],
    };

    // 5. Generate tagihan per santri
    for (const santri of santriAktif) {
      // Cek apakah santri lama atau baru
      const checkLamaResult = await client.query<{ is_lama: boolean }>(
        `SELECT EXISTS (
           SELECT 1 FROM santri_tahun_ajaran
           WHERE santri_id = $1 AND tahun_ajaran_id < $2
         ) AS is_lama`,
        [santri.id, tahun_ajaran_id]
      );
      const isLama = checkLamaResult.rows[0].is_lama;
      const targetKategori = isLama ? 'daftar_ulang_lama' : 'daftar_ulang_baru';

      // Saring iuran daftar ulang yang cocok dengan status santri
      const targetIuran = jenisDU.filter(j => j.kategori === targetKategori);

      for (const jenis of targetIuran) {
        const rate = tarifMap[jenis.id] ?? 0;
        const isBebas = pengecualianSet.has(`${santri.id}-${jenis.id}`);
        const nominalTagihan = isBebas ? 0 : rate;
        const status: StatusTagihan = isBebas ? 'dibebaskan' : 'belum_lunas';

        try {
          // Check if already exists manually since NULL fields in UNIQUE allow duplicates in Postgres
          const existResult = await client.query<{ id: number }>(
            `SELECT id FROM tagihan
             WHERE santri_id = $1 AND jenis_iuran_id = $2 AND tahun_ajaran_id = $3
               AND periode_bulan IS NULL`,
            [santri.id, jenis.id, tahun_ajaran_id]
          );

          if (existResult.rows.length > 0) {
            hasil.sudah_ada++;
            hasil.detail.push({ santri_id: santri.id, nama: santri.nama, hasil: 'sudah_ada' });
            continue;
          }

          await client.query(
            `INSERT INTO tagihan
               (santri_id, jenis_iuran_id, tahun_ajaran_id,
                periode_bulan, periode_tahun,
                nominal_tagihan, status, tanggal_jatuh_tempo,
                catatan)
             VALUES ($1, $2, $3, NULL, NULL, $4, $5, NULL, $6)`,
            [
              santri.id, jenis.id, tahun_ajaran_id,
              nominalTagihan, status,
              isBebas ? `Dibebaskan dari ${jenis.nama}` : null,
            ]
          );

          if (isBebas) {
            hasil.dibebaskan++;
            hasil.detail.push({ santri_id: santri.id, nama: santri.nama, hasil: 'dibebaskan' });
          } else {
            hasil.berhasil++;
            hasil.detail.push({ santri_id: santri.id, nama: santri.nama, hasil: 'berhasil' });
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          hasil.errors.push(`${santri.nama} (${jenis.nama}): ${msg}`);
          hasil.detail.push({ santri_id: santri.id, nama: santri.nama, hasil: 'error', pesan: msg });
        }
      }
    }

    await logAudit({
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
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Generate tagihan Event (massal) untuk semua santri aktif
 * di tahun ajaran tertentu untuk iuran event spesifik.
 */
export async function generateTagihanEvent(
  params: { tahun_ajaran_id: number; jenis_iuran_id: number },
  userId: number,
  ipAddress?: string
): Promise<HasilGenerateTagihan> {
  const { tahun_ajaran_id, jenis_iuran_id } = params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Ambil data event
    const jenisResult = await client.query<{ id: number; kode: string; nama: string; kategori: string }>(
      `SELECT id, kode, nama, kategori FROM jenis_iuran
       WHERE id = $1 AND kategori = 'event' AND is_active = TRUE`,
      [jenis_iuran_id]
    );
    if (jenisResult.rows.length === 0) {
      throw new ValidationError('Jenis iuran Event tidak ditemukan atau tidak aktif.');
    }
    const jenisEvent = jenisResult.rows[0];

    // 2. Ambil tarif iuran default tahunan untuk Event ini
    const tarifResult = await client.query<{ nominal: string }>(
      `SELECT nominal FROM tarif_iuran
       WHERE jenis_iuran_id = $1 AND tahun_ajaran_id = $2`,
      [jenis_iuran_id, tahun_ajaran_id]
    );
    if (tarifResult.rows.length === 0) {
      throw new ValidationError(`Tarif untuk event ${jenisEvent.nama} belum diset untuk tahun ajaran ini.`);
    }
    const rate = Number(tarifResult.rows[0].nominal);

    // 3. Ambil semua santri aktif di tahun ajaran ini
    const santriResult = await client.query<{ id: number; nama: string; nis: string }>(
      `SELECT s.id, COALESCE(sta.nama, s.nama) AS nama, COALESCE(sta.nis, s.nis) AS nis
       FROM santri s
       JOIN santri_tahun_ajaran sta ON sta.santri_id = s.id AND sta.tahun_ajaran_id = $1
       WHERE sta.status IN ('aktif', 'draft', 'tidak_naik')
         AND NOT EXISTS (SELECT 1 FROM alumni a WHERE a.santri_id = s.id)
       ORDER BY COALESCE(sta.nama, s.nama)`,
      [tahun_ajaran_id]
    );
    const santriAktif = santriResult.rows;

    // 4. Ambil semua pengecualian
    const pengecualianResult = await client.query<{ santri_id: number }>(
      `SELECT santri_id FROM pengecualian_iuran
       WHERE tahun_ajaran_id = $1 AND jenis_iuran_id = $2`,
      [tahun_ajaran_id, jenis_iuran_id]
    );
    const pengecualianSet = new Set(
      pengecualianResult.rows.map(r => r.santri_id)
    );

    const hasil: HasilGenerateTagihan = {
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
      const status: StatusTagihan = isBebas ? 'dibebaskan' : 'belum_lunas';

      try {
        // Check if already exists manually
        const existResult = await client.query<{ id: number }>(
          `SELECT id FROM tagihan
           WHERE santri_id = $1 AND jenis_iuran_id = $2 AND tahun_ajaran_id = $3
             AND periode_bulan IS NULL`,
          [santri.id, jenis_iuran_id, tahun_ajaran_id]
        );

        if (existResult.rows.length > 0) {
          hasil.sudah_ada++;
          hasil.detail.push({ santri_id: santri.id, nama: santri.nama, hasil: 'sudah_ada' });
          continue;
        }

        await client.query(
          `INSERT INTO tagihan
             (santri_id, jenis_iuran_id, tahun_ajaran_id,
              periode_bulan, periode_tahun,
              nominal_tagihan, status, tanggal_jatuh_tempo,
              catatan)
           VALUES ($1, $2, $3, NULL, NULL, $4, $5, NULL, $6)`,
          [
            santri.id, jenis_iuran_id, tahun_ajaran_id,
            nominalTagihan, status,
            isBebas ? `Dibebaskan dari ${jenisEvent.nama}` : null,
          ]
        );

        if (isBebas) {
          hasil.dibebaskan++;
          hasil.detail.push({ santri_id: santri.id, nama: santri.nama, hasil: 'dibebaskan' });
        } else {
          hasil.berhasil++;
          hasil.detail.push({ santri_id: santri.id, nama: santri.nama, hasil: 'berhasil' });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        hasil.errors.push(`${santri.nama} (${jenisEvent.nama}): ${msg}`);
        hasil.detail.push({ santri_id: santri.id, nama: santri.nama, hasil: 'error', pesan: msg });
      }
    }

    await logAudit({
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
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

