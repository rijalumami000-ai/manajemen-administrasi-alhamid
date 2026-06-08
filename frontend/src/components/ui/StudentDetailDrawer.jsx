import { User, MapPin, Calendar, Phone, Briefcase, GraduationCap } from 'lucide-react';
import { CustomDrawer } from './CustomDrawer';
import { ProgressRing } from './ProgressRing';
import { StatusChip } from './StatusChip';
import './StudentDetailDrawer.scss';

export function StudentDetailDrawer({ open, onClose, santri }) {
  if (!santri) return null;

  // Calculate profile completeness
  let completeness = 0;
  if (santri.nama) completeness += 10;
  if (santri.nis) completeness += 10;
  if (santri.nik) completeness += 10;
  if (santri.tempat_lahir && santri.tanggal_lahir) completeness += 15;
  if (santri.alamat) completeness += 10;
  if (santri.nama_ayah || santri.nama_ibu) completeness += 15;
  if (santri.is_face_registered || santri.qr_code || santri.nfc_uid || santri.fingerprint_id) completeness += 20;
  if (santri.foto_url) completeness += 10;

  const API_BASE = import.meta.env.VITE_API_URL || '';

  return (
    <CustomDrawer 
      open={open} 
      onClose={onClose} 
      title="Profil Santri" 
      subtitle="Detail lengkap dan status biometrik"
      icon={<User size={20} />}
      width={480}
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
              <span className="nis-badge">{santri.nis}</span>
              <span className="gender-text">{santri.jenis_kelamin}</span>
            </div>
          </div>
        </div>

        {/* Biometric Status Block */}
        <div className="detail-section">
          <h4 className="detail-section__title">Status Biometrik</h4>
          <div className="biometric-grid">
            <div className="biometric-item">
              <span className="biometric-label">Face ID</span>
              <StatusChip active={santri.is_face_registered} label={santri.is_face_registered ? 'Aktif' : 'Belum'} size="md" />
            </div>
            <div className="biometric-item">
              <span className="biometric-label">QR Code</span>
              <StatusChip active={!!santri.qr_code} label={santri.qr_code ? 'Aktif' : 'Belum'} size="md" />
            </div>
            <div className="biometric-item">
              <span className="biometric-label">NFC Card</span>
              <StatusChip active={!!santri.nfc_uid} label={santri.nfc_uid ? 'Aktif' : 'Belum'} size="md" />
            </div>
            <div className="biometric-item">
              <span className="biometric-label">Fingerprint</span>
              <StatusChip active={!!santri.fingerprint_id} label={santri.fingerprint_id ? 'Aktif' : 'Belum'} size="md" />
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
              <Calendar size={16} />
              <div>
                <span className="info-label">Tahun Masuk</span>
                <span className="info-value">{santri.tahun_masuk || '-'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Personal Block */}
        <div className="detail-section">
          <h4 className="detail-section__title">Data Pribadi</h4>
          <div className="info-list">
            <div className="info-row">
              <Calendar size={16} />
              <div>
                <span className="info-label">Tempat, Tanggal Lahir</span>
                <span className="info-value">
                  {santri.tempat_lahir || '-'}, {santri.tanggal_lahir ? new Date(santri.tanggal_lahir).toLocaleDateString('id-ID') : '-'}
                </span>
              </div>
            </div>
            <div className="info-row">
              <MapPin size={16} />
              <div>
                <span className="info-label">Alamat</span>
                <span className="info-value">{santri.alamat || '-'}</span>
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
              <div className="parent-detail"><Briefcase size={12}/> {santri.pekerjaan_ayah || '-'}</div>
              <div className="parent-detail"><Phone size={12}/> {santri.no_hp_ayah || '-'}</div>
            </div>
            <div className="parent-card">
              <div className="parent-role">Ibu</div>
              <div className="parent-name">{santri.nama_ibu || '-'}</div>
              <div className="parent-detail"><Briefcase size={12}/> {santri.pekerjaan_ibu || '-'}</div>
              <div className="parent-detail"><Phone size={12}/> {santri.no_hp_ibu || '-'}</div>
            </div>
          </div>
        </div>

      </div>
    </CustomDrawer>
  );
}
