import { User, Phone, Mail, MapPin, Trophy, Calendar, Briefcase, GraduationCap, Eye, Edit, Trash2 } from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import './AlumniCard.scss';

export function AlumniCard({ alumni, onDetail, onEdit, onDelete }) {
  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return 'AL';
    return name
      .split(' ')
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="premium-alumni-card">
      {/* Background glow effect */}
      <div className="card-glow-effect"></div>

      {/* Header section */}
      <div className="card-header-section">
        <div className="alumni-avatar-circle">
          <span>{getInitials(alumni.nama)}</span>
        </div>
        
        <div className="alumni-title-info">
          <h4 className="alumni-name" title={alumni.nama}>
            {alumni.nama}
          </h4>
          <span className="alumni-nis">NIS: {alumni.nis || '-'}</span>
        </div>

        <div className="alumni-year-badge">
          <GraduationCap size={12} />
          <span>Lulus {alumni.tahun_lulus}</span>
        </div>
      </div>

      {/* Body Section */}
      <div className="card-body-section">
        {/* Kelas Terakhir */}
        {alumni.kelas_terakhir && (
          <div className="info-item">
            <div className="info-icon-wrapper">
              <GraduationCap size={14} />
            </div>
            <div className="info-text">
              <span className="info-label">Kelas Terakhir</span>
              <span className="info-value">{alumni.kelas_terakhir}</span>
            </div>
          </div>
        )}

        {/* Pekerjaan / Instansi */}
        {(alumni.pekerjaan || alumni.instansi) && (
          <div className="info-item">
            <div className="info-icon-wrapper">
              <Briefcase size={14} />
            </div>
            <div className="info-text">
              <span className="info-label">Pekerjaan</span>
              <span className="info-value">
                {alumni.pekerjaan || ''}
                {alumni.pekerjaan && alumni.instansi ? ` di ${alumni.instansi}` : (alumni.instansi || '')}
              </span>
            </div>
          </div>
        )}

        {/* No HP / Kontak */}
        {alumni.no_hp && (
          <div className="info-item">
            <div className="info-icon-wrapper">
              <Phone size={14} />
            </div>
            <div className="info-text">
              <span className="info-label">No. HP</span>
              <span className="info-value">{alumni.no_hp}</span>
            </div>
          </div>
        )}

        {/* Alamat Sekarang */}
        {alumni.alamat_sekarang && (
          <div className="info-item">
            <div className="info-icon-wrapper">
              <MapPin size={14} />
            </div>
            <div className="info-text">
              <span className="info-label">Alamat Sekarang</span>
              <span className="info-value" title={alumni.alamat_sekarang}>
                {alumni.alamat_sekarang}
              </span>
            </div>
          </div>
        )}

        {/* Prestasi Utama */}
        {alumni.prestasi_utama && (
          <div className="info-item">
            <div className="info-icon-wrapper text-gold">
              <Trophy size={14} />
            </div>
            <div className="info-text">
              <span className="info-label">Prestasi Utama</span>
              <span className="info-value text-gold-value" title={alumni.prestasi_utama}>
                {alumni.prestasi_utama}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Actions Section */}
      <div className="card-actions-section">
        <button
          type="button"
          className="action-btn detail-btn"
          onClick={() => onDetail(alumni.id)}
          title="Lihat detail lengkap"
        >
          <Eye size={13} />
          <span>Detail</span>
        </button>
        <button
          type="button"
          className="action-btn edit-btn"
          onClick={() => onEdit(alumni)}
          title="Ubah data alumni"
        >
          <Edit size={13} />
          <span>Edit</span>
        </button>
        <button
          type="button"
          className="action-btn delete-btn"
          onClick={() => onDelete(alumni.id, alumni.nama)}
          title="Hapus data alumni"
        >
          <Trash2 size={13} />
          <span>Hapus</span>
        </button>
      </div>
    </div>
  );
}
