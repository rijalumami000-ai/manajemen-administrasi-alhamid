/**
 * index.ts — Entry point modul keuangan
 * Di-require oleh server.js utama: registerKeuanganRoutes(app)
 */
import { Application } from 'express';
/**
 * Registrasikan semua route sistem keuangan ke Express app.
 * Dipanggil sekali dari server.js setelah initDatabase().
 *
 * Semua route diawali: /api/keuangan/...
 */
export declare function registerKeuanganRoutes(app: Application): void;
