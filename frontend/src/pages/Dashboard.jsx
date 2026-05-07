import { useState, useEffect, useCallback } from 'react';
import {
  TeamOutlined,
  UserOutlined,
  BookOutlined,
  TrophyOutlined,
  RiseOutlined
} from '@ant-design/icons';
import { StatCard, LoadingState, ErrorState } from '../components/common';
import './Dashboard.scss';

export function Dashboard() {
  const [summary, setSummary] = useState({
    santri: 0,
    guru: 0,
    alumni: 0,
    kelas: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/summary', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setSummary(data);
      } else {
        throw new Error('Failed to fetch summary');
      }
    } catch (error) {
      console.error('Failed to fetch summary', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  if (error) {
    return (
      <ErrorState
        title="Gagal Memuat Data"
        subtitle="Terjadi kesalahan saat memuat ringkasan data"
        showRetry
        onRetry={fetchSummary}
      />
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1 className="page-title">Overview</h1>
        <p className="page-subtitle">Growth reporting and management of your pesantren</p>
      </div>

      {loading ? (
        <LoadingState tip="Memuat data..." />
      ) : (
        <div className="dashboard-content">
          <div className="stats-grid">
            <StatCard
              title="Total Santri"
              value={summary.santri || 0}
              icon={<TeamOutlined />}
              iconColor="#2F81F7"
              trend={5.2}
              trendText="vs last month"
            />
            <StatCard
              title="Total Guru"
              value={summary.guru || 0}
              icon={<UserOutlined />}
              iconColor="#00E676"
              trend={2.1}
              trendText="vs last month"
            />
            <StatCard
              title="Total Alumni"
              value={summary.alumni || 0}
              icon={<RiseOutlined />}
              iconColor="#FF3D00"
              trend={8.5}
              trendText="vs last month"
            />
            <StatCard
              title="Total Kelas"
              value={summary.kelas || 0}
              icon={<BookOutlined />}
              iconColor="#8A2BE2"
            />
          </div>

          <div className="welcome-section">
            <div className="welcome-card">
              <div className="welcome-header">
                <h2>Selamat Datang di SI Internal</h2>
                <p>Sistem informasi manajemen data santri, guru, dan alumni pesantren. Kelola data dengan mudah dan efisien.</p>
              </div>

              <div className="feature-grid">
                <div className="feature-card">
                  <div className="feature-icon" style={{color: '#2F81F7'}}>
                    <TeamOutlined />
                  </div>
                  <div className="feature-info">
                    <h4>Manajemen Santri</h4>
                    <p>Kelola data santri aktif</p>
                  </div>
                </div>
                
                <div className="feature-card">
                  <div className="feature-icon" style={{color: '#00E676'}}>
                    <UserOutlined />
                  </div>
                  <div className="feature-info">
                    <h4>Data Guru</h4>
                    <p>Informasi tenaga pengajar</p>
                  </div>
                </div>

                <div className="feature-card">
                  <div className="feature-icon" style={{color: '#FFC107'}}>
                    <TrophyOutlined />
                  </div>
                  <div className="feature-info">
                    <h4>Prestasi & Pelanggaran</h4>
                    <p>Rekam jejak santri</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
