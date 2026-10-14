import { User, MapPin, Calendar, Phone, Briefcase, GraduationCap, FileText, Award, Building, CreditCard } from 'lucide-react';
import { CustomDrawer } from './CustomDrawer';
import { ProgressRing } from './ProgressRing';
import { formatDateDMY, calculateProfileCompleteness, formatGender } from '../../utils/studentUtils';
import './StudentDetailDrawer.scss';

export function StudentDetailDrawer({ open, onClose, santri }) {
  if (!santri) return null;

  // Calculate profile completeness accurately based on actual data
  const completeness = calculateProfileCompleteness(santri);

  const API_BASE = import.meta.env.VITE_API_URL || '';

  const getStatusBadgeClass = (status) => {
    if (!status || status === 'Aktif') return 'active';
    const s = String(status).toLowerCase();
    if (s.includes('lulus')) return 'lulus';
    if (s.includes('boyong')) return 'boyong';
    if (s.includes('keluar') || s.includes('dikeluarkan')) return 'out';
    return 'out';
  };

  return (
    <CustomDrawer 
      open={open} 
      onClose={onClose} 
      title="Profil Santri" 
      subtitle="Detail lengkap profil santri"
      icon={<User size={20} />}
      width={520}
    >
      <div className="student-detail-drawer">
        {/* Profile Header Block */}
        <div className="profile-header-block">
          <div className="profile-avatar-wrap">
            {santri.foto_url && (
              <img 
                src={`${API_BASE}${santri.foto_url}`} 
                alt={santri.nama} 
                className="profile-avatar" 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'flex';
                }} 
              />
            )}
            <div 
              className="profile-avatar-placeholder" 
              style={{ display: santri.foto_url ? 'none' : 'flex' }}
            >
              <User size={40} />
            </div>
            <div className="completeness-badge">
              <ProgressRing percent={completeness} size={36} strokeWidth={3} />
            </div>
          </div>
          
          <div className="profile-info">
            <h2 className="profile-name">{santri.nama}</h2>
            <div className="profile-meta">
              <span className="nis-badge">NIS: {santri.nis}</span>
              <span className="gender-text">{formatGender(santri.jenis_kelamin)}</span>
              <span className="year-text">• Masuk: {santri.tahun_masuk || '-'}</span>
            </div>
          </div>
        </div>

        {/* Status Keaktifan & Tahun Masuk Static Info Block */}
        <div className="status-keaktifan-summary-card">
          <div className="summary-col">
            <span className="summary-label">Tahun Masuk</span>
            <span className="summary-val-highlight">{santri.tahun_masuk || '-'}</span>
          </div>
          <div className="summary-col">
            <span className="summary-label">Status Madin</span>
            <span className={`summary-pill ${getStatusBadgeClass(santri.keluar_madin_status)}`}>
              <span className="pill-dot"></span>
              {santri.keluar_madin_status || 'Aktif'}
            </span>
          </div>
          <div className="summary-col">
            <span className="summary-label">Status Pondok</span>
            <span className={`summary-pill ${getStatusBadgeClass(santri.keluar_pondok_status)}`}>
              <span className="pill-dot"></span>
              {santri.keluar_pondok_status || 'Aktif'}
            </span>
          </div>
          <div className="summary-col">
            <span className="summary-label">Status Sekolah</span>
            <span className={`summary-pill ${getStatusBadgeClass(santri.keluar_sekolah_status)}`}>
              <span className="pill-dot"></span>
              {santri.keluar_sekolah_status || 'Aktif'}
            </span>
          </div>
        </div>

        {/* Data Pribadi & Identitas */}
        <div className="detail-section">
          <h4 className="detail-section__title">Data Pribadi & Identitas</h4>
          <div className="info-list">
            <div className="info-row">
              <CreditCard size={16} />
              <div>
                <span className="info-label">NIK</span>
                <span className="info-value">{santri.nik || '-'}</span>
              </div>
            </div>
            <div className="info-row">
              <User size={16} />
              <div>
                <span className="info-label">Jenis Kelamin</span>
                <span className="info-value">{formatGender(santri.jenis_kelamin)}</span>
              </div>
            </div>
            <div className="info-row">
              <Calendar size={16} />
              <div>
                <span className="info-label">Tempat, Tanggal Lahir</span>
                <span className="info-value">
                  {santri.tempat_lahir || '-'}, {formatDateDMY(santri.tanggal_lahir)}
                </span>
              </div>
            </div>
            <div className="info-row">
              <User size={16} />
              <div>
                <span className="info-label">Anak Ke / Status Keluarga</span>
                <span className="info-value">
                  Anak ke-{santri.anak_ke ?? '-'} • {santri.status_keluarga || 'Kandung'}
                </span>
              </div>
            </div>
            <div className="info-row">
              <Building size={16} />
              <div>
                <span className="info-label">Agama</span>
                <span className="info-value">{santri.agama || 'Islam'}</span>
              </div>
            </div>
            <div className="info-row">
              <MapPin size={16} />
              <div>
                <span className="info-label">Alamat Lengkap</span>
                <span className="info-value">{santri.alamat || '-'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Academic Block */}
        <div className="detail-section">
          <h4 className="detail-section__title">Data Akademik & Asrama</h4>
          <div className="info-list">
            <div className="info-row">
              <GraduationCap size={16} />
              <div>
                <span className="info-label">Kelas Diniyah</span>
                <span className="info-value">{santri.kelas_diniyah || '-'}</span>
              </div>
            </div>
            <div className="info-row">
              <GraduationCap size={16} />
              <div>
                <span className="info-label">Kelas Sekolah</span>
                <span className="info-value">{santri.kelas_sekolah || '-'}</span>
              </div>
            </div>
            <div className="info-row">
              <Building size={16} />
              <div>
                <span className="info-label">Kamar Asrama</span>
                <span className="info-value">{santri.nama_kamar || '-'}</span>
              </div>
            </div>
            <div className="info-row">
              <Calendar size={16} />
              <div>
                <span className="info-label">Tahun Masuk</span>
                <span className="info-value">{santri.tahun_masuk || '-'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Parent Block */}
        <div className="detail-section">
          <h4 className="detail-section__title">Data Orang Tua</h4>
          <div className="parent-cards">
            <div className="parent-card">
              <div className="parent-role">Ayah</div>
              <div className="parent-name">{santri.nama_ayah || '-'}</div>
              <div className="parent-detail"><CreditCard size={12}/> NIK: {santri.nik_ayah || '-'}</div>
              <div className="parent-detail"><Briefcase size={12}/> {santri.pekerjaan_ayah || '-'}</div>
              <div className="parent-detail"><Phone size={12}/> {santri.no_hp_ayah || '-'}</div>
            </div>
            <div className="parent-card">
              <div className="parent-role">Ibu</div>
              <div className="parent-name">{santri.nama_ibu || '-'}</div>
              <div className="parent-detail"><CreditCard size={12}/> NIK: {santri.nik_ibu || '-'}</div>
              <div className="parent-detail"><Briefcase size={12}/> {santri.pekerjaan_ibu || '-'}</div>
              <div className="parent-detail"><Phone size={12}/> {santri.no_hp_ibu || '-'}</div>
            </div>
          </div>
        </div>

        {/* Info Administratif Instansi */}
        <div className="detail-section">
          <h4 className="detail-section__title">Info Administratif Instansi</h4>
          <div className="info-list">
            <div className="info-row">
              <FileText size={16} />
              <div>
                <span className="info-label">Status Santri Saat Masuk</span>
                <span className="info-value">
                  {santri.status_masuk || 'Baru'}
                  {santri.status_masuk === 'Pindahan' && santri.pesantren_sebelumnya ? ` (Asal Pesantren: ${santri.pesantren_sebelumnya})` : ''}
                </span>
              </div>
            </div>
            <div className="info-row">
              <Building size={16} />
              <div>
                <span className="info-label">Sekolah/Madrasah Asal (Sebelum di sini)</span>
                <span className="info-value">
                  {santri.sekolah_asal_nama ? `${santri.sekolah_asal_nama} - ${santri.sekolah_asal_alamat || 'Alamat tidak dicantumkan'}` : '-'}
                </span>
              </div>
            </div>
            <div className="info-row">
              <GraduationCap size={16} />
              <div>
                <span className="info-label">Masuk ke Madin / Pondok</span>
                <span className="info-value">
                  Diterima di Kelas: {santri.diterima_kelas_madin || '-'} • Tanggal: {formatDateDMY(santri.diterima_tanggal_madin)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Data Kelulusan / Alumni */}
        <div className="detail-section">
          <h4 className="detail-section__title">Data Kelulusan / Alumni</h4>
          <div className="info-list">
            <div className="info-row">
              <Award size={16} />
              <div>
                <span className="info-label">Keluar / Lulus dari Madin</span>
                <span className="info-value">
                  Status: <strong>{santri.keluar_madin_status || 'Belum'}</strong> • Tanggal: {formatDateDMY(santri.keluar_madin_tanggal)}
                </span>
              </div>
            </div>
            <div className="info-row">
              <Building size={16} />
              <div>
                <span className="info-label">Keluar / Boyong dari Pondok</span>
                <span className="info-value">
                  Status: <strong>{santri.keluar_pondok_status || 'Belum'}</strong> • Tanggal: {formatDateDMY(santri.keluar_pondok_tanggal)}
                </span>
              </div>
            </div>
            <div className="info-row">
              <GraduationCap size={16} />
              <div>
                <span className="info-label">Lulus / Keluar dari Sekolah</span>
                <span className="info-value">
                  Jenjang: {santri.keluar_sekolah_tingkat || '-'} • Status: <strong>{santri.keluar_sekolah_status || 'Belum'}</strong> • Tanggal: {formatDateDMY(santri.keluar_sekolah_tanggal)}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </CustomDrawer>
  );
}
