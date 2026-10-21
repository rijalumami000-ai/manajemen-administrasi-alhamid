import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  TrendingUp,
  TrendingDown,
  Users,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import './TahunAjaranBoard.scss';

export interface TahunAjaranItem {
  id: number | string;
  kode: string;
  is_active?: boolean;
  jumlah_santri?: number;
  jumlah_kelas?: number;
}

export interface TahunAjaranBoardProps {
  tahunAjaranList?: TahunAjaranItem[];
  activeTahunAjaran?: TahunAjaranItem | null;
  selectedId?: string | number;
  selectedTahunAjaranId?: string | number;
  onSelect?: (id: string | number) => void;
  onSelectTahunAjaran?: (id: string | number) => void;
}

export function TahunAjaranBoard({
  tahunAjaranList = [],
  activeTahunAjaran,
  selectedId,
  selectedTahunAjaranId,
  onSelect,
  onSelectTahunAjaran
}: TahunAjaranBoardProps) {
  const [isGridExpanded, setIsGridExpanded] = useState<boolean>(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const currentSelectedId = selectedId !== undefined ? selectedId : selectedTahunAjaranId;

  const handleSelect = (id: string | number) => {
    if (typeof onSelect === 'function') onSelect(id);
    if (typeof onSelectTahunAjaran === 'function') onSelectTahunAjaran(id);
  };

  // Sort years chronologically
  const sortedYears = useMemo(() => {
    if (!tahunAjaranList || !tahunAjaranList.length) return [];
    return [...tahunAjaranList].sort((a, b) => {
      const yearA = parseInt(String(a.kode).split('-')[0]) || 0;
      const yearB = parseInt(String(b.kode).split('-')[0]) || 0;
      return yearA - yearB;
    });
  }, [tahunAjaranList]);

  // Find active year
  const activeYear = useMemo(() => {
    return activeTahunAjaran || sortedYears.find(y => y.is_active);
  }, [sortedYears, activeTahunAjaran]);

  // Compute growth rates and class counts
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

      let status: 'active' | 'archive' | 'coming' = 'archive';
      if (item.is_active) {
        status = 'active';
      } else if (activeYear) {
        const itemYear = parseInt(String(item.kode).split('-')[0]) || 0;
        const activeYearStart = parseInt(String(activeYear.kode).split('-')[0]) || 0;
        if (itemYear > activeYearStart) {
          status = 'coming';
        }
      }

      const studentCount = Number(item.jumlah_santri || 0);
      const classCount = Number(item.jumlah_kelas || 0);

      return {
        ...item,
        status,
        growthText,
        isPositive,
        classCount
      };
    });
  }, [sortedYears, activeYear]);

  // Find currently selected item details
  const selectedItem = useMemo(() => {
    return enrichedYears.find(y => String(y.id) === String(currentSelectedId)) || activeYear || enrichedYears[0];
  }, [enrichedYears, currentSelectedId, activeYear]);

  // Auto scroll selected year into view in capsule track
  useEffect(() => {
    if (trackRef.current && currentSelectedId) {
      const activeEl = trackRef.current.querySelector('.year-capsule-btn.selected') as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentSelectedId]);

  if (!tahunAjaranList || tahunAjaranList.length === 0) {
    return (
      <section className="tahun-ajaran-board-dock" aria-label="Bank Data Tahun Ajaran">
        <div className="empty-state-dock">
          <Calendar size={18} />
          <span>Belum ada data periode akademik yang diinisialisasi.</span>
        </div>
      </section>
    );
  }

  return (
    <section className="tahun-ajaran-board-dock" aria-label="Pusat Data Periode Akademik">
      {/* COMPACT DOCK: Spotlight Hero (Left) + Capsule Scroller (Right) */}
      <div className="academic-dock-main">
        {/* Spotlight Hero Capsule */}
        <div className={`spotlight-hero-card ${selectedItem?.status === 'active' ? 'is-live-year' : ''}`}>
          <div className="spotlight-header">
            <span className="spotlight-title">Periode Terpilih</span>
            {selectedItem?.is_active ? (
              <span className="live-status-badge">
                <span className="pulsing-emerald-dot" />
                <span>Berjalan</span>
              </span>
            ) : selectedItem?.status === 'coming' ? (
              <span className="coming-status-badge">Mendatang</span>
            ) : (
              <span className="archive-status-badge">Arsip</span>
            )}
          </div>

          <div className="spotlight-body">
            <div className="spotlight-year-text">{selectedItem?.kode}</div>
            <div className="spotlight-metrics">
              <span className="metric-pill">
                <strong>{Number(selectedItem?.jumlah_santri || 0)}</strong> Santri
              </span>
              <span className="metric-dot">&bull;</span>
              <span className="metric-pill">
                <strong>{selectedItem?.classCount || 0}</strong> Kelas
              </span>
            </div>
          </div>
        </div>

        {/* Horizontal Glass Capsule Scroller */}
        <div className="capsule-scroller-wrap">
          <div className="capsules-header-row">
            <span className="capsules-section-label">
              <Calendar size={13} />
              <span>Ganti Periode Akademik:</span>
            </span>

            <button
              type="button"
              className={`toggle-grid-btn ${isGridExpanded ? 'active' : ''}`}
              onClick={() => setIsGridExpanded(!isGridExpanded)}
              title="Bandingkan statistik semua periode"
            >
              {isGridExpanded ? (
                <>
                  <ChevronUp size={13} />
                  <span>Sembunyikan Arsip</span>
                </>
              ) : (
                <>
                  <LayoutGrid size={13} />
                  <span>Bandingkan Arsip ({enrichedYears.length})</span>
                </>
              )}
            </button>
          </div>

          <div className="capsules-track" ref={trackRef}>
            {enrichedYears.map((item) => {
              const isSelected = String(item.id) === String(currentSelectedId);
              const isItemActive = item.is_active;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  className={`year-capsule-btn ${isSelected ? 'selected' : ''} ${isItemActive ? 'is-active-year' : ''} status-${item.status}`}
                >
                  <div className="capsule-top">
                    <span className="capsule-code">{item.kode}</span>
                    {isItemActive && <span className="capsule-active-tag">Aktif</span>}
                  </div>
                  <div className="capsule-bottom">
                    <span className="capsule-students">{Number(item.jumlah_santri || 0)} Santri</span>
                    <span className={`capsule-growth ${item.isPositive ? 'positive' : 'negative'}`}>
                      {item.growthText}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* EXPANDABLE HISTORICAL COMPARISON ACCORDION */}
      {isGridExpanded && (
        <div className="historical-grid-accordion">
          <div className="accordion-header">
            <h4>Arsip & Komparasi Antar Periode</h4>
            <span className="accordion-subtext">Klik kartu untuk melihat data santri pada periode tersebut</span>
          </div>

          <div className="historical-cards-grid">
            {enrichedYears.map((item) => {
              const isSelected = String(item.id) === String(currentSelectedId);
              const isItemActive = item.is_active;

              let badgeLabel = 'Arsip';
              let badgeClass = 'status-archive';
              if (item.status === 'active') {
                badgeLabel = 'Tahun Berjalan';
                badgeClass = 'status-active';
              } else if (item.status === 'coming') {
                badgeLabel = 'Mendatang';
                badgeClass = 'status-coming';
              }

              return (
                <button
                  key={item.id}
                  type="button"
                  className={`historical-year-card ${isSelected ? 'selected' : ''} ${isItemActive ? 'active-year-card' : ''}`}
                  onClick={() => handleSelect(item.id)}
                >
                  <div className="card-header-line">
                    <span className="card-year-title">{item.kode}</span>
                    <span className={`badge-capsule ${badgeClass}`}>{badgeLabel}</span>
                  </div>

                  <div className="card-metrics-line">
                    <span className="metric-tag">
                      <Users size={12} />
                      <strong>{Number(item.jumlah_santri || 0)}</strong> Santri
                    </span>
                    <span className="metric-tag">
                      <strong>{item.classCount}</strong> Kelas
                    </span>
                  </div>

                  <div className="card-footer-line">
                    <span className={`growth-indicator ${item.isPositive ? 'pos' : 'neg'}`}>
                      {item.isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      <span>{item.growthText} vs periode lalu</span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
