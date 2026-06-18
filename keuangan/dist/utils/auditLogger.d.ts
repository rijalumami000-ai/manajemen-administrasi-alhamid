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
export declare function logAudit(params: AuditParams): Promise<void>;
export {};
