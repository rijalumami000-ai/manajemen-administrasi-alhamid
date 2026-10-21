import React, { useState } from 'react';
import { 
  Edit3, 
  UserX, 
  UserCheck, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  ShieldCheck, 
  BookOpen, 
  Coins, 
  User, 
  Mail, 
  Phone 
} from 'lucide-react';
import { UserItem, UserRole } from '../../types/user';

interface UsersTableProps {
  users: UserItem[];
  onEdit: (user: UserItem) => void;
  onDeactivate: (user: UserItem) => void;
  onActivate: (user: UserItem) => void;
  onDelete: (user: UserItem) => void;
}

export const UsersTable: React.FC<UsersTableProps> = ({
  users,
  onEdit,
  onDeactivate,
  onActivate,
  onDelete
}) => {
  const [sortKey, setSortKey] = useState<keyof UserItem>('username');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: keyof UserItem) => {
    if (sortKey === key) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedUsers = [...users].sort((a, b) => {
    const valA = (a[sortKey] ?? '').toString().toLowerCase();
    const valB = (b[sortKey] ?? '').toString().toLowerCase();
    return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
  });

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return (
          <span className="user-role-pill pill-admin">
            <ShieldCheck size={13} />
            <span>Admin</span>
          </span>
        );
      case 'madrasah_diniyah':
        return (
          <span className="user-role-pill pill-md">
            <BookOpen size={13} />
            <span>Madrasah Diniyah</span>
          </span>
        );
      case 'bendahara':
        return (
          <span className="user-role-pill pill-bendahara">
            <Coins size={13} />
            <span>Bendahara</span>
          </span>
        );
      default:
        return (
          <span className="user-role-pill pill-default">
            <User size={13} />
            <span>{role}</span>
          </span>
        );
    }
  };

  return (
    <div className="users-table-container">
      <div className="table-responsive">
        <table className="users-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('username')} className="th-sortable col-user">
                <div className="th-content">
                  <span>Username & Pengguna</span>
                  {sortKey === 'username' ? (
                    sortDir === 'asc' ? <ChevronUp size={14} className="sort-active" /> : <ChevronDown size={14} className="sort-active" />
                  ) : <ChevronUp size={14} className="sort-inactive" />}
                </div>
              </th>
              <th onClick={() => handleSort('full_name')} className="th-sortable col-name">
                <div className="th-content">
                  <span>Nama Lengkap</span>
                  {sortKey === 'full_name' ? (
                    sortDir === 'asc' ? <ChevronUp size={14} className="sort-active" /> : <ChevronDown size={14} className="sort-active" />
                  ) : <ChevronUp size={14} className="sort-inactive" />}
                </div>
              </th>
              <th className="col-contact">Kontak</th>
              <th className="col-role">Role Akses</th>
              <th className="col-status">Status Akun</th>
              <th className="col-actions text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {sortedUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="table-empty-cell">
                  <div className="table-empty-state">
                    <User size={32} />
                    <p>Tidak ada pengguna yang cocok dengan filter pencarian</p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedUsers.map(user => {
                const initial = (user.full_name || user.username || '?')[0].toUpperCase();
                return (
                  <tr key={user.id} className={!user.is_active ? 'tr-inactive' : ''}>
                    <td className="col-user">
                      <div className="user-avatar-group">
                        <div className={`user-lens-orb ${user.role === 'admin' ? 'orb-admin' : user.role === 'bendahara' ? 'orb-bendahara' : 'orb-md'}`}>
                          <span>{initial}</span>
                        </div>
                        <div className="user-meta">
                          <span className="user-uname">@{user.username}</span>
                          <span className="user-id-badge">ID: #{user.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="col-name">
                      <span className="user-full-name">{user.full_name}</span>
                    </td>
                    <td className="col-contact">
                      <div className="user-contact-group">
                        {user.email ? (
                          <div className="contact-item" title={user.email}>
                            <Mail size={12} className="contact-icon" />
                            <span>{user.email}</span>
                          </div>
                        ) : null}
                        {user.phone ? (
                          <div className="contact-item" title={user.phone}>
                            <Phone size={12} className="contact-icon" />
                            <span>{user.phone}</span>
                          </div>
                        ) : null}
                        {!user.email && !user.phone && (
                          <span className="text-muted">-</span>
                        )}
                      </div>
                    </td>
                    <td className="col-role">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="col-status">
                      <span className={`status-frosted-pill ${user.is_active ? 'pill-active' : 'pill-inactive'}`}>
                        <span className="status-indicator-dot" />
                        <span>{user.is_active ? 'Aktif' : 'Nonaktif'}</span>
                      </span>
                    </td>
                    <td className="col-actions text-right">
                      <div className="actions-cluster">
                        <button
                          type="button"
                          className="btn-table-act btn-edit"
                          onClick={() => onEdit(user)}
                          title="Edit Pengguna"
                        >
                          <Edit3 size={15} />
                        </button>

                        {user.is_active ? (
                          <button
                            type="button"
                            className="btn-table-act btn-deactivate"
                            onClick={() => onDeactivate(user)}
                            title="Nonaktifkan Akun"
                          >
                            <UserX size={15} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn-table-act btn-activate"
                            onClick={() => onActivate(user)}
                            title="Aktifkan Akun"
                          >
                            <UserCheck size={15} />
                          </button>
                        )}

                        <button
                          type="button"
                          className="btn-table-act btn-delete"
                          onClick={() => onDelete(user)}
                          title="Hapus Permanen"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="table-footer-bar">
        <span>Menampilkan <strong>{sortedUsers.length}</strong> pengguna terdaftar</span>
      </div>
    </div>
  );
};
