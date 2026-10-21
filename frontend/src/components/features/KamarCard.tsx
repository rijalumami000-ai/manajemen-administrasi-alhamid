import React from 'react';
import { Users, Building, Layers, Wrench, Edit, Trash2, BedDouble, Info } from 'lucide-react';
import { KamarItem } from '../../types/kamar';
import './KamarCard.scss';

interface KamarCardProps {
  kamar: KamarItem;
  onEdit: (kamar: KamarItem) => void;
  onDelete: (id: number, nama: string) => void;
  onSelect?: (kamar: KamarItem) => void;
}

export const KamarCard: React.FC<KamarCardProps> = ({
  kamar,
  onEdit,
  onDelete,
  onSelect
}) => {
  const terisi = Number(kamar.terisi) || 0;
  const kapasitas = Number(kamar.kapasitas) || 0;
  const persenTerisi = kapasitas > 0 ? Math.round((terisi / kapasitas) * 100) : 0;

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
    <div
      className={`tactile-kamar-card ${themeClass}`}
      onClick={() => onSelect && onSelect(kamar)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect && onSelect(kamar);
        }
      }}
    >
      {/* Specular top highlight glint */}
      <div className="card-specular-edge" />

      {/* Header Section */}
      <div className="card-header-section">
        <div className="room-lens-orb" aria-hidden="true">
          <BedDouble size={20} />
        </div>
        <div className="room-title-info">
          <span className="room-type-pill">{kamar.jenis || 'Kamar'}</span>
          <h4 className="room-name" title={kamar.nama || '-'}>
            {kamar.nama || '-'}
          </h4>
        </div>
        <span className={`room-status-dot ${getStatusClass()}`} title={kamar.status || 'Tersedia'}>
          <span className="dot-indicator" />
          <span className="status-text">{kamar.status || 'Tersedia'}</span>
        </span>
      </div>

      {/* Body Info Section */}
      <div className="card-body-section">
        {/* Capacity Bar Hero Element */}
        <div className="capacity-hero">
          <div className="capacity-header-row">
            <span className="capacity-label">
              <Users size={13} />
              <span>Kapasitas Santri</span>
            </span>
            <span className="capacity-numbers">
              <strong>{terisi}</strong> / {kapasitas} Santri
            </span>
          </div>
          <div className="capacity-bar-track">
            <div
              className={`capacity-bar-fill ${getCapacityColor()}`}
              style={{ width: `${Math.min(persenTerisi, 100)}%` }}
            />
          </div>
          <div className="capacity-sub-meta">
            <span className={`capacity-percent ${getCapacityColor()}`}>{persenTerisi}% terisi</span>
            <span className="capacity-sisa">
              {Math.max(0, kapasitas - terisi)} kursi kosong
            </span>
          </div>
        </div>

        {/* Detail Items Badges */}
        <div className="detail-meta-grid">
          {kamar.gedung && (
            <div className="info-item" title={`Gedung ${kamar.gedung}`}>
              <div className="info-icon-wrapper">
                <Building size={13} />
              </div>
              <div className="info-text">
                <span className="info-label">Gedung</span>
                <span className="info-value">{kamar.gedung}</span>
              </div>
            </div>
          )}

          {kamar.lantai !== null && kamar.lantai !== undefined && (
            <div className="info-item" title={`Lantai ${kamar.lantai}`}>
              <div className="info-icon-wrapper">
                <Layers size={13} />
              </div>
              <div className="info-text">
                <span className="info-label">Lantai</span>
                <span className="info-value">Lt. {kamar.lantai}</span>
              </div>
            </div>
          )}
        </div>

        {kamar.fasilitas && (
          <div className="info-item facilities-item" title={kamar.fasilitas}>
            <div className="info-icon-wrapper">
              <Wrench size={13} />
            </div>
            <div className="info-text">
              <span className="info-label">Fasilitas</span>
              <span className="info-value text-truncate">{kamar.fasilitas}</span>
            </div>
          </div>
        )}

        {kamar.keterangan && (
          <div className="info-item notes-item" title={kamar.keterangan}>
            <div className="info-icon-wrapper">
              <Info size={13} />
            </div>
            <div className="info-text">
              <span className="info-label">Catatan</span>
              <span className="info-value text-truncate">{kamar.keterangan}</span>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons Footer */}
      <div className="card-actions-section" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="action-pill-btn anggota-pill-btn"
          onClick={() => onSelect && onSelect(kamar)}
          title="Lihat rincian & daftar santri kamar"
        >
          <Users size={14} />
          <span>Daftar Santri ({terisi})</span>
        </button>

        <div className="icon-actions-group">
          <button
            type="button"
            className="btn-table-act btn-act-edit"
            onClick={() => onEdit(kamar)}
            title="Edit data kamar"
            aria-label="Edit kamar"
          >
            <Edit size={14} />
          </button>
          <button
            type="button"
            className="btn-table-act btn-act-delete"
            onClick={() => onDelete(kamar.id, kamar.nama)}
            title="Hapus kamar"
            aria-label="Hapus kamar"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default KamarCard;
