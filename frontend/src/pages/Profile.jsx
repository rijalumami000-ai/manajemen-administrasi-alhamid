import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Avatar,
  Space,
  Button,
  Typography,
  Tag,
  Divider,
  message,
  Upload,
  Form,
  Input,
  Select
} from 'antd';
import {
  UserOutlined,
  EditOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { profileService } from '../services/profileService';
import { EditProfileModal } from '../components/features/EditProfileModal';
import { ChangePasswordModal } from '../components/features/ChangePasswordModal';
import { PageHeader, LoadingState, ErrorState } from '../components/common';
import { useAuth } from '../context/AuthContext';
import './Profile.scss';
import { settingsService } from '../services/settingsService';
import { CustomSelect } from '../components/ui/CustomSelect';
import { FloatingInput } from '../components/ui/FloatingInput';

const { Title, Text } = Typography;
const { Option } = Select;

export function Profile() {
  const navigate = useNavigate();
  const { logout, updateUser, isAdmin } = useAuth();

  // State
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editModalError, setEditModalError] = useState('');
  const [passwordModalError, setPasswordModalError] = useState('');
  
  // Settings State
  const [appNameState, setAppNameState] = useState('Alhamid Cintamulya');
  const [activeSemesterState, setActiveSemesterState] = useState('Ganjil');
  const [fileList, setFileList] = useState([]);
  const [settingsLoading, setSettingsLoading] = useState(false);

  useEffect(() => {
    if (isAdmin()) {
      loadSettings();
    }
  }, []);

  const loadSettings = async () => {
    try {
      setSettingsLoading(true);
      const settings = await settingsService.fetchSettings();
      if (settings.app_name) setAppNameState(settings.app_name);
      if (settings.active_semester) setActiveSemesterState(settings.active_semester);
      if (settings.app_logo) {
        setFileList([{
          uid: '-1',
          name: 'logo.png',
          status: 'done',
          url: settings.app_logo,
        }]);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleLogoFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result;
        setFileList([{
          uid: '-1',
          name: file.name,
          status: 'done',
          url: base64,
          originFileObj: file
        }]);
      };
    }
  };

  const handleSaveSettings = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      setSettingsLoading(true);
      await settingsService.updateSetting('app_name', appNameState);
      await settingsService.updateSetting('active_semester', activeSemesterState);
      
      if (fileList.length > 0 && fileList[0].originFileObj) {
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(fileList[0].originFileObj);
          reader.onload = () => resolve(reader.result);
          reader.onerror = (error) => reject(error);
        });
        await settingsService.updateSetting('app_logo', base64);
        message.success('Pengaturan berhasil disimpan! Refresh halaman untuk melihat perubahan.');
      } else if (fileList.length === 0) {
        // Remove logo
        await settingsService.updateSetting('app_logo', null);
        message.success('Pengaturan berhasil disimpan! Refresh halaman untuk melihat perubahan.');
      } else {
        // Logo not changed
        message.success('Pengaturan berhasil disimpan!');
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      message.error('Gagal menyimpan pengaturan');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = reader.result;
        try {
          await profileService.updateProfile({ photo_url: base64 });
          message.success('Foto profil berhasil diperbarui!');
          loadProfile(); // Reload
        } catch (err) {
          message.error('Gagal memperbarui foto profil');
        }
      };
    }
  };

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await profileService.fetchProfile();
      setProfile(data);
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError(err.message || 'Gagal memuat profil');
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Administrator',
      guru: 'Guru',
      staff: 'Staff'
    };
    return labels[role] || role;
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'red',
      guru: 'blue',
      staff: 'green'
    };
    return colors[role] || 'default';
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Edit profile
  const handleEditClick = () => {
    setEditModalError('');
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (data) => {
    setIsSubmitting(true);
    setEditModalError('');

    try {
      const updatedProfile = await profileService.updateProfile(data);

      // Update local state
      setProfile(updatedProfile);

      // Update auth context
      updateUser({
        full_name: updatedProfile.full_name,
        email: updatedProfile.email
      });

      message.success('Profil berhasil diperbarui');
      setIsEditModalOpen(false);
    } catch (err) {
      setEditModalError(err.message || 'Gagal memperbarui profil');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Change password
  const handlePasswordClick = () => {
    setPasswordModalError('');
    setIsPasswordModalOpen(true);
  };

  const handlePasswordSubmit = async (data) => {
    setIsSubmitting(true);
    setPasswordModalError('');

    try {
      await profileService.changePassword(data);
      message.success('Password berhasil diubah. Silakan login kembali.');
      setIsPasswordModalOpen(false);

      // Logout after 2 seconds
      setTimeout(() => {
        logout();
        navigate('/login');
      }, 2000);
    } catch (err) {
      setPasswordModalError(err.message || 'Gagal mengubah password');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState tip="Memuat profil..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Gagal Memuat Profil"
        subtitle={error}
        showRetry
        onRetry={loadProfile}
      />
    );
  }

  if (!profile) {
    return (
      <ErrorState
        title="Profil Tidak Ditemukan"
        subtitle="Data profil tidak tersedia"
        showHome
      />
    );
  }

  return (
    <div className="profile-page">
      <PageHeader
        title="Profile Saya"
        subtitle="Kelola informasi profil dan keamanan akun Anda"
        breadcrumbs={[{ title: 'Profile' }]}
        extra={
          <Space>
            <Button
              icon={<EditOutlined />}
              onClick={handleEditClick}
            >
              Edit Profile
            </Button>
            <Button
              icon={<LockOutlined />}
              onClick={handlePasswordClick}
            >
              Ubah Password
            </Button>
          </Space>
        }
      />

      <Card className="profile-card">
        <div className="profile-header">
          <div style={{ cursor: 'pointer', position: 'relative' }} onClick={() => document.getElementById('avatar-input').click()}>
            <Avatar
              size={100}
              icon={<UserOutlined />}
              src={profile.photo_url}
              style={{
                backgroundColor: '#2196f3',
                fontSize: '48px'
              }}
            />
            <input
              id="avatar-input"
              type="file"
              style={{ display: 'none' }}
              onChange={handleAvatarFileChange}
              accept="image/*"
            />
          </div>
          <div className="profile-info">
            <Space direction="vertical" size={4}>
              <Title level={3} style={{ margin: 0 }}>
                {profile.full_name}
              </Title>
              <Space>
                <Tag color={getRoleColor(profile.role)}>
                  {getRoleLabel(profile.role)}
                </Tag>
                <Text type="secondary">@{profile.username}</Text>
              </Space>
            </Space>
          </div>
        </div>

        <Divider />

        <Descriptions
          title="Informasi Akun"
          column={{ xs: 1, sm: 1, md: 2 }}
          labelStyle={{ fontWeight: 600 }}
        >
          <Descriptions.Item
            label={
              <Space>
                <UserOutlined />
                <span>Username</span>
              </Space>
            }
          >
            {profile.username}
          </Descriptions.Item>

          <Descriptions.Item
            label={
              <Space>
                <MailOutlined />
                <span>Email</span>
              </Space>
            }
          >
            {profile.email || '-'}
          </Descriptions.Item>

          <Descriptions.Item
            label={
              <Space>
                <PhoneOutlined />
                <span>No. HP</span>
              </Space>
            }
          >
            {profile.phone || '-'}
          </Descriptions.Item>

          <Descriptions.Item
            label={
              <Space>
                <ClockCircleOutlined />
                <span>Last Login</span>
              </Space>
            }
          >
            {formatDateTime(profile.last_login)}
          </Descriptions.Item>

          <Descriptions.Item
            label={
              <Space>
                <CalendarOutlined />
                <span>Terdaftar Sejak</span>
              </Space>
            }
            span={2}
          >
            {formatDateTime(profile.created_at)}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {isAdmin() && (
        <Card className="profile-card" title="Pengaturan Sistem" style={{ marginTop: 16 }}>
          <form onSubmit={handleSaveSettings} className="settings-form">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px' }}>
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
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--lt-text-secondary, #475569)', fontSize: '13px' }}>
                  Logo Aplikasi
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  {fileList.length > 0 && fileList[0].url && (
                    <div style={{ width: 100, height: 100, border: '1px solid #e2e8f0', borderRadius: 8, padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
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
            </div>
          </form>
        </Card>
      )}

      {/* Modals */}
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
