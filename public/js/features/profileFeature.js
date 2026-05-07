// Profile Management Feature

import { showMessage } from '../utils/messages.js';

/**
 * Load user profile
 */
export async function loadProfile() {
  try {
    const response = await window.authState.fetchWithAuth('/api/profile');

    if (!response.ok) {
      throw new Error('Gagal memuat profil');
    }

    const profile = await response.json();
    displayProfile(profile);
  } catch (error) {
    showMessage(error.message, 'error');
  }
}

/**
 * Display profile
 */
function displayProfile(profile) {
  document.getElementById('profileUsername').textContent = profile.username;
  document.getElementById('profileFullName').textContent = profile.full_name;
  document.getElementById('profileEmail').textContent = profile.email || '-';
  document.getElementById('profilePhone').textContent = profile.phone || '-';
  document.getElementById('profileRole').textContent = getRoleLabel(profile.role);
  document.getElementById('profileLastLogin').textContent = profile.last_login ?
    new Date(profile.last_login).toLocaleString('id-ID') : '-';
  document.getElementById('profileCreatedAt').textContent =
    new Date(profile.created_at).toLocaleString('id-ID');
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
 * Show edit profile modal
 */
export async function showEditProfileModal() {
  try {
    const response = await window.authState.fetchWithAuth('/api/profile');

    if (!response.ok) {
      throw new Error('Gagal memuat profil');
    }

    const profile = await response.json();

    document.getElementById('editFullName').value = profile.full_name;
    document.getElementById('editEmail').value = profile.email || '';
    document.getElementById('editPhone').value = profile.phone || '';

    document.getElementById('editProfileModal').style.display = 'flex';
  } catch (error) {
    showMessage(error.message, 'error');
  }
}

/**
 * Save profile
 */
export async function saveProfile(event) {
  event.preventDefault();

  const data = {
    full_name: document.getElementById('editFullName').value.trim(),
    email: document.getElementById('editEmail').value.trim() || null,
    phone: document.getElementById('editPhone').value.trim() || null
  };

  try {
    const response = await window.authState.fetchWithAuth('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Gagal menyimpan profil');
    }

    const updatedProfile = await response.json();

    // Update localStorage
    const user = window.authState.getCurrentUser();
    user.full_name = updatedProfile.full_name;
    user.email = updatedProfile.email;
    localStorage.setItem('user', JSON.stringify(user));

    // Update navbar
    window.authState.updateNavbarUser();

    showMessage('Profil berhasil diupdate', 'success');
    closeEditProfileModal();
    loadProfile();
  } catch (error) {
    showMessage(error.message, 'error');
  }
}

/**
 * Close edit profile modal
 */
export function closeEditProfileModal() {
  document.getElementById('editProfileModal').style.display = 'none';
}

/**
 * Show change password modal
 */
export function showChangePasswordModal() {
  document.getElementById('changePasswordForm').reset();
  document.getElementById('changePasswordModal').style.display = 'flex';
}

/**
 * Change password
 */
export async function changePassword(event) {
  event.preventDefault();

  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  // Validate
  if (newPassword !== confirmPassword) {
    showMessage('Password baru dan konfirmasi tidak cocok', 'error');
    return;
  }

  if (newPassword.length < 8) {
    showMessage('Password baru minimal 8 karakter', 'error');
    return;
  }

  try {
    const response = await window.authState.fetchWithAuth('/api/profile/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Gagal mengubah password');
    }

    showMessage('Password berhasil diubah. Silakan login kembali.', 'success');
    closeChangePasswordModal();

    // Logout after 2 seconds
    setTimeout(() => {
      window.authState.logout();
    }, 2000);
  } catch (error) {
    showMessage(error.message, 'error');
  }
}

/**
 * Close change password modal
 */
export function closeChangePasswordModal() {
  document.getElementById('changePasswordModal').style.display = 'none';
}

// Export for global access
window.profileFeature = {
  loadProfile,
  showEditProfileModal,
  saveProfile,
  closeEditProfileModal,
  showChangePasswordModal,
  changePassword,
  closeChangePasswordModal
};
