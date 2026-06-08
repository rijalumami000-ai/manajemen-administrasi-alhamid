import { useEffect, useState, useRef } from 'react';
import { User } from 'lucide-react';
import './LiveActivityFeed.scss';

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 5) return 'baru saja';
  if (diff < 60) return `${diff} detik lalu`;
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  return `${Math.floor(diff / 3600)} jam lalu`;
}

const METHOD_ICONS = {
  face: '😀',
  qr: '📱',
  nfc: '🪪',
  fingerprint: '👆',
  manual: '✍️'
};

export function LiveActivityFeed({ items = [], maxItems = 8, variant = 'light' }) {
  const [, setTick] = useState(0);
  const listRef = useRef(null);

  // Update relative timestamps every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 10000);
    return () => clearInterval(timer);
  }, []);

  const displayed = items.slice(0, maxItems);

  return (
    <div className={`live-feed ${variant}`}>
      <div className="live-feed__header">
        <div className="live-feed__title">
          <span className="live-feed__pulse" />
          Aktivitas Terkini
        </div>
        <span className="live-feed__count">{items.length} hari ini</span>
      </div>

      <div className="live-feed__list" ref={listRef}>
        {displayed.length === 0 ? (
          <div className="live-feed__empty">
            <span>Belum ada aktivitas hari ini</span>
          </div>
        ) : (
          displayed.map((item, i) => (
            <div key={item.id || i} className="live-feed__item" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="live-feed__dot-wrap">
                <span className={`live-feed__dot ${item.status === 'Hadir' ? 'success' : 'warning'}`} />
              </div>
              <div className="live-feed__avatar">
                {item.foto_url ? (
                  <img src={item.foto_url} alt="" onError={e => { e.target.style.display = 'none'; }} />
                ) : (
                  <User size={14} />
                )}
              </div>
              <div className="live-feed__content">
                <span className="live-feed__name">{item.santri_nama || item.nama}</span>
                <span className="live-feed__detail">
                  {METHOD_ICONS[item.metode] || '✅'} {item.sholat} • {item.status}
                </span>
              </div>
              <span className="live-feed__time">{timeAgo(item.waktu_scan)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
