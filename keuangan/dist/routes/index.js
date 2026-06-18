"use strict";
/**
 * index.ts — Entry point modul keuangan
 * Di-require oleh server.js utama: registerKeuanganRoutes(app)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerKeuanganRoutes = registerKeuanganRoutes;
const setupRoutes_1 = require("./setupRoutes");
const tagihanRoutes_1 = require("./tagihanRoutes");
const pembayaranRoutes_1 = require("./pembayaranRoutes");
const kasKeluarRoutes_1 = require("./kasKeluarRoutes");
const laporanRoutes_1 = require("./laporanRoutes");
const auditRoutes_1 = require("./auditRoutes");
/**
 * Registrasikan semua route sistem keuangan ke Express app.
 * Dipanggil sekali dari server.js setelah initDatabase().
 *
 * Semua route diawali: /api/keuangan/...
 */
function registerKeuanganRoutes(app) {
    (0, setupRoutes_1.registerSetupRoutes)(app); // Tarif, override bulanan, pengecualian
    (0, tagihanRoutes_1.registerTagihanRoutes)(app); // Tagihan (generate massal + CRUD)
    (0, pembayaranRoutes_1.registerPembayaranRoutes)(app); // Pembayaran + void + kwitansi
    (0, kasKeluarRoutes_1.registerKasKeluarRoutes)(app); // Kas keluar 4 jenis
    (0, laporanRoutes_1.registerLaporanRoutes)(app); // Semua laporan + dashboard
    (0, auditRoutes_1.registerAuditRoutes)(app); // Audit log (admin)
    console.log('✓ Sistem keuangan routes terdaftar (/api/keuangan/*)');
}
module.exports = { registerKeuanganRoutes };
//# sourceMappingURL=index.js.map