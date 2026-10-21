import React from 'react';
import { User, Award, BookMarked, Edit3, Trash2 } from 'lucide-react';
import { KelasItem } from '../../types/kelas';
import './KelasCard.scss';

interface Props {
  kelas: KelasItem;
  onEdit: (kelas: KelasItem) => void;
  onDelete: (id: number, nama: string) => void;
}

export const KelasCard: React.FC<Props> = ({ kelas, onEdit, onDelete }) => {
  const isSekolah = kelas.jenis === 'Sekolah';
  const themeClass = isSekolah ? 'theme-sekolah' : 'theme-diniyah';
  const tingkatDisplay = kelas.tingkat !== null && kelas.tingkat !== undefined ? kelas.tingkat : '0';

  return (
    <article className={`tactile-kelas-card ${themeClass}`}>
      {/* Header: Tactile Orb & Class Identity */}
      <header className="card-header">
        <div className="tingkat-orb" title={`Tingkat ${tingkatDisplay}`} aria-label={`Tingkat ${tingkatDisplay}`}>
          <span className="tingkat-number">{tingkatDisplay}</span>
        </div>

        <div className="card-title-group">
          <div className="jenis-pill-wrapper">
            <span className="jenis-pill">{kelas.jenis}</span>
            <span className="tingkat-hint">
              {Number(tingkatDisplay) === 0 ? 'Jenjang Sifir' : `Tingkat ${tingkatDisplay}`}
            </span>
          </div>
          <h4 className="class-name" title={kelas.nama || '-'}>
            {kelas.nama || '-'}
          </h4>
        </div>
      </header>

      {/* Body: Structured Metadata Tiles */}
      <div className="card-body">
        {/* Mustahiq / Wali Kelas */}
        <div className="meta-tile">
          <div className="icon-socket">
            <User size={14} />
          </div>
          <div className="meta-text">
            <span className="meta-label">Wali Kelas / Mustahiq</span>
            <span className="meta-value" title={kelas.mustahiq_nama || 'Belum Ditentukan'}>
              {kelas.mustahiq_nama || 'Belum Ditentukan'}
            </span>
          </div>
        </div>

        {/* Kitab Muhafadzoh */}
        <div className="meta-tile">
          <div className="icon-socket">
            <Award size={14} />
          </div>
          <div className="meta-text">
            <span className="meta-label">Kitab Muhafadzoh</span>
            <span className="meta-value" title={kelas.muhafadzoh_nama || '-'}>
              {kelas.muhafadzoh_nama || '-'}
            </span>
          </div>
        </div>

        {/* Qiroatul Kitab */}
        <div className="meta-tile">
          <div className="icon-socket">
            <BookMarked size={14} />
          </div>
          <div className="meta-text">
            <span className="meta-label">Qiroatul Kitab</span>
            <span className="meta-value" title={kelas.qiroatul_nama || '-'}>
              {kelas.qiroatul_nama || '-'}
            </span>
          </div>
        </div>
      </div>

      {/* Footer: Tactile Action Buttons */}
      <footer className="card-footer">
        <button
          type="button"
          className="action-pill-btn btn-edit"
          onClick={() => onEdit(kelas)}
          title={`Ubah data ${kelas.nama}`}
        >
          <Edit3 size={13} />
          <span>Edit</span>
        </button>

        <button
          type="button"
          className="action-pill-btn btn-delete"
          onClick={() => onDelete(kelas.id, kelas.nama)}
          title={`Hapus data ${kelas.nama}`}
        >
          <Trash2 size={13} />
          <span>Hapus</span>
        </button>
      </footer>
    </article>
  );
};
