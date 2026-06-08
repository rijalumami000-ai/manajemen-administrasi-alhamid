import { useState, useEffect, useRef } from 'react';
import './StatCard.scss';

function useCountUp(target, duration = 1200) {
  const [count, setCount] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    const start = performance.now();
    const animate = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setCount(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return count;
}

export function StatCard({ icon, label, value, accent = 'indigo', suffix = '', className = '' }) {
  const animatedValue = useCountUp(value);

  return (
    <div className={`ui-stat-card accent-${accent} ${className}`}>
      <div className="stat-card__icon-wrap">
        <div className="stat-card__icon">{icon}</div>
      </div>
      <div className="stat-card__content">
        <span className="stat-card__value">
          {animatedValue.toLocaleString('id-ID')}{suffix}
        </span>
        <span className="stat-card__label">{label}</span>
      </div>
      <div className="stat-card__glow" />
    </div>
  );
}
