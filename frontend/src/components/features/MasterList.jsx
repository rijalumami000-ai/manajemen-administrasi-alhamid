import { Edit, Trash2, BookOpen, Briefcase } from 'lucide-react';
import './MasterList.scss';

export function MasterList({ items, emptyLabel, onEdit, onDelete, type }) {
  if (!items || items.length === 0) {
    return (
      <div className="empty-state empty-state-compact">
        <div className="empty-state-icon">!</div>
        <h3>Belum ada data</h3>
        <p>{emptyLabel}</p>
      </div>
    );
  }

  const isMapel = type === 'mapel';

  return (
    <div className="master-grid-container">
      {items.map((item, index) => (
        <div key={item.id} className="master-grid-card">
          <div className="card-top-accent"></div>
          
          <div className="card-icon-avatar">
            {isMapel ? <BookOpen size={18} /> : <Briefcase size={18} />}
          </div>

          <div className="card-details">
            <span className="item-index">#{index + 1}</span>
            <h4 className="item-name" title={item.nama || '-'}>
              {item.nama || '-'}
            </h4>
          </div>

          <div className="card-actions">
            <button
              type="button"
              className="action-btn edit-btn"
              onClick={() => onEdit(item)}
              aria-label={`Edit ${item.nama || ''}`}
            >
              <Edit size={12} />
              <span>Edit</span>
            </button>
            <button
              type="button"
              className="action-btn delete-btn"
              onClick={() => onDelete(item.id)}
              aria-label={`Hapus ${item.nama || ''}`}
            >
              <Trash2 size={12} />
              <span>Hapus</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
