import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/common/Toast';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { LoadingState } from './components/common/LoadingState';
import { Layout } from './components/layout/Layout';
import { ConfigProvider, theme } from 'antd';
import antdTheme from './config/theme';
import { useTheme } from './context/ThemeContext';

// Lazy load pages for code splitting
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Santri = lazy(() => import('./pages/Santri').then(m => ({ default: m.Santri })));
const Guru = lazy(() => import('./pages/Guru').then(m => ({ default: m.Guru })));
const Alumni = lazy(() => import('./pages/Alumni').then(m => ({ default: m.Alumni })));
const Kelas = lazy(() => import('./pages/Kelas').then(m => ({ default: m.Kelas })));
const Kamar = lazy(() => import('./pages/Kamar').then(m => ({ default: m.Kamar })));
const PelanggaranPrestasi = lazy(() => import('./pages/PelanggaranPrestasi').then(m => ({ default: m.PelanggaranPrestasi })));
const Users = lazy(() => import('./pages/Users').then(m => ({ default: m.Users })));
const MyMustahiqSettings = lazy(() => import('./pages/MyMustahiqSettings').then(m => ({ default: m.MyMustahiqSettings })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const ManajemenNilai = lazy(() => import('./pages/ManajemenNilai').then(m => ({ default: m.ManajemenNilai })));
const InformasiUjian = lazy(() => import('./pages/InformasiUjian').then(m => ({ default: m.InformasiUjian })));

const RaporPrint = lazy(() => import('./pages/RaporPrint').then(m => ({ default: m.RaporPrint })));
const LaporanUjianKhusus = lazy(() => import('./pages/LaporanUjianKhusus').then(m => ({ default: m.LaporanUjianKhusus })));
const BukuInduk = lazy(() => import('./pages/BukuInduk').then(m => ({ default: m.BukuInduk })));
const KartuUjianSemester = lazy(() => import('./pages/KartuUjianSemester').then(m => ({ default: m.KartuUjianSemester })));
const VerificationPage = lazy(() => import('./pages/VerificationPage').then(m => ({ default: m.VerificationPage })));
const Welcome = lazy(() => import('./pages/Welcome').then(m => ({ default: m.Welcome })));
const QuickLogin = lazy(() => import('./pages/QuickLogin').then(m => ({ default: m.QuickLogin })));
const AbsensiSholat = lazy(() => import('./pages/AbsensiSholat').then(m => ({ default: m.AbsensiSholat })));
const AbsensiSholatScan = lazy(() => import('./pages/AbsensiSholatScan').then(m => ({ default: m.AbsensiSholatScan })));
const RekapAbsensiSholat = lazy(() => import('./pages/RekapAbsensiSholat').then(m => ({ default: m.RekapAbsensiSholat })));
const LembarUjian = lazy(() => import('./pages/LembarUjian').then(m => ({ default: m.LembarUjian })));
const UjianMenu = lazy(() => import('./pages/UjianMenu').then(m => ({ default: m.UjianMenu })));
const ScanNilai = lazy(() => import('./pages/ScanNilai').then(m => ({ default: m.ScanNilai })));
const RadioPlayer = lazy(() => import('./pages/RadioPlayer').then(m => ({ default: m.RadioPlayer })));
const StrukturOrganisasi = lazy(() => import('./pages/StrukturOrganisasi').then(m => ({ default: m.StrukturOrganisasi })));
const JadwalPelajaran = lazy(() => import('./pages/JadwalPelajaran').then(m => ({ default: m.JadwalPelajaran })));
const SilabusPembelajaran = lazy(() => import('./pages/SilabusPembelajaran').then(m => ({ default: m.SilabusPembelajaran })));

// ── Modul Keuangan (lazy loaded) ──────────────────────────────────────────
const KeuanganDashboard = lazy(() => import('./pages/KeuanganDashboard'));
const TagihanSantri = lazy(() => import('./pages/TagihanSantri'));
const LaporanSPP = lazy(() => import('./pages/LaporanSPP'));
const BukuKas = lazy(() => import('./pages/BukuKas'));
const CetakKwitansi = lazy(() => import('./pages/CetakKwitansi'));
const LaporanDaftarUlang = lazy(() => import('./pages/LaporanDaftarUlang'));
const LaporanEvent = lazy(() => import('./pages/LaporanEvent'));
const SetupKeuangan = lazy(() => import('./pages/SetupKeuangan'));
const AuditKeuangan = lazy(() => import('./pages/AuditKeuangan'));



function App() {
  const { isDarkMode } = useTheme();

  return (
    <ConfigProvider 
      theme={{
        ...antdTheme,
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <ErrorBoundary>
        <AuthProvider>
          <ToastProvider>
            <BrowserRouter>
              <Suspense fallback={<LoadingState message="Memuat aplikasi..." />}>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route 
                    path="/rapor-print/:tahun_ajaran_id/:kelas_id/:kategori_id/:santri_id" 
                    element={
                      <ProtectedRoute>
                        <RaporPrint />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/pub/laporan-ujian-khusus" 
                    element={<LaporanUjianKhusus />} 
                  />
                  <Route 
                    path="/verify/:no_peserta" 
                    element={<VerificationPage />} 
                  />
                  <Route 
                    path="/masuk/:key" 
                    element={<QuickLogin />} 
                  />

                  <Route path="/absensi-sholat-scan" element={<AbsensiSholatScan />} />

                  <Route path="/" element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }>
                    <Route index element={<Dashboard />} />
                    <Route path="santri" element={<Santri />} />
                    <Route path="guru" element={<Guru />} />
                    <Route path="alumni" element={<Alumni />} />
                    <Route path="kelas" element={<Kelas />} />
                    <Route path="kamar" element={<Kamar />} />
                    <Route path="pelanggaran-prestasi" element={<PelanggaranPrestasi />} />
                    <Route path="users" element={<Users />} />
                    <Route path="mymustahiq-settings" element={<MyMustahiqSettings />} />
                     <Route path="profile" element={<Profile />} />
                    <Route path="nilai" element={<ManajemenNilai mode="input" key="input" />} />
                    <Route path="input-nilai-ujian" element={<ManajemenNilai mode="input-ujian" key="input-ujian" />} />
                    <Route path="nilai-pengaturan" element={<ManajemenNilai mode="config" key="config" />} />
                    <Route path="informasi-ujian" element={<InformasiUjian />} />
                    <Route path="nilai-rekap" element={<ManajemenNilai mode="rekap" key="rekap" />} />
                    <Route path="laporan-ujian-khusus" element={<LaporanUjianKhusus />} />
                    <Route path="welcome" element={<Welcome />} />
                    <Route path="buku-induk" element={<BukuInduk />} />
                    <Route path="kartu-ujian-semester" element={<KartuUjianSemester />} />
                    <Route path="absensi-sholat" element={<AbsensiSholat />} />
                    <Route path="rekap-absensi-sholat" element={<RekapAbsensiSholat />} />
                    <Route path="lembar-ujian" element={<LembarUjian />} />
                    <Route path="ujian" element={<UjianMenu />} />
                    <Route path="scan-nilai" element={<ScanNilai />} />
                    <Route path="radio" element={<RadioPlayer />} />
                    <Route path="struktur-organisasi" element={<StrukturOrganisasi />} />
                    <Route path="jadwal-pelajaran" element={<JadwalPelajaran />} />
                    <Route path="silabus-pembelajaran" element={<SilabusPembelajaran />} />

                    {/* ── Keuangan ─────────────────────────────────────── */}
                    <Route path="keuangan" element={<KeuanganDashboard />} />
                    <Route path="keuangan/tagihan" element={<TagihanSantri />} />
                    <Route path="keuangan/laporan/spp" element={<LaporanSPP />} />
                    <Route path="keuangan/laporan/daftar-ulang" element={<LaporanDaftarUlang />} />
                    <Route path="keuangan/laporan/event" element={<LaporanEvent />} />
                    <Route path="keuangan/kas" element={<BukuKas />} />
                    <Route path="keuangan/setup" element={<SetupKeuangan />} />
                    <Route path="keuangan/audit" element={<AuditKeuangan />} />
                  </Route>

                  {/* Kwitansi: tab baru, luar Layout */}
                  <Route path="/keuangan/kwitansi/:id" element={
                    <ProtectedRoute>
                      <CetakKwitansi />
                    </ProtectedRoute>
                  } />

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </ToastProvider>
        </AuthProvider>
      </ErrorBoundary>
    </ConfigProvider>
  );
}

export default App;
