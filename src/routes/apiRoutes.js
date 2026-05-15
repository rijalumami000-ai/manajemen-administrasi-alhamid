const registerSummaryRoutes = require('./summaryRoutes');
const registerTahunAjaranRoutes = require('./tahunAjaranRoutes');
const registerKelasRoutes = require('./kelasRoutes');
const registerOrangtuaRoutes = require('./orangtuaRoutes');
const registerMataPelajaranRoutes = require('./mataPelajaranRoutes');
const registerJabatanRoutes = require('./jabatanRoutes');
const registerSantriRoutes = require('./santriRoutes');
const registerGuruRoutes = require('./guruRoutes');
const registerKamarRoutes = require('./kamarRoutes');
const registerPelanggaranRoutes = require('./pelanggaranRoutes');
const registerPrestasiRoutes = require('./prestasiRoutes');
const registerAlumniRoutes = require('./alumniRoutes');
const registerAuthRoutes = require('./authRoutes');
const registerUserRoutes = require('./userRoutes');
const registerProfileRoutes = require('./profileRoutes');
const registerNilaiRoutes = require('./nilaiRoutes');
const registerSettingsRoutes = require('./settingsRoutes');
const registerBukuIndukRoutes = require('./bukuIndukRoutes');
const registerPesertaUjianRoutes = require('./pesertaUjianRoutes');
const registerAbsensiSholatRoutes = require('./absensiSholatRoutes');
const registerLembarUjianRoutes = require('./lembarUjianRoutes');

function registerApiRoutes(app) {
  // Authentication routes (public)
  registerAuthRoutes(app);

  // Profile routes (authenticated users)
  registerProfileRoutes(app);

  // User management routes (admin only)
  registerUserRoutes(app);

  // Other API routes
  registerSummaryRoutes(app);
  registerTahunAjaranRoutes(app);
  registerKelasRoutes(app);
  registerOrangtuaRoutes(app);
  registerMataPelajaranRoutes(app);
  registerJabatanRoutes(app);
  registerSantriRoutes(app);
  registerGuruRoutes(app);
  registerKamarRoutes(app);
  registerPelanggaranRoutes(app);
  registerPrestasiRoutes(app);
  registerAlumniRoutes(app);
  registerNilaiRoutes(app);
  registerSettingsRoutes(app);
  registerBukuIndukRoutes(app);
  registerPesertaUjianRoutes(app);
  registerAbsensiSholatRoutes(app);
  registerLembarUjianRoutes(app);
}

module.exports = registerApiRoutes;
