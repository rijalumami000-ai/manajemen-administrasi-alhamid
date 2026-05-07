export function MasterList({ items, emptyLabel, onEdit, onDelete }) {
  if (!items || items.length === 0) {
    return (
      <div className="empty-state empty-state-compact">
        <div className="empty-state-icon">!</div>
        <h3>Belum ada data</h3>
        <p>{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="master-list">
      {items.map((item, index) => (
        <div key={item.id} className="master-list-item">
          <span className="master-list-index">{index + 1}</span>
          <span className="master-list-name">{item.nama || '-'}</span>
          <div className="master-list-actions">
            <button
              type="button"
              className="master-action edit"
              onClick={() => onEdit(item)}
              aria-label={`Edit ${item.nama || ''}`}
            >
              Edit
            </button>
            <button
              type="button"
              className="master-action delete"
              onClick={() => onDelete(item.id)}
              aria-label={`Hapus ${item.nama || ''}`}
            >
              Hapus
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
