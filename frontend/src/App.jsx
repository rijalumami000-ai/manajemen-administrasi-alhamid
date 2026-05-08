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
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const ManajemenNilai = lazy(() => import('./pages/ManajemenNilai').then(m => ({ default: m.ManajemenNilai })));

const RaporPrint = lazy(() => import('./pages/RaporPrint').then(m => ({ default: m.RaporPrint })));
const LaporanMuhafadzoh = lazy(() => import('./pages/LaporanMuhafadzoh').then(m => ({ default: m.LaporanMuhafadzoh })));

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
                    path="/pub/laporan-muhafadzoh" 
                    element={
                      <ProtectedRoute>
                        <LaporanMuhafadzoh />
                      </ProtectedRoute>
                    } 
                  />

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
                     <Route path="profile" element={<Profile />} />
                    <Route path="nilai" element={<ManajemenNilai mode="input" key="input" />} />
                    <Route path="nilai-pengaturan" element={<ManajemenNilai mode="config" key="config" />} />
                    <Route path="nilai-rekap" element={<ManajemenNilai mode="rekap" key="rekap" />} />
                    <Route path="laporan-muhafadzoh" element={<LaporanMuhafadzoh />} />
                  </Route>

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
