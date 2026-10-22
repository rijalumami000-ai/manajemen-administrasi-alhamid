import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { summaryService } from '../services/summaryService';
import { SummaryData, ZenQuestionItem } from '../types/dashboard';
import {
  Users,
  GraduationCap,
  School,
  Award,
  Coffee,
  Compass,
  Heart,
  Sparkles,
  Check,
  RefreshCw,
  ArrowUpRight,
  Calendar,
  CheckSquare,
  CreditCard,
  Boxes,
  Home,
  Radio,
  Activity,
  ShieldCheck
} from 'lucide-react';
import './Dashboard.scss';

const ZEN_QUESTIONS: ZenQuestionItem[] = [
  {
    id: 'ngopi',
    text: 'Sudah ngopi?',
    hint: 'Luangkan sejenak jeda untuk menenangkan pikiran',
    color: '#f59e0b',
  },
  {
    id: 'sholat',
    text: 'Sudah sholat?',
    hint: 'Penuhi panggilan ketenangan dan keteduhan hati',
    color: '#3b82f6',
  },
  {
    id: 'sholawat',
    text: 'Sudah membaca sholawat?',
    hint: 'Alirkan kedamaian jiwa di sela-sela aktivitasmu',
    color: '#ec4899',
  },
  {
    id: 'perbaiki',
    text: 'Sudah memperbaiki diri apa hari ini?',
    hint: 'Satu langkah kecil hari ini adalah awal perubahan besar',
    color: '#10b981',
  },
];

const QUICK_MODULES = [
  {
    key: 'jadwal',
    label: 'Jadwal Pelajaran',
    desc: 'Atur jadwal kelas & madin',
    path: '/jadwal-pelajaran',
    icon: Calendar,
    color: '#3b82f6'
  },
  {
    key: 'absensi',
    label: 'Absensi & Sholat',
    desc: 'Catat kehadiran jamaah',
    path: '/absensi-sholat',
    icon: CheckSquare,
    color: '#10b981'
  },
  {
    key: 'keuangan',
    label: 'Tagihan SPP',
    desc: 'Administrasi pembayaran santri',
    path: '/tagihan-santri',
    icon: CreditCard,
    color: '#8b5cf6'
  },
  {
    key: 'inventaris',
    label: 'Inventaris Pondok',
    desc: 'Kelola aset & sarana prasarana',
    path: '/inventaris',
    icon: Boxes,
    color: '#f59e0b'
  },
  {
    key: 'kamar',
    label: 'Data Asrama / Kamar',
    desc: 'Penempatan & kapasitas santri',
    path: '/kamar',
    icon: Home,
    color: '#06b6d4'
  },
  {
    key: 'radio',
    label: 'Radio Streaming',
    desc: 'Murottal & siaran penyejuk',
    path: '/radio',
    icon: Radio,
    color: '#ec4899'
  }
];

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Summary Metrics State
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loadingSummary, setLoadingSummary] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Time & Live Clock State
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Zen Checklist State with LocalStorage persistence
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() => {
    try {
      const today = new Date().toDateString();
      const saved = localStorage.getItem(`daily_checkin_${today}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Clock ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch summary data
  const loadSummary = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoadingSummary(true);

    try {
      const data = await summaryService.getSummary();
      setSummary(data);
    } catch (error) {
      console.error('Failed to load dashboard summary:', error);
    } finally {
      setLoadingSummary(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const toggleCheck = (id: string) => {
    const today = new Date().toDateString();
    const next = { ...checkedItems, [id]: !checkedItems[id] };
    setCheckedItems(next);
    try {
      localStorage.setItem(`daily_checkin_${today}`, JSON.stringify(next));
    } catch (_) {}
  };

  const formatIndoDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getZenIcon = (id: string) => {
    switch (id) {
      case 'ngopi': return Coffee;
      case 'sholat': return Compass;
      case 'sholawat': return Heart;
      case 'perbaiki': return Sparkles;
      default: return Sparkles;
    }
  };

  const completedZenCount = Object.values(checkedItems).filter(Boolean).length;

  return (
    <div className="dashboard-container">
      {/* 1. STANDAR BAKU HEADER HALAMAN (Aturan Sakral 4.1: NO ICON IN HEADER TEXT) */}
      <header className="tactile-page-header">
        <div className="header-text-block">
          <h2 className="page-title">Dashboard Pesantren</h2>
          <p className="page-subtitle">
            Ikhtisar operasional, statistik data santri, dan kebersihan rohani Pondok Pesantren Al-Hamid
          </p>
        </div>

        <div className="header-actions-row">
          <div className="live-clock-pill">
            <span className="live-pulse-dot" />
            <span className="clock-text">
              {formatIndoDate(currentTime)} • {formatTime(currentTime)}
            </span>
          </div>

          <button 
            type="button" 
            className="action-pill-btn refresh-btn"
            onClick={() => loadSummary(true)}
            disabled={refreshing}
            title="Segarkan data ringkasan"
          >
            <RefreshCw size={14} className={refreshing ? 'spin-icon' : ''} />
            <span>Segarkan</span>
          </button>
        </div>
      </header>

      {/* 2. REAL METRIC KPI STAT ORBS (Apple VisionOS Liquid Glass) */}
      <section className="kpi-metrics-grid">
        {/* Santri Aktif */}
        <div 
          className="kpi-stat-card blue-accent" 
          onClick={() => navigate('/santri')}
          role="button"
          tabIndex={0}
        >
          <div className="card-top-row">
            <div className="stat-lens-orb blue">
              <Users size={20} />
            </div>
            <span className="stat-arrow-cue">
              <ArrowUpRight size={16} />
            </span>
          </div>
          <div className="stat-content">
            <span className="stat-number">
              {loadingSummary ? (
                <span className="stat-skeleton" />
              ) : (
                summary?.santri?.toLocaleString('id-ID') ?? 0
              )}
            </span>
            <span className="stat-label">Santri Aktif</span>
            <span className="stat-submeta">Terdaftar di tahun ajaran aktif</span>
          </div>
        </div>

        {/* Dewan Guru / Asatidz */}
        <div 
          className="kpi-stat-card emerald-accent" 
          onClick={() => navigate('/guru')}
          role="button"
          tabIndex={0}
        >
          <div className="card-top-row">
            <div className="stat-lens-orb emerald">
              <GraduationCap size={20} />
            </div>
            <span className="stat-arrow-cue">
              <ArrowUpRight size={16} />
            </span>
          </div>
          <div className="stat-content">
            <span className="stat-number">
              {loadingSummary ? (
                <span className="stat-skeleton" />
              ) : (
                summary?.guru?.toLocaleString('id-ID') ?? 0
              )}
            </span>
            <span className="stat-label">Dewan Guru / Asatidz</span>
            <span className="stat-submeta">Tenaga pendidik formal & diniyah</span>
          </div>
        </div>

        {/* Kelas & Halaqah */}
        <div 
          className="kpi-stat-card purple-accent" 
          onClick={() => navigate('/kelas')}
          role="button"
          tabIndex={0}
        >
          <div className="card-top-row">
            <div className="stat-lens-orb purple">
              <School size={20} />
            </div>
            <span className="stat-arrow-cue">
              <ArrowUpRight size={16} />
            </span>
          </div>
          <div className="stat-content">
            <span className="stat-number">
              {loadingSummary ? (
                <span className="stat-skeleton" />
              ) : (
                summary?.kelas?.toLocaleString('id-ID') ?? 0
              )}
            </span>
            <span className="stat-label">Kelas & Halaqah</span>
            <span className="stat-submeta">Rombongan belajar & ruang kelas</span>
          </div>
        </div>

        {/* Alumni Pesantren */}
        <div 
          className="kpi-stat-card amber-accent" 
          onClick={() => navigate('/alumni')}
          role="button"
          tabIndex={0}
        >
          <div className="card-top-row">
            <div className="stat-lens-orb amber">
              <Award size={20} />
            </div>
            <span className="stat-arrow-cue">
              <ArrowUpRight size={16} />
            </span>
          </div>
          <div className="stat-content">
            <span className="stat-number">
              {loadingSummary ? (
                <span className="stat-skeleton" />
              ) : (
                summary?.alumni?.toLocaleString('id-ID') ?? 0
              )}
            </span>
            <span className="stat-label">Alumni Terdata</span>
            <span className="stat-submeta">Keluarga besar lulusan Al-Hamid</span>
          </div>
        </div>
      </section>

      {/* 3. DUAL COLUMN WORKSPACE: ZEN CARD + QUICK ACTIONS */}
      <section className="dashboard-content-grid">
        {/* Left Column: Zen Mindfulness Reflection Card */}
        <div className="zen-card-container">
          <div className="zen-card-header">
            <div className="zen-header-titles">
              <h3 className="zen-greeting-title">
                Hai kamu!, <span className="highlight-text">Iyaa kamu!</span>
              </h3>
              <p className="zen-greeting-subtitle">
                Ambil jeda sejenak, nikmati harimu, dan mari refleksikan hal sederhana ini:
              </p>
            </div>
            <div className="zen-progress-badge">
              <span>{completedZenCount} / 4 Selesai</span>
            </div>
          </div>

          <div className="zen-questions-list">
            {ZEN_QUESTIONS.map((item) => {
              const isChecked = !!checkedItems[item.id];
              const Icon = getZenIcon(item.id);

              return (
                <div
                  key={item.id}
                  className={`zen-item-card ${isChecked ? 'completed' : ''}`}
                  onClick={() => toggleCheck(item.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleCheck(item.id);
                    }
                  }}
                >
                  <div className="zen-icon-container" style={{ '--item-accent': item.color } as React.CSSProperties}>
                    <Icon size={19} />
                  </div>

                  <div className="zen-text-block">
                    <span className="zen-item-title">{item.text}</span>
                    <span className="zen-item-hint">{item.hint}</span>
                  </div>

                  <div className={`zen-checkbox-pill ${isChecked ? 'checked' : ''}`}>
                    {isChecked ? <Check size={14} strokeWidth={3} /> : null}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="zen-card-footer">
            <span className="zen-quote-text">
              "Ketenangan hadir bukan karena keadaan sempurna, melainkan saat hati belajar bersyukur."
            </span>
          </div>
        </div>

        {/* Right Column: Pintasan Cepat & Status Operasional */}
        <div className="quick-access-container">
          <div className="quick-access-header">
            <h3 className="section-main-title">Pintasan Operasional</h3>
            <p className="section-subtitle">Akses instan modul administrasi terpenting</p>
          </div>

          <div className="quick-modules-grid">
            {QUICK_MODULES.map((mod) => {
              const Icon = mod.icon;
              return (
                <div
                  key={mod.key}
                  className="quick-module-card"
                  onClick={() => navigate(mod.path)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="module-icon-wrap" style={{ color: mod.color }}>
                    <Icon size={18} />
                  </div>
                  <div className="module-text-wrap">
                    <span className="module-name">{mod.label}</span>
                    <span className="module-desc">{mod.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* System Health Status Card */}
          <div className="system-health-dock">
            <div className="health-left">
              <div className="health-pulse-orb">
                <Activity size={16} />
              </div>
              <div className="health-info">
                <span className="health-status-text">Sistem Operasional Optimal</span>
                <span className="health-meta-text">
                  Aktif sebagai <strong>{user?.nama || user?.username || 'Admin'}</strong> ({user?.role || 'Admin'})
                </span>
              </div>
            </div>

            <div className="health-badge">
              <ShieldCheck size={13} />
              <span>Aman</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
