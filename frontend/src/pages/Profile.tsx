import React, { useState, useEffect } from 'react';
import {
  User,
  Edit3,
  Lock,
  Mail,
  Phone,
  Clock,
  Calendar,
  Save,
  Camera,
  Shield,
  Layers,
  Settings,
  Image as ImageIcon,
  Trash2,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { profileService } from '../services/profileService';
import { settingsService } from '../services/settingsService';
import { useAuth } from '../context/AuthContext';
import { EditProfileModal } from '../components/features/EditProfileModal';
import { ChangePasswordModal } from '../components/features/ChangePasswordModal';
import { FloatingInput } from '../components/ui/FloatingInput';
import { CustomSelect } from '../components/ui/CustomSelect';
import { LoadingState, ErrorState, useToast } from '../components/common';
import {
  UserProfile,
  EditProfileFormData,
  ChangePasswordFormData
} from '../types/profile';
import './Profile.scss';

export function Profile() {
  const toast = useToast();
  const { isAdmin } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [editModalError, setEditModalError] = useState<string | null>(null);
  const [passwordModalError, setPasswordModalError] = useState<string | null>(null);

  // System Settings (Admin only)
  const [appNameState, setAppNameState] = useState<string>('Sekolah Info');
  const [activeSemesterState, setActiveSemesterState] = useState<string>('Ganjil');
  const [fileList, setFileList] = useState<{ file?: File; url: string; name?: string }[]>([]);
  const [settingsLoading, setSettingsLoading] = useState<boolean>(false);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (isAdmin()) {
      loadSettings();
    }
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await profileService.fetchProfile();
      setProfile(data);
    } catch (err: unknown) {
      console.error('Gagal memuat profil:', err);
      const msg = err instanceof Error ? err.message : 'Gagal memuat profil pengguna';
      setError(msg);
      toast.show(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const data = await settingsService.fetchSettings();
      if (data) {
        if (data.app_name) setAppNameState(data.app_name);
        if (data.active_semester) setActiveSemesterState(data.active_semester);
        if (data.app_logo) {
          setFileList([{ url: data.app_logo, name: 'logo.png' }]);
        }
      }
    } catch (err: unknown) {
      console.error('Failed to load settings:', err);
    }
  };

  const handleEditClick = () => {
    setEditModalError(null);
    setIsEditModalOpen(true);
  };

  const handlePasswordClick = () => {
    setPasswordModalError(null);
    setIsPasswordModalOpen(true);
  };

  const handleEditSubmit = async (data: EditProfileFormData) => {
    setIsSubmitting(true);
    setEditModalError(null);

    try {
      await profileService.updateProfile(data);
      toast.show('Profil Anda berhasil diperbarui!', 'success');
      setIsEditModalOpen(false);
      await loadProfile();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui profil';
      setEditModalError(msg);
      toast.show(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (data: ChangePasswordFormData) => {
    setIsSubmitting(true);
    setPasswordModalError(null);

    try {
      await profileService.changePassword(data);
      toast.show('Kata sandi berhasil diubah! Gunakan password baru saat login berikutnya.', 'success');
      setIsPasswordModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengubah password';
      setPasswordModalError(msg);
      toast.show(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.show('Hanya file gambar yang diperbolehkan!', 'error');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.show('Ukuran file maksimal 2MB!', 'error');
      return;
    }

    try {
      setLoading(true);
      const result = await profileService.uploadAvatar(file);
      if (result && result.url) {
        setProfile(prev => (prev ? { ...prev, photo_url: result.url } : prev));
        toast.show('Foto profil berhasil diunggah!', 'success');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengunggah foto profil';
      toast.show(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.show('Hanya file gambar yang diperbolehkan untuk logo!', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = uploadEvent => {
      if (uploadEvent.target?.result) {
        setFileList([{ file, url: uploadEvent.target.result as string }]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSettingsLoading(true);
      let logoUrl = fileList.length > 0 ? fileList[0].url : null;
      if (fileList.length > 0 && fileList[0].file) {
        const uploadRes = await settingsService.uploadLogo(fileList[0].file);
        logoUrl = uploadRes.url;
      }

      await settingsService.updateSettings({
        app_name: appNameState,
        active_semester: activeSemesterState,
        app_logo: logoUrl
      });
      toast.show('Pengaturan sistem berhasil diperbarui!', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui pengaturan sistem';
      toast.show(msg, 'error');
    } finally {
      setSettingsLoading(false);
    }
  };

  const getRoleBadge = (role?: string) => {
    const r = (role || '').toLowerCase();
    switch (r) {
      case 'admin':
        return <span className="profile-role-pill pill-admin">Administrator</span>;
      case 'madrasah_diniyah':
        return <span className="profile-role-pill pill-md">Madrasah Diniyah</span>;
      case 'bendahara':
        return <span className="profile-role-pill pill-bendahara">Bendahara</span>;
      case 'guru':
        return <span className="profile-role-pill pill-guru">Dewan Asatidz</span>;
      default:
        return <span className="profile-role-pill pill-default">{role || 'Pengguna'}</span>;
    }
  };

  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  if (loading && !profile) {
    return <LoadingState message="Memuat profil pengguna..." />;
  }

  if (error && !profile) {
    return <ErrorState message={error} onRetry={loadProfile} />;
  }

  const initial = (profile?.full_name || profile?.username || '?')[0].toUpperCase();

  return (
    <div className="profile-page-container">
      {/* 🍏 Sacred Dock Header (Option A) */}
      <div className="tactile-page-header">
        <div className="header-text-block">
          <h2 className="page-title">Profil Pengguna</h2>
          <p className="page-subtitle">
            Kelola informasi akun personal, keamanan kata sandi, dan setelan umum sistem
          </p>
        </div>

        <div className="header-action-dock">
          <button
            type="button"
            className="action-pill-btn secondary-pill"
            onClick={loadProfile}
            title="Muat Ulang Profil"
          >
            <RefreshCw size={15} />
            <span>Segarkan</span>
          </button>
          <button
            type="button"
            className="action-pill-btn secondary-pill"
            onClick={handlePasswordClick}
          >
            <Lock size={15} />
            <span>Ubah Password</span>
          </button>
          <button
            type="button"
            className="action-pill-btn primary-pill"
            onClick={handleEditClick}
          >
            <Edit3 size={15} />
            <span>Edit Profil</span>
          </button>
        </div>
      </div>

      {/* 👤 Hero Profile Liquid Glass Card */}
      {profile && (
        <div className="profile-hero-card">
          <div className="hero-top-section">
            <div
              className="avatar-lens-orb"
              onClick={() => document.getElementById('avatar-input')?.click()}
              title="Klik untuk mengubah foto profil"
            >
              {profile.photo_url ? (
                <img src={profile.photo_url} alt="avatar" className="avatar-img" />
              ) : (
                <span className="avatar-initial">{initial}</span>
              )}
              <div className="camera-badge">
                <Camera size={13} />
              </div>
              <input
                id="avatar-input"
                type="file"
                style={{ display: 'none' }}
                onChange={handleAvatarFileChange}
                accept="image/*"
              />
            </div>

            <div className="hero-meta-block">
              <div className="name-and-role">
                <h3 className="hero-full-name">{profile.full_name}</h3>
                {getRoleBadge(profile.role)}
              </div>
              <span className="hero-username">@{profile.username}</span>
            </div>
          </div>

          <div className="hero-divider" />

          {/* Inset Account Details Grid */}
          <div className="account-details-grid">
            <div className="inset-detail-box">
              <span className="detail-label">
                <User size={14} className="detail-icon" />
                <span>Username Akun</span>
              </span>
              <strong className="detail-value">{profile.username}</strong>
            </div>

            <div className="inset-detail-box">
              <span className="detail-label">
                <Mail size={14} className="detail-icon" />
                <span>Alamat Email</span>
              </span>
              <strong className="detail-value">{profile.email || '-'}</strong>
            </div>

            <div className="inset-detail-box">
              <span className="detail-label">
                <Phone size={14} className="detail-icon" />
                <span>Nomor HP / WhatsApp</span>
              </span>
              <strong className="detail-value">{profile.phone || '-'}</strong>
            </div>

            <div className="inset-detail-box">
              <span className="detail-label">
                <Clock size={14} className="detail-icon" />
                <span>Terakhir Masuk</span>
              </span>
              <strong className="detail-value">{formatDateTime(profile.last_login)}</strong>
            </div>

            <div className="inset-detail-box">
              <span className="detail-label">
                <Calendar size={14} className="detail-icon" />
                <span>Terdaftar Sejak</span>
              </span>
              <strong className="detail-value">{formatDateTime(profile.created_at)}</strong>
            </div>
          </div>
        </div>
      )}

      {/* ⚙️ System Settings Panel (Admin Only) */}
      {isAdmin() && (
        <div className="system-settings-card">
          <div className="settings-header">
            <div className="settings-icon-wrap">
              <Settings size={20} />
            </div>
            <div>
              <h3>Pengaturan Sistem Sekolah-Info</h3>
              <p>Konfigurasi parameter global aplikasi web dan pencetakan dokumen</p>
            </div>
          </div>

          <form onSubmit={handleSaveSettings} className="settings-form">
            <div className="settings-fields-grid">
              <FloatingInput
                label="Nama Resmi Aplikasi / Lembaga"
                name="app_name"
                value={appNameState}
                onChange={e => setAppNameState(e.target.value)}
                required
                disabled={settingsLoading}
              />

              <CustomSelect
                label="Semester Berjalan Aktif"
                value={activeSemesterState}
                onChange={val => setActiveSemesterState(val)}
                options={[
                  { label: 'Semester Ganjil', value: 'Ganjil' },
                  { label: 'Semester Genap', value: 'Genap' }
                ]}
                required
              />
            </div>

            <div className="logo-upload-group">
              <label className="logo-label">Logo Resmi Lembaga</label>
              <div className="logo-picker-row">
                {fileList.length > 0 && fileList[0].url ? (
                  <div className="logo-preview-box">
                    <img src={fileList[0].url} alt="Logo Aplikasi" className="logo-preview-img" />
                  </div>
                ) : (
                  <div className="logo-empty-box">
                    <ImageIcon size={28} />
                    <span>Belum ada logo</span>
                  </div>
                )}

                <div className="logo-actions">
                  <button
                    type="button"
                    className="action-pill-btn secondary-pill"
                    onClick={() => document.getElementById('logo-input')?.click()}
                    disabled={settingsLoading}
                  >
                    <ImageIcon size={14} />
                    <span>Pilih Logo Baru</span>
                  </button>
                  <input
                    id="logo-input"
                    type="file"
                    style={{ display: 'none' }}
                    onChange={handleLogoFileChange}
                    accept="image/*"
                  />

                  {fileList.length > 0 && (
                    <button
                      type="button"
                      className="action-pill-btn danger-pill mini-pill"
                      onClick={() => setFileList([])}
                      disabled={settingsLoading}
                    >
                      <Trash2 size={13} />
                      <span>Hapus</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="settings-submit-row">
              <button
                type="submit"
                className="action-pill-btn primary-pill large-pill"
                disabled={settingsLoading}
              >
                <Save size={16} />
                <span>{settingsLoading ? 'Menyimpan Pengaturan...' : 'Simpan Pengaturan Sistem'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ✏️ Modals */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditSubmit}
        profileData={profile}
        isSubmitting={isSubmitting}
        error={editModalError}
      />

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSubmit={handlePasswordSubmit}
        isSubmitting={isSubmitting}
        error={passwordModalError}
      />
    </div>
  );
}

export default Profile;
