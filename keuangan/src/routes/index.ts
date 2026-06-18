/**
 * index.ts — Entry point modul keuangan
 * Di-require oleh server.js utama: registerKeuanganRoutes(app)
 */

import { Application } from 'express';
import { registerSetupRoutes } from './setupRoutes';
import { registerTagihanRoutes } from './tagihanRoutes';
import { registerPembayaranRoutes } from './pembayaranRoutes';
import { registerKasKeluarRoutes } from './kasKeluarRoutes';
import { registerLaporanRoutes } from './laporanRoutes';
import { registerAuditRoutes } from './auditRoutes';

/**
 * Registrasikan semua route sistem keuangan ke Express app.
 * Dipanggil sekali dari server.js setelah initDatabase().
 *
 * Semua route diawali: /api/keuangan/...
 */
export function registerKeuanganRoutes(app: Application): void {
  registerSetupRoutes(app);      // Tarif, override bulanan, pengecualian
  registerTagihanRoutes(app);    // Tagihan (generate massal + CRUD)
  registerPembayaranRoutes(app); // Pembayaran + void + kwitansi
  registerKasKeluarRoutes(app);  // Kas keluar 4 jenis
  registerLaporanRoutes(app);    // Semua laporan + dashboard
  registerAuditRoutes(app);      // Audit log (admin)

  console.log('✓ Sistem keuangan routes terdaftar (/api/keuangan/*)');
}

module.exports = { registerKeuanganRoutes };
