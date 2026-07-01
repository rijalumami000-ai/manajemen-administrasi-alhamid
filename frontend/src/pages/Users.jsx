import { useState, useEffect } from 'react';
import { Plus, Users as UsersIcon } from 'lucide-react';
import { userService } from '../services/userService';
import { UsersTable } from '../components/features/UsersTable';
import { UserModal } from '../components/features/UserModal';
import { PageHeader, LoadingState, ErrorState } from '../components/common';
import { Message } from '../components/common/Message';
import './Users.scss';

export function Users() {
  const [usersList, setUsersList] = useState([]);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [userModalError, setUserModalError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const handleCreateClick = () => {
    setEditingUser(null);
    setUserModalError('');
    setIsUserModalOpen(true);
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setUserModalError('');
    setIsUserModalOpen(true);
  };

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

  const handleDeactivateClick = async (id) => {
    try {
      await userService.deactivateUser(id);
      showMessage('User berhasil dinonaktifkan', 'success');
      await loadUsers();
    } catch (err) {
      showMessage(err.message || 'Gagal menonaktifkan user', 'error');
    }
  };

  const handleActivateClick = async (id) => {
    try {
      await userService.activateUser(id);
      showMessage('User berhasil diaktifkan', 'success');
      await loadUsers();
    } catch (err) {
      showMessage(err.message || 'Gagal mengaktifkan user', 'error');
    }
  };

  const handleDeleteClick = async (id) => {
    try {
      await userService.deleteUser(id);
      showMessage('User berhasil dihapus', 'success');
      await loadUsers();
    } catch (err) {
      showMessage(err.message || 'Gagal menghapus user', 'error');
    }
  };

  if (loading) return <LoadingState message="Memuat data user..." />;
  if (error) return <ErrorState message={error} onRetry={loadUsers} />;

  return (
    <div className="users-page">
      <PageHeader
        title="User Management"
        subtitle="Kelola pengguna sistem, akses, dan role"
        extra={
          <button className="btn-add-user" onClick={handleCreateClick}>
            <Plus size={16} />
            Tambah User
          </button>
        }
      />

      <div className="users-content">
        {message.text && (
          <div className="users-message">
            <Message
              type={message.type}
              message={message.text}
              onClose={() => setMessage({ text: '', type: '' })}
            />
          </div>
        )}

        {usersList.length === 0 ? (
          <div className="users-empty">
            <UsersIcon size={48} />
            <h3>Belum ada user</h3>
            <p>Tambahkan user pertama untuk memulai.</p>
            <button className="btn-add-user" onClick={handleCreateClick}>
              <Plus size={16} />
              Tambah User
            </button>
          </div>
        ) : (
          <UsersTable
            users={usersList}
            onEdit={handleEditClick}
            onDeactivate={handleDeactivateClick}
            onActivate={handleActivateClick}
            onDelete={handleDeleteClick}
          />
        )}
      </div>

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
