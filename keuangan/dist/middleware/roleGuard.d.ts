/**
 * roleGuard.ts — Middleware otorisasi untuk sistem keuangan
 * Selalu digunakan bersama authenticateToken dari middleware utama
 */
import { Request, Response, NextFunction } from 'express';
declare module 'express-serve-static-core' {
    interface Request {
        user?: {
            id: number;
            username: string;
            role: string;
            full_name: string;
        };
    }
}
/**
 * Guard: hanya admin dan bendahara yang bisa akses modul keuangan.
 * Digunakan untuk hampir semua route keuangan kecuali laporan read-only.
 */
export declare function requireKeuangan(req: Request, res: Response, next: NextFunction): void;
/**
 * Guard: hanya admin yang bisa mengubah setup (tarif, pengecualian, iuran master).
 */
export declare function requireAdminKeuangan(req: Request, res: Response, next: NextFunction): void;
/**
 * Guard: laporan boleh diakses admin, bendahara, dan staff (read-only).
 */
export declare function requireLaporanKeuangan(req: Request, res: Response, next: NextFunction): void;
/**
 * Guard void pembayaran: bendahara hanya bisa void pembayaran hari ini.
 * Admin bisa void kapan saja.
 * Dicek di dalam handler (bukan middleware), tapi helper ini tersedia.
 */
export declare function canVoidPembayaran(userRole: string, tanggalBayar: Date): {
    allowed: boolean;
    reason?: string;
};
