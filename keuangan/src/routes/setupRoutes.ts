/**
 * setupRoutes.ts — Pengaturan tarif iuran, override bulanan, dan pengecualian SPP
 * Akses: admin-only untuk write, keuangan (admin+bendahara) untuk read
 */

import { Application, Request, Response } from 'express';
import { pool } from '../db';
import { logAudit } from '../utils/auditLogger';
import {
  validatePositiveInt,
  validateNominalNonNegative,
  validateBulan,
  validateTahun,
  ValidationError,
} from '../utils/validators';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { authenticateToken } = require('../../../src/middleware/authMiddleware');
import {
  requireKeuangan,
  requireAdminKeuangan,
} from '../middleware/roleGuard';

export function registerSetupRoutes(app: Application): void {

  // ════════════════════════════════════════════════════════════
  // JENIS IURAN (read-only dari luar, diisi saat init)
  // ════════════════════════════════════════════════════════════

  // GET /api/keuangan/jenis-iuran — Semua jenis iuran aktif
  app.get('/api/keuangan/jenis-iuran', authenticateToken, requireKeuangan,
    async (_req: Request, res: Response) => {
      try {
        const result = await pool.query(
          `SELECT id, kode, nama, kategori, deskripsi, urutan, is_active
           FROM jenis_iuran ORDER BY kategori, urutan`
        );
        return res.json(result.rows);
      } catch (err) {
        console.error('GET /api/keuangan/jenis-iuran error:', err);
        return res.status(500).json({ error: 'Gagal memuat daftar jenis iuran.' });
      }
    }
  );

  // ════════════════════════════════════════════════════════════
  // TARIF IURAN (default per tahun ajaran)
  // ════════════════════════════════════════════════════════════

  // GET /api/keuangan/tarif?tahun_ajaran_id=1 — Tarif untuk tahun ajaran tertentu
  app.get('/api/keuangan/tarif', authenticateToken, requireKeuangan,
    async (req: Request, res: Response) => {
      try {
        const tahunAjaranId = validatePositiveInt(req.query.tahun_ajaran_id, 'tahun_ajaran_id');
        const result = await pool.query(
          `SELECT ti.*, ji.kode AS kode_iuran, ji.nama AS nama_iuran, ji.kategori
           FROM tarif_iuran ti
           JOIN jenis_iuran ji ON ji.id = ti.jenis_iuran_id
           WHERE ti.tahun_ajaran_id = $1
           ORDER BY ji.kategori, ji.urutan`,
          [tahunAjaranId]
        );
        return res.json(result.rows);
      } catch (err) {
        if (err instanceof ValidationError) return res.status(400).json({ error: err.message });
        console.error('GET /api/keuangan/tarif error:', err);
        return res.status(500).json({ error: 'Gagal memuat tarif.' });
      }
    }
  );

  // POST /api/keuangan/tarif — Set/update tarif (upsert)
  app.post('/api/keuangan/tarif', authenticateToken, requireAdminKeuangan,
    async (req: Request, res: Response) => {
      try {
        const { jenis_iuran_id, tahun_ajaran_id, nominal, keterangan } = req.body;
        const jenisId = validatePositiveInt(jenis_iuran_id, 'jenis_iuran_id');
        const taId = validatePositiveInt(tahun_ajaran_id, 'tahun_ajaran_id');
        const nom = validateNominalNonNegative(nominal);

        const client = await pool.connect();
        try {
          await client.query('BEGIN');

          // Ambil nilai lama untuk audit
          const oldResult = await client.query(
            `SELECT nominal FROM tarif_iuran WHERE jenis_iuran_id=$1 AND tahun_ajaran_id=$2`,
            [jenisId, taId]
          );

          const result = await client.query(
            `INSERT INTO tarif_iuran (jenis_iuran_id, tahun_ajaran_id, nominal, keterangan)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (jenis_iuran_id, tahun_ajaran_id)
               DO UPDATE SET nominal=$3, keterangan=$4, updated_at=NOW()
             RETURNING *`,
            [jenisId, taId, nom, keterangan ?? null]
          );

          await logAudit({
            client, userId: req.user!.id, action: 'SET_TARIF',
            entityType: 'tarif_iuran', entityId: result.rows[0].id,
            nilaiLama: oldResult.rows[0] ?? null,
            nilaiBaru: { nominal: nom, keterangan },
            ipAddress: req.ip,
          });

          await client.query('COMMIT');
          return res.status(201).json(result.rows[0]);
        } catch (e) {
          await client.query('ROLLBACK');
          throw e;
        } finally {
          client.release();
        }
      } catch (err) {
        if (err instanceof ValidationError) return res.status(400).json({ error: err.message });
        console.error('POST /api/keuangan/tarif error:', err);
        return res.status(500).json({ error: 'Gagal menyimpan tarif.' });
      }
    }
  );

  // ════════════════════════════════════════════════════════════
  // TARIF BULANAN (override per bulan)
  // ════════════════════════════════════════════════════════════

  // GET /api/keuangan/tarif-bulanan?tahun_ajaran_id=1
  app.get('/api/keuangan/tarif-bulanan', authenticateToken, requireKeuangan,
    async (req: Request, res: Response) => {
      try {
        const taId = validatePositiveInt(req.query.tahun_ajaran_id, 'tahun_ajaran_id');
        const result = await pool.query(
          `SELECT tib.*, ji.kode AS kode_iuran, ji.nama AS nama_iuran
           FROM tarif_iuran_bulanan tib
           JOIN jenis_iuran ji ON ji.id = tib.jenis_iuran_id
           WHERE tib.tahun_ajaran_id = $1
           ORDER BY tib.tahun_kalender, tib.bulan`,
          [taId]
        );
        return res.json(result.rows);
      } catch (err) {
        if (err instanceof ValidationError) return res.status(400).json({ error: err.message });
        return res.status(500).json({ error: 'Gagal memuat tarif bulanan.' });
      }
    }
  );

  // POST /api/keuangan/tarif-bulanan — Tambah/update override
  app.post('/api/keuangan/tarif-bulanan', authenticateToken, requireAdminKeuangan,
    async (req: Request, res: Response) => {
      try {
        const b = req.body;
        const jenisId = validatePositiveInt(b.jenis_iuran_id, 'jenis_iuran_id');
        const taId = validatePositiveInt(b.tahun_ajaran_id, 'tahun_ajaran_id');
        const bulan = validateBulan(b.bulan);
        const tahun = validateTahun(b.tahun_kalender);
        const nom = validateNominalNonNegative(b.nominal);

        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const result = await client.query(
            `INSERT INTO tarif_iuran_bulanan
               (jenis_iuran_id, tahun_ajaran_id, bulan, tahun_kalender, nominal, keterangan)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (jenis_iuran_id, tahun_ajaran_id, bulan, tahun_kalender)
               DO UPDATE SET nominal=$5, keterangan=$6
             RETURNING *`,
            [jenisId, taId, bulan, tahun, nom, b.keterangan ?? null]
          );
          await logAudit({
            client, userId: req.user!.id, action: 'SET_TARIF_BULANAN',
            entityType: 'tarif_iuran_bulanan', entityId: result.rows[0].id,
            nilaiBaru: { bulan, tahun_kalender: tahun, nominal: nom },
            keterangan: b.keterangan,
            ipAddress: req.ip,
          });
          await client.query('COMMIT');
          return res.status(201).json(result.rows[0]);
        } catch (e) {
          await client.query('ROLLBACK');
          throw e;
        } finally {
          client.release();
        }
      } catch (err) {
        if (err instanceof ValidationError) return res.status(400).json({ error: err.message });
        return res.status(500).json({ error: 'Gagal menyimpan override tarif bulanan.' });
      }
    }
  );

  // DELETE /api/keuangan/tarif-bulanan/:id
  app.delete('/api/keuangan/tarif-bulanan/:id', authenticateToken, requireAdminKeuangan,
    async (req: Request, res: Response) => {
      try {
        const id = validatePositiveInt(req.params.id, 'id');
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const old = await client.query(
            `DELETE FROM tarif_iuran_bulanan WHERE id=$1 RETURNING *`, [id]
          );
          if (!old.rowCount) return res.status(404).json({ error: 'Data tidak ditemukan.' });
          await logAudit({
            client, userId: req.user!.id, action: 'DELETE_TARIF_BULANAN',
            entityType: 'tarif_iuran_bulanan', entityId: id,
            nilaiLama: old.rows[0],
            ipAddress: req.ip,
          });
          await client.query('COMMIT');
          return res.json({ message: 'Override tarif bulanan berhasil dihapus.' });
        } catch (e) {
          await client.query('ROLLBACK');
          throw e;
        } finally {
          client.release();
        }
      } catch (err) {
        if (err instanceof ValidationError) return res.status(400).json({ error: err.message });
        return res.status(500).json({ error: 'Gagal menghapus override tarif.' });
      }
    }
  );

  // ════════════════════════════════════════════════════════════
  // PENGECUALIAN IURAN (Free SPP)
  // ════════════════════════════════════════════════════════════

  // GET /api/keuangan/pengecualian?tahun_ajaran_id=1
  app.get('/api/keuangan/pengecualian', authenticateToken, requireKeuangan,
    async (req: Request, res: Response) => {
      try {
        const taId = validatePositiveInt(req.query.tahun_ajaran_id, 'tahun_ajaran_id');
        const result = await pool.query(
          `SELECT pi.*,
                  COALESCE(sta.nama, s.nama) AS nama_santri,
                  COALESCE(sta.nis, s.nis) AS nis,
                  ji.nama AS nama_iuran, ji.kode AS kode_iuran,
                  u.full_name AS nama_pencatat
           FROM pengecualian_iuran pi
           JOIN santri s ON s.id = pi.santri_id
           LEFT JOIN santri_tahun_ajaran sta
             ON sta.santri_id = s.id AND sta.tahun_ajaran_id = pi.tahun_ajaran_id
           JOIN jenis_iuran ji ON ji.id = pi.jenis_iuran_id
           LEFT JOIN users u ON u.id = pi.dicatat_oleh
           WHERE pi.tahun_ajaran_id = $1
           ORDER BY COALESCE(sta.nama, s.nama), ji.urutan`,
          [taId]
        );
        return res.json(result.rows);
      } catch (err) {
        if (err instanceof ValidationError) return res.status(400).json({ error: err.message });
        return res.status(500).json({ error: 'Gagal memuat daftar pengecualian.' });
      }
    }
  );

  // POST /api/keuangan/pengecualian — Tambah pengecualian (admin only)
  app.post('/api/keuangan/pengecualian', authenticateToken, requireAdminKeuangan,
    async (req: Request, res: Response) => {
      try {
        const { santri_id, jenis_iuran_id, tahun_ajaran_id, alasan } = req.body;
        const santriId = validatePositiveInt(santri_id, 'santri_id');
        const jenisId = validatePositiveInt(jenis_iuran_id, 'jenis_iuran_id');
        const taId = validatePositiveInt(tahun_ajaran_id, 'tahun_ajaran_id');

        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const result = await client.query(
            `INSERT INTO pengecualian_iuran
               (santri_id, jenis_iuran_id, tahun_ajaran_id, alasan, dicatat_oleh)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (santri_id, jenis_iuran_id, tahun_ajaran_id) DO NOTHING
             RETURNING *`,
            [santriId, jenisId, taId, alasan ?? null, req.user!.id]
          );
          if (!result.rowCount) {
            return res.status(409).json({ error: 'Pengecualian untuk santri dan iuran ini sudah ada.' });
          }
          await logAudit({
            client, userId: req.user!.id, action: 'SET_PENGECUALIAN',
            entityType: 'pengecualian_iuran', entityId: result.rows[0].id,
            nilaiBaru: { santri_id: santriId, jenis_iuran_id: jenisId, alasan },
            ipAddress: req.ip,
          });
          await client.query('COMMIT');
          return res.status(201).json(result.rows[0]);
        } catch (e) {
          await client.query('ROLLBACK');
          throw e;
        } finally {
          client.release();
        }
      } catch (err) {
        if (err instanceof ValidationError) return res.status(400).json({ error: err.message });
        return res.status(500).json({ error: 'Gagal menambah pengecualian.' });
      }
    }
  );

  // DELETE /api/keuangan/pengecualian/:id — Cabut pengecualian
  app.delete('/api/keuangan/pengecualian/:id', authenticateToken, requireAdminKeuangan,
    async (req: Request, res: Response) => {
      try {
        const id = validatePositiveInt(req.params.id, 'id');
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const old = await client.query(
            `DELETE FROM pengecualian_iuran WHERE id=$1 RETURNING *`, [id]
          );
          if (!old.rowCount) return res.status(404).json({ error: 'Pengecualian tidak ditemukan.' });
          await logAudit({
            client, userId: req.user!.id, action: 'CABUT_PENGECUALIAN',
            entityType: 'pengecualian_iuran', entityId: id,
            nilaiLama: old.rows[0],
            ipAddress: req.ip,
          });
          await client.query('COMMIT');
          return res.json({ message: 'Pengecualian berhasil dicabut.' });
        } catch (e) {
          await client.query('ROLLBACK');
          throw e;
        } finally {
          client.release();
        }
      } catch (err) {
        if (err instanceof ValidationError) return res.status(400).json({ error: err.message });
        return res.status(500).json({ error: 'Gagal mencabut pengecualian.' });
      }
    }
  );
}
