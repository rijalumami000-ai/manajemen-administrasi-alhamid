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
  message
} from 'antd';
import {
  UserOutlined,
  EditOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  ClockCircleOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { profileService } from '../services/profileService';
import { EditProfileModal } from '../components/features/EditProfileModal';
import { ChangePasswordModal } from '../components/features/ChangePasswordModal';
import { PageHeader, LoadingState, ErrorState } from '../components/common';
import { useAuth } from '../context/AuthContext';
import './Profile.scss';

const { Title, Text } = Typography;

export function Profile() {
  const navigate = useNavigate();
  const { logout, updateUser } = useAuth();

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
          <Avatar
            size={100}
            icon={<UserOutlined />}
            style={{
              backgroundColor: '#2196f3',
              fontSize: '48px'
            }}
          />
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
