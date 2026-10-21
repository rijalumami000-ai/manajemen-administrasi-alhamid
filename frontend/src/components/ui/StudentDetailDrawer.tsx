import React, { useState } from 'react';
import {
  User,
  MapPin,
  Calendar,
  Phone,
  Briefcase,
  GraduationCap,
  FileText,
  Award,
  Building,
  CreditCard,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Home
} from 'lucide-react';
import { CustomDrawer } from './CustomDrawer';
import { ProgressRing } from './ProgressRing';
import { formatDateDMY, calculateProfileCompleteness, formatGender } from '../../utils/studentUtils';
import { BukuIndukSantri } from '../../types/bukuInduk';
import './StudentDetailDrawer.scss';

export interface StudentDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  santri: BukuIndukSantri | any | null;
}

export function StudentDetailDrawer({ open, onClose, santri }: StudentDetailDrawerProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!santri) return null;

  const completeness = calculateProfileCompleteness(santri);
  const API_BASE = import.meta.env.VITE_API_URL || '';

  const handleCopy = (text: string, fieldName: string) => {
    if (!text || text === '-') return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getStatusBadgeClass = (status?: string | null) => {
    if (!status || status === 'Aktif') return 'status-active';
    const s = String(status).toLowerCase();
    if (s.includes('lulus')) return 'status-lulus';
    if (s.includes('boyong')) return 'status-boyong';
    if (s.includes('keluar') || s.includes('dikeluarkan')) return 'status-out';
    return 'status-out';
  };

  return (
    <CustomDrawer
      open={open}
      onClose={onClose}
      title="Profil & Buku Induk Santri"
      subtitle="Arsip data kesiswaan terpusat"
      icon={<User size={18} />}
      width={560}
    >
      <div className="student-bento-profile-drawer">
        {/* 1. HERO IDENTITY BENTO CARD */}
        <div className="hero-identity-bento">
          <div className="avatar-lens-wrap">
            {santri.foto_url ? (
              <img
                src={`${API_BASE}${santri.foto_url}`}
                alt={santri.nama}
                className="bento-avatar-img"
                onError={(e: any) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className="bento-avatar-fallback"
              style={{ display: santri.foto_url ? 'none' : 'flex' }}
            >
              <User size={38} />
            </div>

            <div className="avatar-ring-indicator" title={`Kelengkapan Profil: ${completeness}%`}>
              <ProgressRing percent={completeness} size={38} strokeWidth={3.5} />
            </div>
          </div>

          <div className="identity-details">
            <h3 className="student-full-name">{santri.nama}</h3>

            <div className="identity-tags-row">
              <button
                type="button"
                className="nis-copy-chip"
                onClick={() => handleCopy(santri.nis, 'nis')}
                title="Klik untuk menyalin NIS"
              >
                <span>NIS: {santri.nis}</span>
                {copiedField === 'nis' ? <Check size={12} className="copy-ok" /> : <Copy size={12} />}
              </button>

              <span className={`gender-capsule-tag ${String(santri.jenis_kelamin).toUpperCase() === 'L' || String(santri.jenis_kelamin).toLowerCase() === 'laki-laki' ? 'male' : 'female'}`}>
                {formatGender(santri.jenis_kelamin)}
              </span>

              {santri.tahun_masuk && (
                <span className="year-capsule-tag">Angkatan {santri.tahun_masuk}</span>
              )}
            </div>

            {/* Profile Completeness Progress Micro-Bar */}
            <div className="completeness-bar-wrap">
              <div className="completeness-bar-header">
                <span className="completeness-label">Kelengkapan Data</span>
                <span className="completeness-percent">{completeness}%</span>
              </div>
              <div className="completeness-track">
                <div
                  className="completeness-fill"
                  style={{ width: `${completeness}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. TRI-INSTITUTIONAL STATUS BENTO TILES */}
        <div className="tri-status-bento-grid">
          {/* Madin Tile */}
          <div className="status-tile">
            <div className="status-tile-header">
              <span className="tile-lead-label">Diniyah</span>
              <span className={`status-pill ${getStatusBadgeClass(santri.keluar_madin_status)}`}>
                <span className="pill-dot" />
                <span>{santri.keluar_madin_status || 'Aktif'}</span>
              </span>
            </div>
            <div className="status-tile-val">
              <GraduationCap size={15} />
              <span>{santri.kelas_diniyah || 'Belum ada kelas'}</span>
            </div>
          </div>

          {/* Pondok Tile */}
          <div className="status-tile">
            <div className="status-tile-header">
              <span className="tile-lead-label">Pesantren</span>
              <span className={`status-pill ${getStatusBadgeClass(santri.keluar_pondok_status)}`}>
                <span className="pill-dot" />
                <span>{santri.keluar_pondok_status || 'Aktif'}</span>
              </span>
            </div>
            <div className="status-tile-val">
              <Home size={15} />
              <span>{santri.nama_kamar || 'Belum ada kamar'}</span>
            </div>
          </div>

          {/* Formal School Tile */}
          <div className="status-tile">
            <div className="status-tile-header">
              <span className="tile-lead-label">Formal</span>
              <span className={`status-pill ${getStatusBadgeClass(santri.keluar_sekolah_status)}`}>
                <span className="pill-dot" />
                <span>{santri.keluar_sekolah_status || 'Aktif'}</span>
              </span>
            </div>
            <div className="status-tile-val">
              <Building size={15} />
              <span>{santri.kelas_sekolah || 'Belum ada kelas'}</span>
            </div>
          </div>
        </div>

        {/* 3. PERSONAL IDENTITY BENTO */}
        <div className="bento-section-card">
          <div className="bento-section-header">
            <div className="header-orb">
              <User size={15} />
            </div>
            <h4>Data Pribadi & Identitas Kependudukan</h4>
          </div>

          <div className="bento-fields-grid">
            <div className="bento-field-tile">
              <div className="field-icon-label">
                <CreditCard size={13} />
                <span>Nomor Induk Kependudukan (NIK)</span>
              </div>
              <div className="field-value">
                {santri.nik ? (
                  <span className="copyable-val" onClick={() => handleCopy(santri.nik, 'nik')} title="Klik untuk menyalin">
                    {santri.nik}
                    {copiedField === 'nik' ? <Check size={12} className="copy-ok" /> : <Copy size={12} />}
                  </span>
                ) : (
                  <span className="missing-pill">Belum diisi</span>
                )}
              </div>
            </div>

            <div className="bento-field-tile">
              <div className="field-icon-label">
                <Calendar size={13} />
                <span>Tempat, Tanggal Lahir</span>
              </div>
              <div className="field-value">
                {santri.tempat_lahir || santri.tanggal_lahir ? (
                  <span>{santri.tempat_lahir || '-'}, {formatDateDMY(santri.tanggal_lahir)}</span>
                ) : (
                  <span className="missing-pill">Belum diisi</span>
                )}
              </div>
            </div>

            <div className="bento-field-tile">
              <div className="field-icon-label">
                <User size={13} />
                <span>Anak Ke / Status Keluarga</span>
              </div>
              <div className="field-value">
                <span>Anak ke-{santri.anak_ke ?? '-'} &bull; {santri.status_keluarga || 'Kandung'}</span>
              </div>
            </div>

            <div className="bento-field-tile">
              <div className="field-icon-label">
                <Building size={13} />
                <span>Agama</span>
              </div>
              <div className="field-value">
                <span>{santri.agama || 'Islam'}</span>
              </div>
            </div>

            <div className="bento-field-tile full-span">
              <div className="field-icon-label">
                <MapPin size={13} />
                <span>Alamat Domisili Lengkap</span>
              </div>
              <div className="field-value">
                {santri.alamat ? (
                  <span>{santri.alamat}</span>
                ) : (
                  <span className="missing-pill">Belum ada alamat</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 4. PARENT & GUARDIAN BENTO CARDS */}
        <div className="bento-section-card">
          <div className="bento-section-header">
            <div className="header-orb">
              <Briefcase size={15} />
            </div>
            <h4>Data Orang Tua / Wali</h4>
          </div>

          <div className="parents-bento-grid">
            {/* Father Bento Card */}
            <div className="parent-bento-box">
              <div className="parent-box-header">
                <span className="parent-role-badge ayah">Ayah</span>
                <span className="parent-name-title">{santri.nama_ayah || 'Belum diisi'}</span>
              </div>
              <div className="parent-box-details">
                <div className="p-detail-row">
                  <CreditCard size={12} />
                  <span>NIK: {santri.nik_ayah || '-'}</span>
                </div>
                <div className="p-detail-row">
                  <Briefcase size={12} />
                  <span>Pekerjaan: {santri.pekerjaan_ayah || '-'}</span>
                </div>
                <div className="p-detail-row">
                  <Phone size={12} />
                  {santri.no_hp_ayah ? (
                    <span className="phone-copyable" onClick={() => handleCopy(santri.no_hp_ayah, 'hp_ayah')} title="Salin nomor HP">
                      {santri.no_hp_ayah}
                      {copiedField === 'hp_ayah' ? <Check size={11} className="copy-ok" /> : <Copy size={11} />}
                    </span>
                  ) : (
                    <span className="muted-text">No. HP: -</span>
                  )}
                </div>
              </div>
            </div>

            {/* Mother Bento Card */}
            <div className="parent-bento-box">
              <div className="parent-box-header">
                <span className="parent-role-badge ibu">Ibu</span>
                <span className="parent-name-title">{santri.nama_ibu || 'Belum diisi'}</span>
              </div>
              <div className="parent-box-details">
                <div className="p-detail-row">
                  <CreditCard size={12} />
                  <span>NIK: {santri.nik_ibu || '-'}</span>
                </div>
                <div className="p-detail-row">
                  <Briefcase size={12} />
                  <span>Pekerjaan: {santri.pekerjaan_ibu || '-'}</span>
                </div>
                <div className="p-detail-row">
                  <Phone size={12} />
                  {santri.no_hp_ibu ? (
                    <span className="phone-copyable" onClick={() => handleCopy(santri.no_hp_ibu, 'hp_ibu')} title="Salin nomor HP">
                      {santri.no_hp_ibu}
                      {copiedField === 'hp_ibu' ? <Check size={11} className="copy-ok" /> : <Copy size={11} />}
                    </span>
                  ) : (
                    <span className="muted-text">No. HP: -</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 5. ACADEMIC & ALUMNI MILESTONE BENTO */}
        <div className="bento-section-card">
          <div className="bento-section-header">
            <div className="header-orb">
              <Award size={15} />
            </div>
            <h4>Riwayat Penerimaan & Kelulusan (Alumni)</h4>
          </div>

          <div className="milestones-bento-list">
            <div className="milestone-item">
              <div className="milestone-dot" />
              <div className="milestone-info">
                <span className="m-label">Status Saat Pertama Masuk</span>
                <span className="m-val">
                  {santri.status_masuk || 'Santri Baru'}
                  {santri.status_masuk === 'Pindahan' && santri.pesantren_sebelumnya
                    ? ` (Asal: ${santri.pesantren_sebelumnya})`
                    : ''}
                </span>
                {santri.sekolah_asal_nama && (
                  <span className="m-sub">Sekolah Asal: {santri.sekolah_asal_nama}</span>
                )}
              </div>
            </div>

            <div className="milestone-item">
              <div className="milestone-dot" />
              <div className="milestone-info">
                <span className="m-label">Penerimaan di Diniyah & Pondok</span>
                <span className="m-val">
                  Diterima di Kelas: <strong>{santri.diterima_kelas_madin || '-'}</strong> &bull; Tgl:{' '}
                  {formatDateDMY(santri.diterima_tanggal_madin)}
                </span>
              </div>
            </div>

            {(santri.keluar_madin_status || santri.keluar_pondok_status || santri.keluar_sekolah_status) && (
              <div className="milestone-item highlight-alumni">
                <div className="milestone-dot gold" />
                <div className="milestone-info">
                  <span className="m-label">Status Akhir & Arsip Kelulusan</span>
                  <div className="alumni-tags-wrap">
                    <span className="alumni-tag">
                      Madin: <strong>{santri.keluar_madin_status || 'Aktif'}</strong> ({formatDateDMY(santri.keluar_madin_tanggal)})
                    </span>
                    <span className="alumni-tag">
                      Pondok: <strong>{santri.keluar_pondok_status || 'Aktif'}</strong> ({formatDateDMY(santri.keluar_pondok_tanggal)})
                    </span>
                    <span className="alumni-tag">
                      Sekolah: <strong>{santri.keluar_sekolah_status || 'Aktif'}</strong> ({formatDateDMY(santri.keluar_sekolah_tanggal)})
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </CustomDrawer>
  );
}
