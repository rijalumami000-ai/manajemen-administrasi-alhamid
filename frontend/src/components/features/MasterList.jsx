import React from 'react';
import { Edit, Trash2, BookOpen, Briefcase } from 'lucide-react';
import './MasterList.scss';

export function MasterList({ items, emptyLabel, onEdit, onDelete, type }) {
  if (!items || items.length === 0) {
    return (
      <div className="tactile-glass-empty">
        <div className="empty-icon-bubble">
          {type === 'mapel' ? <BookOpen size={28} /> : <Briefcase size={28} />}
        </div>
        <h4>Belum Ada Data {type === 'mapel' ? 'Mata Pelajaran' : 'Jabatan'}</h4>
        <p>{emptyLabel}</p>
      </div>
    );
  }

  const isMapel = type === 'mapel';
  const themeClass = isMapel ? 'theme-mapel' : 'theme-jabatan';

  return (
    <div className="master-grid-container">
      {items.map((item, index) => (
        <article key={item.id} className={`master-liquid-card ${themeClass}`}>
          {/* Card Header: 3D Lens Orb & Index Badge */}
          <header className="card-header">
            <div className="master-lens-orb" title={item.nama}>
              {isMapel ? <BookOpen size={18} /> : <Briefcase size={18} />}
            </div>
            <span className="item-index-badge">#{index + 1}</span>
          </header>

          {/* Card Body: Details */}
          <div className="card-body">
            <h4 className="item-title" title={item.nama || '-'}>
              {item.nama || '-'}
            </h4>

            {isMapel && item.nama_arab && (
              <span className="arabic-name-tag" dir="rtl" title={`Nama Arab: ${item.nama_arab}`}>
                {item.nama_arab}
              </span>
            )}

            {!isMapel && item.keterangan && (
              <p className="item-description" title={item.keterangan}>
                {item.keterangan}
              </p>
            )}
          </div>

          {/* Card Footer: Frosted Action Capsules */}
          <footer className="card-footer">
            <button
              type="button"
              className="tactile-action-btn edit-btn"
              onClick={() => onEdit(item)}
              aria-label={`Edit ${item.nama || ''}`}
            >
              <Edit size={13} />
              <span>Edit</span>
            </button>
            <button
              type="button"
              className="tactile-action-btn delete-btn"
              onClick={() => onDelete(item.id, item.nama)}
              aria-label={`Hapus ${item.nama || ''}`}
            >
              <Trash2 size={13} />
              <span>Hapus</span>
            </button>
          </footer>
        </article>
      ))}
    </div>
  );
}

export default MasterList;
