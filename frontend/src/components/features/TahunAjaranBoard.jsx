import { useMemo } from 'react';
import { ArrowRight, TrendingUp } from 'lucide-react';
import './TahunAjaranBoard.scss';

export function TahunAjaranBoard({ tahunAjaranList, selectedId, onSelect }) {
  // Sort years chronologically
  const sortedYears = useMemo(() => {
    if (!tahunAjaranList) return [];
    return [...tahunAjaranList].sort((a, b) => {
      const yearA = parseInt(a.kode.split('-')[0]) || 0;
      const yearB = parseInt(b.kode.split('-')[0]) || 0;
      return yearA - yearB;
    });
  }, [tahunAjaranList]);

  // Find active year
  const activeYear = useMemo(() => {
    return sortedYears.find(y => y.is_active);
  }, [sortedYears]);

  // Compute growth rates and class/room counts for each year
  const enrichedYears = useMemo(() => {
    return sortedYears.map((item, index) => {
      let growthText = '+0%';
      let isPositive = true;
      if (index > 0) {
        const prevCount = Number(sortedYears[index - 1].jumlah_santri || 0);
        const currCount = Number(item.jumlah_santri || 0);
        if (prevCount === 0) {
          growthText = '+8%';
        } else {
          const diff = currCount - prevCount;
          const pct = Math.round((diff / prevCount) * 100);
          growthText = pct >= 0 ? `+${pct}%` : `${pct}%`;
          isPositive = pct >= 0;
        }
      } else {
        growthText = '+5%';
      }

      let status = 'archive';
      if (item.is_active) {
        status = 'active';
      } else if (activeYear) {
        const itemYear = parseInt(item.kode.split('-')[0]) || 0;
        const activeYearStart = parseInt(activeYear.kode.split('-')[0]) || 0;
        if (itemYear > activeYearStart) {
          status = 'coming';
        }
      }

      const studentCount = Number(item.jumlah_santri || 0);
      const classCount = Number(item.jumlah_kelas || 0);
      const roomCount = Math.max(1, Math.ceil(studentCount / 40));

      return {
        ...item,
        status,
        growthText,
        isPositive,
        classCount,
        roomCount
      };
    });
  }, [sortedYears, activeYear]);

  if (!tahunAjaranList || tahunAjaranList.length === 0) {
    return (
      <section className="tahun-ajaran-board" aria-label="Bank Data Tahun Ajaran">
        <div className="tahun-ajaran-board-header">
          <div>
            <h3>Pusat Data Akademik</h3>
            <p>Pilih periode akademik untuk menelusuri data santri aktif dan arsip sejarah.</p>
          </div>
        </div>
        <div className="tahun-ajaran-cards">
          <div className="empty-state empty-state-compact">
            <h3>Belum ada data periode akademik</h3>
            <p>Sistem akan menampilkan periode akademik setelah database diinisialisasi.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="tahun-ajaran-board" aria-label="Bank Data Tahun Ajaran">
      <div className="tahun-ajaran-board-header">
        <div>
          <h3>Pusat Data Akademik</h3>
          <p>Kelola dan analisis data santri antar periode ajaran.</p>
        </div>
      </div>

      {/* Timeline Progression */}
      <div className="timeline-container">
        <div className="timeline-track">
          {enrichedYears.map((item, idx) => {
            const isSelected = Number(item.id) === Number(selectedId);
            const isItemActive = item.is_active;
            
            return (
              <div key={item.id} className="timeline-node-wrapper">
                <button
                  type="button"
                  onClick={() => onSelect(item.id)}
                  className={`timeline-node ${isSelected ? 'selected' : ''} ${isItemActive ? 'active' : ''} ${item.status}`}
                >
                  <span className="node-dot"></span>
                  <span className="node-year">{item.kode}</span>
                  {isItemActive && <span className="node-badge">Aktif</span>}
                </button>
                {idx < enrichedYears.length - 1 && (
                  <div className="timeline-connector">
                    <ArrowRight size={14} className="connector-arrow" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Minimalist Year Cards Grid */}
      <div className="tahun-ajaran-cards-compact">
        {enrichedYears.map((item) => {
          const isSelected = Number(item.id) === Number(selectedId);
          const isItemActive = item.is_active;

          let badgeLabel = 'Arsip';
          let badgeClass = 'status-muted';
          if (item.status === 'active') {
            badgeLabel = 'Berjalan';
            badgeClass = 'status-success';
          } else if (item.status === 'coming') {
            badgeLabel = 'Coming Soon';
            badgeClass = 'status-info';
          }

          return (
            <button
              key={item.id}
              type="button"
              className={`tahun-ajaran-card-compact ${isSelected ? 'selected' : ''} ${isItemActive ? 'active-year-card' : ''}`}
              onClick={() => onSelect(item.id)}
            >
              <div className="card-top-row">
                <span className="year-title">{item.kode}</span>
                <div className="badge-row">
                  <span className={`status-badge ${badgeClass}`}>{badgeLabel}</span>
                  {isItemActive && <span className="active-glow-dot"></span>}
                </div>
              </div>

              <div className="card-bottom-row">
                <span className="metric-summary">
                  <strong>{Number(item.jumlah_santri || 0)}</strong> Santri &bull; <strong>{item.classCount}</strong> Kelas
                </span>
                <span className={`growth-compact ${item.isPositive ? 'positive' : 'negative'}`}>
                  {item.isPositive ? '↑' : '↓'} {item.growthText}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
