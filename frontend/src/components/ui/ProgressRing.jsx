import './ProgressRing.scss';

export function ProgressRing({ percent = 0, size = 44, strokeWidth = 4, label }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  const getColor = () => {
    if (percent >= 80) return '#10B981';
    if (percent >= 50) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <div className="ui-progress-ring" title={label || `${percent}% lengkap`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          className="progress-ring__bg"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          className="progress-ring__fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          stroke={getColor()}
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.3s ease' }}
        />
      </svg>
      <span className="progress-ring__text" style={{ color: getColor() }}>
        {percent}%
      </span>
    </div>
  );
}
