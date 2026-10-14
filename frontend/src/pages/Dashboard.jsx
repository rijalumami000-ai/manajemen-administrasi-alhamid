import { useState, useEffect } from 'react';
import { Coffee, Compass, Heart, Sparkles, Check } from 'lucide-react';
import './Dashboard.scss';

export function Dashboard() {
  const [checkedItems, setCheckedItems] = useState(() => {
    try {
      const today = new Date().toDateString();
      const saved = localStorage.getItem(`daily_checkin_${today}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleCheck = (index) => {
    const today = new Date().toDateString();
    const next = { ...checkedItems, [index]: !checkedItems[index] };
    setCheckedItems(next);
    try {
      localStorage.setItem(`daily_checkin_${today}`, JSON.stringify(next));
    } catch (_) {}
  };

  const questions = [
    {
      id: 'ngopi',
      text: 'Sudah ngopi?',
      hint: 'Luangkan sejenak jeda untuk menenangkan pikiran',
      icon: Coffee,
      color: '#f59e0b',
    },
    {
      id: 'sholat',
      text: 'Sudah sholat?',
      hint: 'Penuhi panggilan ketenangan dan keteduhan hati',
      icon: Compass,
      color: '#3b82f6',
    },
    {
      id: 'sholawat',
      text: 'Sudah membaca sholawat?',
      hint: 'Alirkan kedamaian jiwa di sela-sela aktivitasmu',
      icon: Heart,
      color: '#ec4899',
    },
    {
      id: 'perbaiki',
      text: 'Sudah memperbaiki diri apa hari ini?',
      hint: 'Satu langkah kecil hari ini adalah awal perubahan besar',
      icon: Sparkles,
      color: '#10b981',
    },
  ];

  const formatIndoDate = (date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="aesthetic-zen-dashboard">
      {/* Background Abstract Floating Orbs Animation */}
      <div className="abstract-glow-container" aria-hidden="true">
        <div className="abstract-orb orb-1"></div>
        <div className="abstract-orb orb-2"></div>
        <div className="abstract-orb orb-3"></div>
        <div className="abstract-orb orb-4"></div>
      </div>

      <div className="zen-content-wrapper">
        {/* Top Minimal Info Pill */}
        <div className="zen-header-pill">
          <span className="live-pulse"></span>
          <span className="date-time-text">
            {formatIndoDate(currentTime)} • {formatTime(currentTime)}
          </span>
        </div>

        {/* Main Aesthetic Card */}
        <div className="zen-card">
          <div className="zen-greetings">
            <h1 className="zen-title">
              Hai kamu!, <span className="highlight-text">Iyaa kamu!</span>
            </h1>
            <p className="zen-subtitle">
              Ambil jeda sejenak, nikmati harimu, dan mari refleksikan hal sederhana ini:
            </p>
          </div>

          <div className="zen-divider"></div>

          {/* 4 Reflective Questions List */}
          <div className="zen-questions-grid">
            {questions.map((item, index) => {
              const isChecked = !!checkedItems[index];
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className={`zen-question-card ${isChecked ? 'completed' : ''}`}
                  onClick={() => toggleCheck(index)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleCheck(index);
                    }
                  }}
                >
                  <div className="card-indicator" style={{ '--accent-color': item.color }}>
                    <div className="icon-wrapper">
                      <Icon size={20} />
                    </div>
                  </div>

                  <div className="card-content">
                    <span className="question-title">{item.text}</span>
                    <span className="question-hint">{item.hint}</span>
                  </div>

                  <div className="check-box-wrapper">
                    <div className="zen-checkbox" title={isChecked ? 'Selesai' : 'Tandai sudah'}>
                      {isChecked && <Check size={14} className="check-icon" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Calming Aesthetic Footer */}
          <div className="zen-footer">
            <span className="zen-quote">
              "Ketenangan hadir bukan karena keadaan sempurna, melainkan saat hati belajar bersyukur."
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
