export function TahunAjaranBoard({ tahunAjaranList, selectedId, onSelect }) {
  if (!tahunAjaranList || tahunAjaranList.length === 0) {
    return (
      <section className="tahun-ajaran-board" aria-label="Bank Data Tahun Ajaran">
        <div className="tahun-ajaran-board-header">
          <div>
            <h3>Bank Data Tahun Ajaran</h3>
            <p>Pilih tahun ajaran untuk membuka Data Santri berjalan atau arsip.</p>
          </div>
        </div>
        <div className="tahun-ajaran-cards">
          <div className="empty-state empty-state-compact">
            <h3>Belum ada tahun ajaran</h3>
            <p>Daftar tahun ajaran akan muncul setelah database siap.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="tahun-ajaran-board" aria-label="Bank Data Tahun Ajaran">
      <div className="tahun-ajaran-board-header">
        <div>
          <h3>Bank Data Tahun Ajaran</h3>
          <p>Pilih tahun ajaran untuk membuka Data Santri berjalan atau arsip.</p>
        </div>
      </div>
      <div className="tahun-ajaran-cards">
        {tahunAjaranList.map((item) => {
          const isSelected = Number(item.id) === Number(selectedId);
          const badge = item.is_active ? 'Berjalan' : 'Arsip';
          const badgeClass = item.is_active ? 'status-success' : 'status-muted';

          return (
            <button
              key={item.id}
              type="button"
              className={`tahun-ajaran-card ${isSelected ? 'active' : ''}`}
              onClick={() => onSelect(item.id)}
            >
              <span className="tahun-ajaran-kode">{item.kode}</span>
              <span className={`status-badge ${badgeClass}`}>{badge}</span>
              <span className="tahun-ajaran-count">
                {Number(item.jumlah_santri || 0)} santri
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
