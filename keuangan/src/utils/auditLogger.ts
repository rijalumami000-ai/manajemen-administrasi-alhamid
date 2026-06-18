/**
 * auditLogger.ts — Audit trail untuk semua operasi tulis keuangan
 * WAJIB dipanggil dalam PostgreSQL transaction yang sama dengan operasi utama
 */

import { PoolClient } from 'pg';
import { AuditAction } from '../types/keuangan';

interface AuditParams {
  client: PoolClient;
  userId: number;
  action: AuditAction;
  entityType?: string;
  entityId?: number;
  nilaiLama?: Record<string, unknown>;
  nilaiBaru?: Record<string, unknown>;
  keterangan?: string;
  ipAddress?: string;
}

/**
 * Insert audit log dalam transaction yang sama dengan operasi utama.
 * Harus dipanggil SEBELUM COMMIT.
 */
export async function logAudit(params: AuditParams): Promise<void> {
  const {
    client,
    userId,
    action,
    entityType,
    entityId,
    nilaiLama,
    nilaiBaru,
    keterangan,
    ipAddress,
  } = params;

  await client.query(
    `INSERT INTO audit_keuangan
      (user_id, action, entity_type, entity_id, nilai_lama, nilai_baru, keterangan, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      userId,
      action,
      entityType ?? null,
      entityId ?? null,
      nilaiLama ? JSON.stringify(nilaiLama) : null,
      nilaiBaru ? JSON.stringify(nilaiBaru) : null,
      keterangan ?? null,
      ipAddress ?? null,
    ]
  );
}
