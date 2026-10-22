import React, { useState, useEffect, useRef, ReactNode } from 'react';
import './StatCard.scss';

function useCountUp(target: number, duration = 1200): number {
  const [count, setCount] = useState<number>(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof target !== 'number' || isNaN(target) || target === 0) {
      setCount(target || 0);
      return;
    }
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setCount(Math.round(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return count;
}

export interface StatCardProps {
  icon: ReactNode;
  label: ReactNode;
  value: number;
  accent?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky' | 'purple' | string;
  suffix?: string;
  className?: string;
}

export function StatCard({
  icon,
  label,
  value,
  accent = 'indigo',
  suffix = '',
  className = ''
}: StatCardProps) {
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

export default StatCard;
