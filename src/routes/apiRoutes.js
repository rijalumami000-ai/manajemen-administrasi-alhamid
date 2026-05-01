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

function registerApiRoutes(app) {
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
}

module.exports = registerApiRoutes;
