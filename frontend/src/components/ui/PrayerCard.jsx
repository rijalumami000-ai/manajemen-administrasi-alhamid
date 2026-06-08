import { useEffect, useRef, useState } from 'react';
import './PrayerCard.scss';

const PRAYER_ICONS = {
  Subuh: '🌅',
  Dzuhur: '☀️',
  Ashar: '🌤️',
  Maghrib: '🌅',
  Isya: '🌙'
};

const PRAYER_TIMES = {
  Subuh: '04:30',
  Dzuhur: '12:00',
  Ashar: '15:15',
  Maghrib: '17:45',
  Isya: '19:00'
};

export function PrayerCard({ name, attended = 0, total = 0, active = false, onClick, variant = 'light' }) {
  const [displayCount, setDisplayCount] = useState(0);
  const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;
  const prevAttended = useRef(attended);

  useEffect(() => {
    // Count-up animation
    const start = prevAttended.current;
    const end = attended;
    prevAttended.current = attended;
    if (start === end) { setDisplayCount(end); return; }
    
    let current = start;
    const step = end > start ? 1 : -1;
    const timer = setInterval(() => {
      current += step;
      setDisplayCount(current);
      if (current === end) clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
  }, [attended]);

  return (
    <div 
      className={`prayer-card ${active ? 'active' : ''} ${variant}`}
      onClick={onClick}
    >
      <div className="prayer-card__header">
        <span className="prayer-card__icon">{PRAYER_ICONS[name] || '🕌'}</span>
        <span className="prayer-card__name">{name}</span>
        {active && <span className="prayer-card__live-dot" />}
      </div>
      
      <div className="prayer-card__stats">
        <span className="prayer-card__count">{displayCount}</span>
        <span className="prayer-card__total">/ {total}</span>
      </div>

      <div className="prayer-card__progress-bar">
        <div 
          className="prayer-card__progress-fill" 
          style={{ width: `${percentage}%` }} 
        />
      </div>

      <div className="prayer-card__footer">
        <span className="prayer-card__percentage">{percentage}%</span>
        <span className="prayer-card__time">{PRAYER_TIMES[name]}</span>
      </div>
    </div>
  );
}
