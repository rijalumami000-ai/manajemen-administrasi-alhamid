import { BookOpen, User, Award, BookMarked, Edit, Trash2 } from 'lucide-react';
import './KelasCard.scss';

export function KelasCard({ kelas, onEdit, onDelete }) {
  const isSekolah = kelas.jenis === 'Sekolah';
  const themeClass = isSekolah ? 'theme-sekolah' : 'theme-diniyah';

  return (
    <div className={`premium-kelas-card ${themeClass}`}>
      {/* Background Glow Effect */}
      <div className="card-glow-effect"></div>

      {/* Header Info Section */}
      <div className="card-header-section">
        <div className="class-badge-circle" title={`Tingkat Kelas: ${kelas.tingkat !== null ? kelas.tingkat : '0'}`}>
          <span>{kelas.tingkat !== null ? kelas.tingkat : '0'}</span>
        </div>
        <div className="class-title-info">
          <span className="class-type-pill">{kelas.jenis}</span>
          <h4 className="class-name" title={kelas.nama || '-'}>
            {kelas.nama || '-'}
          </h4>
        </div>
      </div>

      {/* Body Metadata Settings Section */}
      <div className="card-body-section">
        {/* Mustahiq / Wali Kelas */}
        <div className="info-item mustahiq-info">
          <div className="info-icon-wrapper">
            <User size={15} />
          </div>
          <div className="info-text">
            <span className="info-label">Wali Kelas / Mustahiq</span>
            <span className="info-value" title={kelas.mustahiq_nama || 'Belum Ditentukan'}>
              {kelas.mustahiq_nama || 'Belum Ditentukan'}
            </span>
          </div>
        </div>

        {/* Kitab Muhafadzoh */}
        <div className="info-item book-info">
          <div className="info-icon-wrapper">
            <Award size={15} />
          </div>
          <div className="info-text">
            <span className="info-label">Kitab Muhafadzoh</span>
            <span className="info-value" title={kelas.muhafadzoh_nama || 'Belum Diatur'}>
              {kelas.muhafadzoh_nama || '-'}
            </span>
          </div>
        </div>

        {/* Kitab Qiroah */}
        <div className="info-item book-info">
          <div className="info-icon-wrapper">
            <BookMarked size={15} />
          </div>
          <div className="info-text">
            <span className="info-label">Qiroatul Kitab</span>
            <span className="info-value" title={kelas.qiroatul_nama || 'Belum Diatur'}>
              {kelas.qiroatul_nama || '-'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons Footer */}
      <div className="card-actions-section">
        <button
          type="button"
          className="action-btn edit-btn"
          onClick={() => onEdit(kelas)}
          title="Ubah konfigurasi kelas"
        >
          <Edit size={13} />
          <span>Edit</span>
        </button>
        <button
          type="button"
          className="action-btn delete-btn"
          onClick={() => onDelete(kelas.id, kelas.nama)}
          title="Hapus kelas permanen"
        >
          <Trash2 size={13} />
          <span>Hapus</span>
        </button>
      </div>
    </div>
  );
}
