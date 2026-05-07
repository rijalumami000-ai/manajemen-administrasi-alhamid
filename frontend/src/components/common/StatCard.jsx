import { memo } from 'react';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import './StatCard.scss';

export const StatCard = memo(function StatCard({
  title,
  value,
  prefix,
  suffix,
  icon,
  iconColor = '#0052FF',
  trend,
  trendText,
  loading = false,
  onClick
}) {
  const isPositiveTrend = trend >= 0;

  if (loading) {
    return <div className="stat-card skeleton"></div>;
  }

  // Convert hex color to rgba for soft background
  const hexToRgba = (hex, opacity) => {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex.substring(1, 3), 16);
      g = parseInt(hex.substring(3, 5), 16);
      b = parseInt(hex.substring(5, 7), 16);
    }
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const iconBg = iconColor.startsWith('#') ? hexToRgba(iconColor, 0.15) : `var(--${iconColor}-light)`;

  return (
    <div 
      className={`stat-card ${onClick ? 'stat-card-clickable' : ''}`}
      onClick={onClick}
    >
      <div className="stat-card-header">
        <div 
          className="stat-card-icon"
          style={{ 
            backgroundColor: iconBg,
            color: iconColor 
          }}
        >
          {icon}
        </div>
        <div className="stat-card-title">{title}</div>
        <div className="stat-card-options">
           <span className="dots">•••</span>
        </div>
      </div>

      <div className="stat-card-body">
        <div className="stat-card-value">
          {prefix}{value}{suffix}
        </div>
        
        {trend !== undefined && (
          <div className="stat-card-trend-wrapper">
            <div className={`stat-card-trend ${isPositiveTrend ? 'positive' : 'negative'}`}>
              {isPositiveTrend ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              <span>{Math.abs(trend)}%</span>
            </div>
            {trendText && <span className="stat-card-trend-text">{trendText}</span>}
          </div>
        )}
      </div>
    </div>
  );
});
