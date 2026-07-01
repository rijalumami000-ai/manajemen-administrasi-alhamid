import { useState } from 'react';
import { Edit2, StopCircle, CheckCircle, Trash2, ChevronUp, ChevronDown } from 'lucide-react';

function ConfirmPopover({ message, onConfirm, onCancel }) {
  return (
    <div className="confirm-popover">
      <p>{message}</p>
      <div className="confirm-popover__actions">
        <button className="btn-confirm-cancel" onClick={onCancel}>Batal</button>
        <button className="btn-confirm-ok" onClick={onConfirm}>Ya</button>
      </div>
    </div>
  );
}

export function UsersTable({ users, onEdit, onDeactivate, onActivate, onDelete }) {
  const [confirmState, setConfirmState] = useState({ type: null, id: null });
  const [sortConfig, setSortConfig] = useState({ key: 'username', dir: 'asc' });
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const getRoleColor = (role) => {
    const map = {
      admin: 'role-admin',
      madrasah_diniyah: 'role-md',
      bendahara: 'role-bendahara',
    };
    return map[role] || 'role-default';
  };

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Admin',
      madrasah_diniyah: 'Madrasah Diniyah',
      bendahara: 'Bendahara',
    };
    return labels[role] || role;
  };

  const handleSort = (key) => {
    setSortConfig((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }
    );
  };

  const SortIcon = ({ col }) => {
    if (sortConfig.key !== col) return <ChevronUp size={12} className="sort-icon inactive" />;
    return sortConfig.dir === 'asc' ? (
      <ChevronUp size={12} className="sort-icon active" />
    ) : (
      <ChevronDown size={12} className="sort-icon active" />
    );
  };

  const sortedFiltered = [...users]
    .filter((u) => filterRole === 'all' || u.role === filterRole)
    .filter((u) => filterStatus === 'all' || (filterStatus === 'active' ? u.is_active : !u.is_active))
    .sort((a, b) => {
      const valA = (a[sortConfig.key] || '').toString().toLowerCase();
      const valB = (b[sortConfig.key] || '').toString().toLowerCase();
      return sortConfig.dir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });

  const openConfirm = (type, id) => setConfirmState({ type, id });
  const closeConfirm = () => setConfirmState({ type: null, id: null });

  const doConfirm = () => {
    if (confirmState.type === 'deactivate') onDeactivate(confirmState.id);
    if (confirmState.type === 'delete') onDelete(confirmState.id);
    closeConfirm();
  };

  const confirmMessage = confirmState.type === 'deactivate'
    ? 'Apakah Anda yakin ingin menonaktifkan user ini?'
    : 'Tindakan ini tidak dapat dibatalkan! Yakin hapus?';

  return (
    <div className="users-table-wrapper">
      {/* Filters */}
      <div className="users-table-filters">
        <div className="filter-group">
          <label>Role:</label>
          <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
            <option value="all">Semua Role</option>
            <option value="admin">Admin</option>
            <option value="madrasah_diniyah">Madrasah Diniyah</option>
            <option value="bendahara">Bendahara</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Status:</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>
        <span className="users-count">{sortedFiltered.length} user</span>
      </div>

      {/* Table */}
      <div className="users-table-scroll">
        <table className="users-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('username')} className="sortable">
                Username <SortIcon col="username" />
              </th>
              <th onClick={() => handleSort('full_name')} className="sortable">
                Nama Lengkap <SortIcon col="full_name" />
              </th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {sortedFiltered.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-row">Tidak ada data user</td>
              </tr>
            ) : (
              sortedFiltered.map((user) => (
                <tr key={user.id} className={!user.is_active ? 'row-inactive' : ''}>
                  <td className="col-username">
                    <div className="user-avatar">
                      <div className="avatar-circle">
                        {(user.full_name || user.username || '?')[0].toUpperCase()}
                      </div>
                      <span className="username-text">{user.username}</span>
                    </div>
                  </td>
                  <td>{user.full_name || '-'}</td>
                  <td className="col-email">{user.email || <span className="text-muted">-</span>}</td>
                  <td>
                    <span className={`role-badge ${getRoleColor(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${user.is_active ? 'status-active' : 'status-inactive'}`}>
                      <span className="status-dot" />
                      {user.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="col-actions">
                    <div className="action-buttons">
                      <button
                        className="action-btn btn-edit"
                        onClick={() => onEdit(user)}
                        title="Edit user"
                      >
                        <Edit2 size={14} />
                        <span>Edit</span>
                      </button>

                      {user.is_active ? (
                        <div className="confirm-wrapper">
                          <button
                            className="action-btn btn-deactivate"
                            onClick={() => openConfirm('deactivate', user.id)}
                            title="Nonaktifkan"
                          >
                            <StopCircle size={14} />
                            <span>Nonaktifkan</span>
                          </button>
                          {confirmState.type === 'deactivate' && confirmState.id === user.id && (
                            <ConfirmPopover
                              message={confirmMessage}
                              onConfirm={doConfirm}
                              onCancel={closeConfirm}
                            />
                          )}
                        </div>
                      ) : (
                        <button
                          className="action-btn btn-activate"
                          onClick={() => onActivate(user.id)}
                          title="Aktifkan"
                        >
                          <CheckCircle size={14} />
                          <span>Aktifkan</span>
                        </button>
                      )}

                      <div className="confirm-wrapper">
                        <button
                          className="action-btn btn-delete"
                          onClick={() => openConfirm('delete', user.id)}
                          title="Hapus permanen"
                        >
                          <Trash2 size={14} />
                        </button>
                        {confirmState.type === 'delete' && confirmState.id === user.id && (
                          <ConfirmPopover
                            message={confirmMessage}
                            onConfirm={doConfirm}
                            onCancel={closeConfirm}
                          />
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
