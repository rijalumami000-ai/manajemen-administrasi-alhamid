import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Users as UsersIcon, 
  ShieldCheck, 
  BookOpen, 
  Coins, 
  Search, 
  X, 
  RefreshCw, 
  AlertTriangle 
} from 'lucide-react';
import { userService } from '../services/userService';
import { UsersTable } from '../components/features/UsersTable';
import { UserModal } from '../components/features/UserModal';
import { CustomModal } from '../components/ui/CustomModal';
import { CustomSelect } from '../components/ui/CustomSelect';
import { LoadingState, ErrorState, useToast } from '../components/common';
import { 
  UserItem, 
  UserFormData, 
  UserDeleteConfirmState, 
  UserStats 
} from '../types/user';
import './Users.scss';

export function Users() {
  const toast = useToast();
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [userModalError, setUserModalError] = useState<string | null>(null);

  // VisionOS Confirmation State
  const [confirmState, setConfirmState] = useState<UserDeleteConfirmState>({
    isOpen: false,
    type: null,
    user: null
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userService.fetchUsers();
      setUsersList(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      console.error('Failed to load users:', err);
      const msg = err instanceof Error ? err.message : 'Gagal memuat data pengguna sistem';
      setError(msg);
      toast.show(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // KPI Calculations
  const stats: UserStats = useMemo(() => {
    const total = usersList.length;
    const admin = usersList.filter(u => u.role === 'admin').length;
    const madrasahDiniyah = usersList.filter(u => u.role === 'madrasah_diniyah').length;
    const bendahara = usersList.filter(u => u.role === 'bendahara').length;
    const active = usersList.filter(u => u.is_active).length;
    return { total, admin, madrasahDiniyah, bendahara, active };
  }, [usersList]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return usersList.filter(user => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        user.username.toLowerCase().includes(q) || 
        user.full_name.toLowerCase().includes(q) ||
        (user.email && user.email.toLowerCase().includes(q)) ||
        (user.phone && user.phone.includes(q));

      const matchRole = filterRole === 'all' || user.role === filterRole;
      const matchStatus = 
        filterStatus === 'all' || 
        (filterStatus === 'active' && user.is_active) || 
        (filterStatus === 'inactive' && !user.is_active);

      return matchSearch && matchRole && matchStatus;
    });
  }, [usersList, searchQuery, filterRole, filterStatus]);

  // Modal Handlers
  const handleCreateClick = () => {
    setEditingUser(null);
    setUserModalError(null);
    setIsUserModalOpen(true);
  };

  const handleEditClick = (user: UserItem) => {
    setEditingUser(user);
    setUserModalError(null);
    setIsUserModalOpen(true);
  };

  const handleUserSubmit = async (data: UserFormData) => {
    setIsSubmitting(true);
    setUserModalError(null);
    try {
      if (editingUser) {
        await userService.updateUser(editingUser.id, data);
        toast.show('Data pengguna berhasil diperbarui!', 'success');
      } else {
        await userService.createUser(data);
        toast.show('Pengguna baru berhasil ditambahkan!', 'success');
      }
      setIsUserModalOpen(false);
      await loadUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan data pengguna';
      setUserModalError(msg);
      toast.show(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action Confirmation Handlers
  const handleOpenDeactivate = (user: UserItem) => {
    setConfirmState({
      isOpen: true,
      type: 'deactivate',
      user
    });
  };

  const handleOpenDelete = (user: UserItem) => {
    setConfirmState({
      isOpen: true,
      type: 'delete',
      user
    });
  };

  const handleActivateClick = async (user: UserItem) => {
    try {
      await userService.activateUser(user.id);
      toast.show(`Akun @${user.username} berhasil diaktifkan kembali!`, 'success');
      await loadUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengaktifkan akun';
      toast.show(msg, 'error');
    }
  };

  const handleConfirmAction = async () => {
    const { type, user } = confirmState;
    if (!user) return;

    try {
      if (type === 'deactivate') {
        await userService.deactivateUser(user.id);
        toast.show(`Akun @${user.username} berhasil dinonaktifkan!`, 'success');
      } else if (type === 'delete') {
        await userService.deleteUser(user.id);
        toast.show(`Pengguna @${user.username} berhasil dihapus permanen!`, 'success');
      }
      setConfirmState({ isOpen: false, type: null, user: null });
      await loadUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operasi gagal diproses';
      toast.show(msg, 'error');
    }
  };

  if (loading && usersList.length === 0) {
    return <LoadingState message="Memuat data pengguna sistem..." />;
  }

  if (error && usersList.length === 0) {
    return <ErrorState message={error} onRetry={loadUsers} />;
  }

  return (
    <div className="users-page-container">
      {/* 🍏 Sacred Dock Header (Option A) */}
      <div className="tactile-page-header">
        <div className="header-text-block">
          <h2 className="page-title">User Management</h2>
          <p className="page-subtitle">
            Kelola akun administrator, operator madrasah, dan bendahara sistem
          </p>
        </div>

        <div className="header-action-dock">
          <button
            type="button"
            className="action-pill-btn secondary-pill"
            onClick={loadUsers}
            title="Muat Ulang Data"
          >
            <RefreshCw size={15} />
            <span>Segarkan</span>
          </button>

          <button
            type="button"
            className="action-pill-btn primary-pill"
            onClick={handleCreateClick}
          >
            <Plus size={16} />
            <span>Tambah User</span>
          </button>
        </div>
      </div>

      {/* 📊 KPI Summary Glass Cards */}
      <div className="users-kpi-grid">
        <div className="kpi-glass-card kpi-sapphire">
          <div className="kpi-icon-orb orb-sapphire">
            <UsersIcon size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-value">{stats.total}</span>
            <span className="kpi-label">Total Pengguna</span>
            <span className="kpi-subtext">{stats.active} akun aktif</span>
          </div>
        </div>

        <div className="kpi-glass-card kpi-purple">
          <div className="kpi-icon-orb orb-purple">
            <ShieldCheck size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-value">{stats.admin}</span>
            <span className="kpi-label">Administrator</span>
            <span className="kpi-subtext">Akses kontrol penuh</span>
          </div>
        </div>

        <div className="kpi-glass-card kpi-emerald">
          <div className="kpi-icon-orb orb-emerald">
            <BookOpen size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-value">{stats.madrasahDiniyah}</span>
            <span className="kpi-label">Madrasah Diniyah</span>
            <span className="kpi-subtext">Operator akademik & nilai</span>
          </div>
        </div>

        <div className="kpi-glass-card kpi-amber">
          <div className="kpi-icon-orb orb-amber">
            <Coins size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-value">{stats.bendahara}</span>
            <span className="kpi-label">Bendahara</span>
            <span className="kpi-subtext">Manajemen kas & tagihan</span>
          </div>
        </div>
      </div>

      {/* 🔍 Inset Frosted Filter Bar */}
      <div className="users-filter-dock">
        <div className="search-pill-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Cari berdasarkan username, nama lengkap, email, atau HP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearchQuery('')}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="filters-cluster">
          <div className="filter-select-wrap">
            <CustomSelect
              label=""
              value={filterRole}
              onChange={(val: string) => setFilterRole(val)}
              options={[
                { value: 'all', label: 'Semua Role' },
                { value: 'admin', label: 'Admin' },
                { value: 'madrasah_diniyah', label: 'Madrasah Diniyah' },
                { value: 'bendahara', label: 'Bendahara' }
              ]}
            />
          </div>

          <div className="filter-select-wrap">
            <CustomSelect
              label=""
              value={filterStatus}
              onChange={(val: string) => setFilterStatus(val)}
              options={[
                { value: 'all', label: 'Semua Status' },
                { value: 'active', label: 'Status Aktif' },
                { value: 'inactive', label: 'Status Nonaktif' }
              ]}
            />
          </div>
        </div>
      </div>

      {/* 💎 VisionOS Liquid Glass Table */}
      <UsersTable
        users={filteredUsers}
        onEdit={handleEditClick}
        onDeactivate={handleOpenDeactivate}
        onActivate={handleActivateClick}
        onDelete={handleOpenDelete}
      />

      {/* 📋 User Create / Edit Modal */}
      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSubmit={handleUserSubmit}
        editData={editingUser}
        isSubmitting={isSubmitting}
        error={userModalError}
      />

      {/* ⚠️ VisionOS Destructive Confirmation Dialog */}
      <CustomModal
        open={confirmState.isOpen}
        onClose={() => setConfirmState({ isOpen: false, type: null, user: null })}
        title={confirmState.type === 'delete' ? 'Hapus Pengguna Permanen' : 'Nonaktifkan Akun Pengguna'}
        width={440}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
            <button
              type="button"
              className="action-pill-btn secondary-pill"
              onClick={() => setConfirmState({ isOpen: false, type: null, user: null })}
            >
              Batal
            </button>
            <button
              type="button"
              className={`action-pill-btn ${confirmState.type === 'delete' ? 'danger-pill' : 'warning-pill'}`}
              onClick={handleConfirmAction}
            >
              {confirmState.type === 'delete' ? 'Ya, Hapus Permanen' : 'Ya, Nonaktifkan'}
            </button>
          </div>
        }
      >
        <div className="visionos-confirm-dialog">
          <div className={`dialog-icon-halo ${confirmState.type === 'delete' ? 'halo-rose' : 'halo-amber'}`}>
            <AlertTriangle size={28} />
          </div>
          <div className="dialog-text-content">
            <h4>{confirmState.type === 'delete' ? 'Konfirmasi Penghapusan Akun' : 'Konfirmasi Penonaktifan Akun'}</h4>
            <p>
              {confirmState.type === 'delete' ? (
                <>
                  Apakah Anda yakin ingin menghapus akun <strong>@{confirmState.user?.username}</strong> ({confirmState.user?.full_name}) secara permanen? Tindakan ini <strong>tidak dapat dibatalkan</strong>.
                </>
              ) : (
                <>
                  Apakah Anda yakin ingin menonaktifkan akun <strong>@{confirmState.user?.username}</strong>? Pengguna tidak akan dapat masuk ke sistem sampai akun diaktifkan kembali.
                </>
              )}
            </p>
          </div>
        </div>
      </CustomModal>
    </div>
  );
}

export default Users;
