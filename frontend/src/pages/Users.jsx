import { useState, useEffect } from 'react';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { userService } from '../services/userService';
import { UsersTable } from '../components/features/UsersTable';
import { UserModal } from '../components/features/UserModal';
import { PageHeader, LoadingState, ErrorState } from '../components/common';
import { Message } from '../components/common/Message';
import './Users.scss';

export function Users() {
  // State
  const [usersList, setUsersList] = useState([]);

  // Modals
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Messages
  const [message, setMessage] = useState({ text: '', type: '' });
  const [userModalError, setUserModalError] = useState('');

  // Loading
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load users on mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userService.fetchUsers();
      setUsersList(data);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError(err.message || 'Gagal memuat data user');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  // Create user
  const handleCreateClick = () => {
    setEditingUser(null);
    setUserModalError('');
    setIsUserModalOpen(true);
  };

  // Edit user
  const handleEditClick = (user) => {
    setEditingUser(user);
    setUserModalError('');
    setIsUserModalOpen(true);
  };

  // Save user (create or update)
  const handleUserSubmit = async (data) => {
    setIsSubmitting(true);
    setUserModalError('');

    try {
      if (editingUser) {
        await userService.updateUser(editingUser.id, data);
        showMessage('User berhasil diupdate', 'success');
      } else {
        await userService.createUser(data);
        showMessage('User berhasil ditambahkan', 'success');
      }

      setIsUserModalOpen(false);
      await loadUsers();
    } catch (err) {
      setUserModalError(err.message || 'Gagal menyimpan user');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Deactivate user
  const handleDeactivateClick = async (id) => {
    try {
      await userService.deactivateUser(id);
      showMessage('User berhasil dinonaktifkan', 'success');
      await loadUsers();
    } catch (err) {
      showMessage(err.message || 'Gagal menonaktifkan user', 'error');
    }
  };

  // Activate user
  const handleActivateClick = async (id) => {
    try {
      await userService.activateUser(id);
      showMessage('User berhasil diaktifkan', 'success');
      await loadUsers();
    } catch (err) {
      showMessage(err.message || 'Gagal mengaktifkan user', 'error');
    }
  };

  // Delete user permanently
  const handleDeleteClick = async (id) => {
    try {
      await userService.deleteUser(id);
      showMessage('User berhasil dihapus', 'success');
      await loadUsers();
    } catch (err) {
      showMessage(err.message || 'Gagal menghapus user', 'error');
    }
  };

  if (loading) {
    return <LoadingState message="Memuat data user..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={loadUsers}
      />
    );
  }

  return (
    <div className="users-page">
      <PageHeader
        title="User Management"
        subtitle="Kelola pengguna sistem, akses, dan role"
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleCreateClick}
          >
            Tambah User
          </Button>
        }
      />

      <div className="users-content">
        {message.text && (
          <div style={{ marginBottom: '16px' }}>
            <Message
              type={message.type}
              message={message.text}
              onClose={() => setMessage({ text: '', type: '' })}
            />
          </div>
        )}

        <UsersTable
          users={usersList}
          onEdit={handleEditClick}
          onDeactivate={handleDeactivateClick}
          onActivate={handleActivateClick}
          onDelete={handleDeleteClick}
        />
      </div>

      {/* User Modal */}
      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSubmit={handleUserSubmit}
        editData={editingUser}
        isSubmitting={isSubmitting}
        error={userModalError}
      />
    </div>
  );
}
