import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Edit2, Lock, Mail, Phone, Clock, Calendar, Save, Check } from 'lucide-react';
import { profileService } from '../services/profileService';
import { EditProfileModal } from '../components/features/EditProfileModal';
import { ChangePasswordModal } from '../components/features/ChangePasswordModal';
import { PageHeader, LoadingState, ErrorState } from '../components/common';
import { CustomTag } from '../components/ui/CustomTag';
import { FloatingInput } from '../components/ui/FloatingInput';
import { CustomSelect } from '../components/ui/CustomSelect';
import { useAuth } from '../context/AuthContext';
import { settingsService } from '../services/settingsService';
import './Profile.scss';

export function Profile() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [profile, setProfile] = useState(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editModalError, setEditModalError] = useState('');
  const [passwordModalError, setPasswordModalError] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [appNameState, setAppNameState] = useState('Sekolah Info');
  const [activeSemesterState, setActiveSemesterState] = useState('Ganjil');
  const [fileList, setFileList] = useState([]);
  const [settingsLoading, setSettingsLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (isAdmin()) {
      loadSettings();
    }
  }, []);

  const loadSettings = async () => {
    try {
      const data = await settingsService.fetchSettings();
      if (data.app_name) setAppNameState(data.app_name);
      if (data.active_semester) setActiveSemesterState(data.active_semester);
      if (data.app_logo) {
        setFileList([{ url: data.app_logo, name: 'logo.png' }]);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await profileService.fetchProfile();
      setProfile(data);
    } catch (err) {
      console.error('Gagal memuat profil:', err);
      setError(err.message || 'Gagal memuat profil');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    setEditModalError('');
    setIsEditModalOpen(true);
  };

  const handlePasswordClick = () => {
    setPasswordModalError('');
    setIsPasswordModalOpen(true);
  };

  const handleEditSubmit = async (data) => {
    setIsSubmitting(true);
    setEditModalError('');

    try {
      await profileService.updateProfile(data);
      setIsEditModalOpen(false);
      await loadProfile();
    } catch (err) {
      setEditModalError(err.message || 'Gagal memperbarui profil');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (data) => {
    setIsSubmitting(true);
    setPasswordModalError('');

    try {
      await profileService.changePassword(data);
      setIsPasswordModalOpen(false);
      alert('Password berhasil diubah');
    } catch (err) {
      setPasswordModalError(err.message || 'Gagal mengubah password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Hanya file gambar yang diperbolehkan!');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file maksimal 2MB!');
      return;
    }

    try {
      setLoading(true);
      const result = await profileService.uploadAvatar(file);
      setProfile(prev => ({ ...prev, photo_url: result.url }));
    } catch (err) {
      alert(err.message || 'Gagal mengunggah foto profil');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Hanya file gambar yang diperbolehkan!');
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setFileList([{ file, url: uploadEvent.target.result }]);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
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
      alert('Pengaturan sistem berhasil diperbarui!');
    } catch (err) {
      alert(err.message || 'Gagal memperbarui pengaturan sistem.');
    } finally {
      setSettingsLoading(false);
    }
  };

  const getRoleLabel = (role) => {
    const roleLabels = {
      admin: 'Administrator',
      guru: 'Guru',
      madrasah_diniyah: 'Madrasah Diniyah',
      bendahara: 'Bendahara',
      wali_santri: 'Wali Santri'
    };
    return roleLabels[role] || role;
  };

  const getRoleColor = (role) => {
    const roleColors = {
      admin: 'red',
      guru: 'blue',
      madrasah_diniyah: 'purple',
      bendahara: 'green',
      wali_santri: 'orange'
    };
    return roleColors[role] || 'default';
  };

  const formatDateTime = (dateString) => {
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
    } catch (err) {
      return dateString;
    }
  };

  if (loading && !profile) return <LoadingState message="Memuat profil..." />;
  if (error && !profile) return <ErrorState message={error} onRetry={loadProfile} />;

  return (
    <div className="profile-page" style={{ padding: '20px' }}>
      <PageHeader
        title="👤 Profil Pengguna"
        subtitle="Kelola informasi akun dan kata sandi Anda"
        extra={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="btn-custom btn-primary" onClick={handleEditClick}>
              <Edit2 size={16} /> Edit Profile
            </button>
            <button type="button" className="btn-custom btn-secondary" onClick={handlePasswordClick}>
              <Lock size={16} /> Ubah Password
            </button>
          </div>
        }
      />

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginTop: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ cursor: 'pointer', position: 'relative' }} onClick={() => document.getElementById('avatar-input').click()}>
            <div style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              background: '#2196f3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              overflow: 'hidden'
            }}>
              {profile.photo_url ? (
                <img src={profile.photo_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User size={44} />
              )}
            </div>
            <input
              id="avatar-input"
              type="file"
              style={{ display: 'none' }}
              onChange={handleAvatarFileChange}
              accept="image/*"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <h2 style={{ margin: 0, fontSize: '22px', color: '#0f172a' }}>{profile.full_name}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CustomTag color={getRoleColor(profile.role)}>{getRoleLabel(profile.role)}</CustomTag>
              <span style={{ color: '#64748b', fontSize: '14px' }}>@{profile.username}</span>
            </div>
          </div>
        </div>

        <div style={{ height: '1px', background: '#e2e8f0', margin: '24px 0' }} />

        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a' }}>Informasi Akun</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', fontSize: '13px' }}>
          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}><User size={14} /> Username</span>
            <strong>{profile.username}</strong>
          </div>
          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}><Mail size={14} /> Email</span>
            <strong>{profile.email || '-'}</strong>
          </div>
          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}><Phone size={14} /> No. HP</span>
            <strong>{profile.phone || '-'}</strong>
          </div>
          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}><Clock size={14} /> Last Login</span>
            <strong>{formatDateTime(profile.last_login)}</strong>
          </div>
          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}><Calendar size={14} /> Terdaftar Sejak</span>
            <strong>{formatDateTime(profile.created_at)}</strong>
          </div>
        </div>
      </div>

      {isAdmin() && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginTop: '16px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a' }}>Pengaturan Sistem</h3>
          <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px' }}>
            <FloatingInput
              label="Nama Aplikasi"
              name="app_name"
              value={appNameState}
              onChange={(e) => setAppNameState(e.target.value)}
              required
            />

            <CustomSelect
              label="Semester Aktif"
              value={activeSemesterState}
              onChange={(val) => setActiveSemesterState(val)}
              options={[
                { label: 'Semester Ganjil', value: 'Ganjil' },
                { label: 'Semester Genap', value: 'Genap' }
              ]}
              required
            />

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#475569', fontSize: '13px' }}>
                Logo Aplikasi
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {fileList.length > 0 && fileList[0].url && (
                  <div style={{ width: 80, height: 80, border: '1px solid #e2e8f0', borderRadius: 8, padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
                    <img src={fileList[0].url} alt="logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  </div>
                )}
                <button
                  type="button"
                  className="btn-custom btn-secondary"
                  onClick={() => document.getElementById('logo-input').click()}
                >
                  Pilih Logo
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
                    className="btn-custom btn-danger"
                    onClick={() => setFileList([])}
                  >
                    Hapus
                  </button>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="btn-custom btn-primary"
                disabled={settingsLoading}
              >
                {settingsLoading ? 'Menyimpan...' : 'Simpan Pengaturan'}
              </button>
            </div>
          </form>
        </div>
      )}

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
