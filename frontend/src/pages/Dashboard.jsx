import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  School,
  Award,
  Calendar,
  BookOpen,
  ShieldAlert,
  Clock,
  Radio,
  FileText,
  Home,
  CheckSquare,
  ArrowRight,
  TrendingUp,
  Server
} from 'lucide-react';
import { StatCard, LoadingState, ErrorState } from '../components/common';
import { santriService } from '../services/santriService';
import './Dashboard.scss';

export function Dashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState({
    santri: 0,
    guru: 0,
    alumni: 0,
    kelas: 0
  });
  const [activeYear, setActiveYear] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [time, setTime] = useState(new Date());

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hours = time.getHours();
    if (hours < 11) return 'Selamat Pagi';
    if (hours < 15) return 'Selamat Siang';
    if (hours < 19) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch summary statistics
      const summaryRes = await fetch('/api/summary', {
        credentials: 'include'
      });
      let summaryData = { santri: 0, guru: 0, alumni: 0, kelas: 0 };
      if (summaryRes.ok) {
        summaryData = await summaryRes.json();
        setSummary(summaryData);
      } else {
        throw new Error('Gagal mengambil ringkasan data');
      }

      // Fetch academic years to find active one
      try {
        const years = await santriService.fetchTahunAjaran();
        const active = years.find(y => y.is_active);
        setActiveYear(active || null);
      } catch (yearErr) {
        console.error('Gagal mengambil tahun ajaran:', yearErr);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (error) {
    return (
      <ErrorState
        title="Gagal Memuat Data Dashboard"
        subtitle="Terjadi kesalahan saat mengambil data ringkasan dan statistik"
        showRetry
        onRetry={fetchDashboardData}
      />
    );
  }

  // Format date indonesian
  const formatIndoDate = (date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const quickActions = [
    {
      title: 'Input Rapor',
      desc: 'Masukkan nilai rapor santri per kelas',
      icon: <BookOpen size={20} />,
      path: '/nilai',
      color: 'blue'
    },
    {
      title: 'Absensi Sholat',
      desc: 'Kelola absensi sholat jamaah santri',
      icon: <CheckSquare size={20} />,
      path: '/absensi-sholat',
      color: 'green'
    },
    {
      title: 'Manajemen Kamar',
      desc: 'Atur kamar asrama & kapasitas santri',
      icon: <Home size={20} />,
      path: '/kamar',
      color: 'indigo'
    },
    {
      title: 'Buku Induk',
      desc: 'Cetak dan lihat buku induk lengkap',
      icon: <FileText size={20} />,
      path: '/buku-induk',
      color: 'purple'
    },
    {
      title: 'Pelanggaran & Prestasi',
      desc: 'Catat rekam jejak kedisiplinan santri',
      icon: <ShieldAlert size={20} />,
      path: '/pelanggaran-prestasi',
      color: 'orange'
    },
    {
      title: 'Radio Pesantren',
      desc: 'Streaming musik dan kajian islami',
      icon: <Radio size={20} />,
      path: '/radio',
      color: 'pink'
    }
  ];

  return (
    <div className="premium-dashboard">
      {/* Header Row */}
      <div className="dashboard-header-container">
        <div className="dashboard-greetings">
          <h1 className="welcome-title">{getGreeting()}, Admin 👋</h1>
          <p className="welcome-subtitle">Sistem Informasi Akademik dan Administrasi Pesantren Al-Hamid</p>
        </div>
        {activeYear && (
          <div className="active-year-capsule">
            <Calendar size={14} className="calendar-icon" />
            <span>Tahun Ajaran: <strong>{activeYear.kode} (Berjalan)</strong></span>
          </div>
        )}
      </div>

      {loading ? (
        <LoadingState message="Menyusun data dashboard..." />
      ) : (
        <div className="dashboard-main-layout">
          {/* Top Statistics Cards */}
          <div className="stats-grid">
            <StatCard
              title="Total Santri Aktif"
              value={summary.santri || 0}
              icon={<Users size={20} />}
              iconColor="#3b82f6"
              onClick={() => navigate('/santri')}
            />
            <StatCard
              title="Total Guru & Staf"
              value={summary.guru || 0}
              icon={<Award size={20} />}
              iconColor="#10b981"
              onClick={() => navigate('/guru')}
            />
            <StatCard
              title="Total Alumni & Pindah"
              value={summary.alumni || 0}
              icon={<GraduationCap size={20} />}
              iconColor="#f59e0b"
              onClick={() => navigate('/alumni')}
            />
            <StatCard
              title="Total Kelas"
              value={summary.kelas || 0}
              icon={<School size={20} />}
              iconColor="#a855f7"
              onClick={() => navigate('/kelas')}
            />
          </div>

          <div className="dashboard-two-columns">
            {/* Left Column */}
            <div className="column-left">
              {/* Welcome Hero Banner */}
              <div className="welcome-hero-card">
                <div className="card-mesh"></div>
                <div className="hero-content">
                  <div className="hero-badge">Portal Pusat Data</div>
                  <h2>Pusat Kontrol & Administrasi Pesantren</h2>
                  <p>
                    Kelola dan pantau seluruh aktivitas santri secara realtime. 
                    Mulai dari data master, pengelolaan kamar asrama, kedisiplinan, 
                    hingga rekapitulasi nilai rapor diniyah dan sekolah dari satu platform terintegrasi.
                  </p>
                  <button className="hero-cta-btn" onClick={() => navigate('/santri')}>
                    <span>Kelola Data Santri</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {/* Quick Actions Grid */}
              <div className="quick-actions-section">
                <h3 className="section-title">
                  <TrendingUp size={16} /> Akses Cepat Layanan
                </h3>
                <div className="actions-grid">
                  {quickActions.map((action, idx) => (
                    <div
                      key={idx}
                      className={`action-card color-${action.color}`}
                      onClick={() => navigate(action.path)}
                    >
                      <div className="action-glow"></div>
                      <div className="action-icon-wrapper">
                        {action.icon}
                      </div>
                      <div className="action-details">
                        <h4>{action.title}</h4>
                        <p>{action.desc}</p>
                      </div>
                      <div className="action-arrow">
                        <ArrowRight size={14} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="column-right">
              {/* Clock & Status */}
              <div className="time-status-card">
                <div className="card-header-row">
                  <Clock size={16} className="clock-icon" />
                  <h4>Waktu & Status Sistem</h4>
                </div>
                <div className="time-display">{formatTime(time)}</div>
                <div className="date-display">{formatIndoDate(time)}</div>
                
                <div className="system-status-indicator">
                  <div className="indicator-row">
                    <Server size={14} className="icon-green" />
                    <span>Server Database</span>
                    <span className="status-badge online">Terhubung</span>
                  </div>
                  <div className="indicator-row">
                    <Users size={14} className="icon-blue" />
                    <span>Sesi Pengguna</span>
                    <span className="status-badge user-role">Administrator</span>
                  </div>
                </div>
              </div>

              {/* Pesantren Info Card */}
              <div className="pesantren-quote-card">
                <div className="quote-tag">Nilai Luhur</div>
                <blockquote>
                  "Menuntut ilmu adalah taqwa. Menyampaikannya adalah ibadah. Mengulangnya adalah tasbih. Mencarinya adalah jihad."
                </blockquote>
                <cite>— Imam Al-Ghazali</cite>
              </div>

              {/* Stats Shortcut Summary */}
              <div className="summary-list-card">
                <h4>Informasi Ringkas</h4>
                <div className="summary-item">
                  <span className="item-label">Tahun Ajaran</span>
                  <span className="item-value highlight">{activeYear ? activeYear.kode : '-'}</span>
                </div>
                <div className="summary-item">
                  <span className="item-label">Status Akademik</span>
                  <span className="item-value green">Aktif / Berjalan</span>
                </div>
                <div className="summary-item">
                  <span className="item-label">Lokasi Sistem</span>
                  <span className="item-value">Internal Server</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
