"use strict";
/**
 * roleGuard.ts — Middleware otorisasi untuk sistem keuangan
 * Selalu digunakan bersama authenticateToken dari middleware utama
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireKeuangan = requireKeuangan;
exports.requireAdminKeuangan = requireAdminKeuangan;
exports.requireLaporanKeuangan = requireLaporanKeuangan;
exports.canVoidPembayaran = canVoidPembayaran;
/**
 * Guard: hanya admin dan bendahara yang bisa akses modul keuangan.
 * Digunakan untuk hampir semua route keuangan kecuali laporan read-only.
 */
function requireKeuangan(req, res, next) {
    if (!req.user) {
        res.status(401).json({ error: 'Autentikasi diperlukan. Silakan login.' });
        return;
    }
    const allowed = ['admin', 'bendahara'];
    if (!allowed.includes(req.user.role)) {
        res.status(403).json({
            error: 'Akses ditolak. Hanya bendahara dan admin yang dapat mengakses fitur keuangan.',
            role_kamu: req.user.role,
        });
        return;
    }
    next();
}
/**
 * Guard: hanya admin yang bisa mengubah setup (tarif, pengecualian, iuran master).
 */
function requireAdminKeuangan(req, res, next) {
    if (!req.user) {
        res.status(401).json({ error: 'Autentikasi diperlukan.' });
        return;
    }
    if (req.user.role !== 'admin') {
        res.status(403).json({
            error: 'Akses ditolak. Hanya admin yang dapat mengubah pengaturan keuangan.',
        });
        return;
    }
    next();
}
/**
 * Guard: laporan boleh diakses admin, bendahara, dan staff (read-only).
 */
function requireLaporanKeuangan(req, res, next) {
    if (!req.user) {
        res.status(401).json({ error: 'Autentikasi diperlukan.' });
        return;
    }
    const allowed = ['admin', 'bendahara'];
    if (!allowed.includes(req.user.role)) {
        res.status(403).json({
            error: 'Akses ditolak untuk laporan keuangan.',
        });
        return;
    }
    next();
}
/**
 * Guard void pembayaran: bendahara hanya bisa void pembayaran hari ini.
 * Admin bisa void kapan saja.
 * Dicek di dalam handler (bukan middleware), tapi helper ini tersedia.
 */
function canVoidPembayaran(userRole, tanggalBayar) {
    if (userRole === 'admin')
        return { allowed: true };
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tglBayar = new Date(tanggalBayar.getFullYear(), tanggalBayar.getMonth(), tanggalBayar.getDate());
    if (tglBayar < today) {
        return {
            allowed: false,
            reason: 'Bendahara hanya dapat membatalkan pembayaran yang dicatat hari ini. Hubungi admin untuk pembatalan historis.',
        };
    }
    return { allowed: true };
}
//# sourceMappingURL=roleGuard.js.map