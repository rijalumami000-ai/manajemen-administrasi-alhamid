import './StatusChip.scss';

export function StatusChip({ active = false, label, icon, size = 'sm' }) {
  return (
    <span className={`ui-status-chip ${active ? 'active' : 'inactive'} size-${size}`}>
      <span className="status-chip__dot" />
      {icon && <span className="status-chip__icon">{icon}</span>}
      <span className="status-chip__label">{label}</span>
    </span>
  );
}
