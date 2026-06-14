import { Home, Users, Building, Layers, Wrench, Edit, Trash2, BedDouble } from 'lucide-react';
import './KamarCard.scss';

export function KamarCard({ kamar, onEdit, onDelete }) {
  const persenTerisi = kamar.kapasitas > 0
    ? Math.round((kamar.terisi / kamar.kapasitas) * 100)
    : 0;

  const isPutra = kamar.jenis === 'Putra';
  const themeClass = isPutra ? 'theme-putra' : 'theme-putri';

  // Capacity color logic
  const getCapacityColor = () => {
    if (persenTerisi >= 90) return 'cap-critical';
    if (persenTerisi >= 70) return 'cap-warning';
    return 'cap-normal';
  };

  // Status styling
  const getStatusClass = () => {
    if (kamar.status === 'Penuh') return 'status-full';
    if (kamar.status === 'Maintenance') return 'status-maintenance';
    return 'status-available';
  };

  return (
    <div className={`premium-kamar-card ${themeClass}`}>
      {/* Background glow */}
      <div className="card-glow-effect"></div>

      {/* Header Section */}
      <div className="card-header-section">
        <div className="room-badge-circle">
          <BedDouble size={20} />
        </div>
        <div className="room-title-info">
          <span className="room-type-pill">{kamar.jenis || 'Kamar'}</span>
          <h4 className="room-name" title={kamar.nama || '-'}>
            {kamar.nama || '-'}
          </h4>
        </div>
        <span className={`room-status-dot ${getStatusClass()}`} title={kamar.status || 'Tersedia'}>
          <span className="dot-indicator"></span>
          <span className="status-text">{kamar.status || 'Tersedia'}</span>
        </span>
      </div>

      {/* Body Info Section */}
      <div className="card-body-section">
        {/* Capacity Bar - Hero Element */}
        <div className="capacity-hero">
          <div className="capacity-header-row">
            <span className="capacity-label">
              <Users size={13} />
              Kapasitas
            </span>
            <span className="capacity-numbers">
              <strong>{kamar.terisi || 0}</strong> / {kamar.kapasitas || 0}
            </span>
          </div>
          <div className="capacity-bar-track">
            <div
              className={`capacity-bar-fill ${getCapacityColor()}`}
              style={{ width: `${Math.min(persenTerisi, 100)}%` }}
            ></div>
          </div>
          <span className={`capacity-percent ${getCapacityColor()}`}>{persenTerisi}%</span>
        </div>

        {/* Detail Items */}
        {kamar.gedung && (
          <div className="info-item">
            <div className="info-icon-wrapper">
              <Building size={14} />
            </div>
            <div className="info-text">
              <span className="info-label">Gedung</span>
              <span className="info-value">{kamar.gedung}</span>
            </div>
          </div>
        )}

        {kamar.lantai && (
          <div className="info-item">
            <div className="info-icon-wrapper">
              <Layers size={14} />
            </div>
            <div className="info-text">
              <span className="info-label">Lantai</span>
              <span className="info-value">Lantai {kamar.lantai}</span>
            </div>
          </div>
        )}

        {kamar.fasilitas && (
          <div className="info-item">
            <div className="info-icon-wrapper">
              <Wrench size={14} />
            </div>
            <div className="info-text">
              <span className="info-label">Fasilitas</span>
              <span className="info-value" title={kamar.fasilitas}>{kamar.fasilitas}</span>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons Footer */}
      <div className="card-actions-section">
        <button
          type="button"
          className="action-btn edit-btn"
          onClick={() => onEdit(kamar)}
          title="Ubah data kamar"
        >
          <Edit size={13} />
          <span>Edit</span>
        </button>
        <button
          type="button"
          className="action-btn delete-btn"
          onClick={() => onDelete(kamar.id, kamar.nama)}
          title="Hapus kamar"
        >
          <Trash2 size={13} />
          <span>Hapus</span>
        </button>
      </div>
    </div>
  );
}
