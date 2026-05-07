// User Management Feature (Admin Only)

import { showMessage } from '../utils/messages.js';

let users = [];

/**
 * Load all users
 */
export async function loadUsers() {
  try {
    const response = await window.authState.fetchWithAuth('/api/users');

    if (!response.ok) {
      throw new Error('Gagal memuat data user');
    }

    users = await response.json();
    displayUsers();
  } catch (error) {
    showMessage(error.message, 'error');
  }
}

/**
 * Display users in table
 */
function displayUsers() {
  const tbody = document.getElementById('users-table-body');
  if (!tbody) return;

  if (users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Tidak ada data user</td></tr>';
    return;
  }

  tbody.innerHTML = users.map(user => `
    <tr>
      <td>${user.id}</td>
      <td>${user.username}</td>
      <td>${user.full_name}</td>
      <td>${user.email || '-'}</td>
      <td><span class="badge badge-${user.role}">${getRoleLabel(user.role)}</span></td>
      <td><span class="badge badge-${user.is_active ? 'success' : 'danger'}">${user.is_active ? 'Aktif' : 'Nonaktif'}</span></td>
      <td>
        <button class="btn-action btn-edit" onclick="userFeature.editUser(${user.id})">Edit</button>
        ${user.is_active ?
          `<button class="btn-action btn-delete" onclick="userFeature.deactivateUser(${user.id})">Nonaktifkan</button>` :
          `<button class="btn-action btn-success" onclick="userFeature.activateUser(${user.id})">Aktifkan</button>`
        }
        <button class="btn-action btn-danger" onclick="userFeature.deleteUser(${user.id})">Hapus</button>
      </td>
    </tr>
  `).join('');
}

/**
 * Get role label
 */
function getRoleLabel(role) {
  const labels = {
    admin: 'Administrator',
    guru: 'Guru',
    staff: 'Staff'
  };
  return labels[role] || role;
}

/**
 * Show create user modal
 */
export function showCreateUserModal() {
  const modal = document.getElementById('userModal');
  const form = document.getElementById('userForm');
  const title = document.getElementById('userModalTitle');

  title.textContent = 'Tambah User Baru';
  form.reset();
  form.dataset.mode = 'create';
  delete form.dataset.userId;

  modal.style.display = 'flex';
}

/**
 * Edit user
 */
export async function editUser(userId) {
  try {
    const response = await window.authState.fetchWithAuth(`/api/users/${userId}`);

    if (!response.ok) {
      throw new Error('Gagal memuat data user');
    }

    const user = await response.json();

    const modal = document.getElementById('userModal');
    const form = document.getElementById('userForm');
    const title = document.getElementById('userModalTitle');

    title.textContent = 'Edit User';
    form.dataset.mode = 'edit';
    form.dataset.userId = userId;

    document.getElementById('userUsername').value = user.username;
    document.getElementById('userFullName').value = user.full_name;
    document.getElementById('userEmail').value = user.email || '';
    document.getElementById('userPhone').value = user.phone || '';
    document.getElementById('userRole').value = user.role;
    document.getElementById('userPassword').value = '';
    document.getElementById('userPassword').required = false;

    modal.style.display = 'flex';
  } catch (error) {
    showMessage(error.message, 'error');
  }
}

/**
 * Save user (create or update)
 */
export async function saveUser(event) {
  event.preventDefault();

  const form = event.target;
  const mode = form.dataset.mode;
  const userId = form.dataset.userId;

  const data = {
    username: document.getElementById('userUsername').value.trim(),
    full_name: document.getElementById('userFullName').value.trim(),
    email: document.getElementById('userEmail').value.trim() || null,
    phone: document.getElementById('userPhone').value.trim() || null,
    role: document.getElementById('userRole').value
  };

  const password = document.getElementById('userPassword').value;
  if (password) {
    data.password = password;
  }

  try {
    let response;

    if (mode === 'create') {
      if (!password) {
        showMessage('Password wajib diisi untuk user baru', 'error');
        return;
      }
      response = await window.authState.fetchWithAuth('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } else {
      response = await window.authState.fetchWithAuth(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Gagal menyimpan user');
    }

    showMessage(mode === 'create' ? 'User berhasil ditambahkan' : 'User berhasil diupdate', 'success');
    closeUserModal();
    loadUsers();
  } catch (error) {
    showMessage(error.message, 'error');
  }
}

/**
 * Deactivate user
 */
export async function deactivateUser(userId) {
  if (!confirm('Apakah Anda yakin ingin menonaktifkan user ini?')) {
    return;
  }

  try {
    const response = await window.authState.fetchWithAuth(`/api/users/${userId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Gagal menonaktifkan user');
    }

    showMessage('User berhasil dinonaktifkan', 'success');
    loadUsers();
  } catch (error) {
    showMessage(error.message, 'error');
  }
}

/**
 * Activate user
 */
export async function activateUser(userId) {
  try {
    const response = await window.authState.fetchWithAuth(`/api/users/${userId}/activate`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error('Gagal mengaktifkan user');
    }

    showMessage('User berhasil diaktifkan', 'success');
    loadUsers();
  } catch (error) {
    showMessage(error.message, 'error');
  }
}

/**
 * Delete user permanently
 */
export async function deleteUser(userId) {
  if (!confirm('Apakah Anda yakin ingin menghapus user ini PERMANEN? Tindakan ini tidak dapat dibatalkan!')) {
    return;
  }

  try {
    const response = await window.authState.fetchWithAuth(`/api/users/${userId}/hard`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Gagal menghapus user');
    }

    showMessage('User berhasil dihapus', 'success');
    loadUsers();
  } catch (error) {
    showMessage(error.message, 'error');
  }
}

/**
 * Close user modal
 */
export function closeUserModal() {
  const modal = document.getElementById('userModal');
  modal.style.display = 'none';
}

// Export for global access
window.userFeature = {
  loadUsers,
  showCreateUserModal,
  editUser,
  saveUser,
  deactivateUser,
  activateUser,
  deleteUser,
  closeUserModal
};
