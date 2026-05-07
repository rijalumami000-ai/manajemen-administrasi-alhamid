// Auth State Management

/**
 * Get current user from localStorage
 * @returns {Object|null} User object or null
 */
function getCurrentUser() {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    return null;
  }
}

/**
 * Get access token
 * @returns {string|null} Access token or null
 */
function getAccessToken() {
  return localStorage.getItem('accessToken');
}

/**
 * Get refresh token
 * @returns {string|null} Refresh token or null
 */
function getRefreshToken() {
  return localStorage.getItem('refreshToken');
}

/**
 * Check if user is logged in
 * @returns {boolean} True if logged in
 */
function isLoggedIn() {
  return !!getAccessToken();
}

/**
 * Check if user has specific role
 * @param {string|Array<string>} roles - Role or array of roles
 * @returns {boolean} True if user has role
 */
function hasRole(roles) {
  const user = getCurrentUser();
  if (!user) return false;

  if (Array.isArray(roles)) {
    return roles.includes(user.role);
  }
  return user.role === roles;
}

/**
 * Check if user is admin
 * @returns {boolean} True if admin
 */
function isAdmin() {
  return hasRole('admin');
}

/**
 * Check if user is guru
 * @returns {boolean} True if guru
 */
function isGuru() {
  return hasRole('guru');
}

/**
 * Check if user is staff
 * @returns {boolean} True if staff
 */
function isStaff() {
  return hasRole('staff');
}

/**
 * Logout user
 */
async function logout() {
  const token = getAccessToken();

  // Call logout API
  if (token) {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (e) {
      // Ignore error
    }
  }

  // Clear storage
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');

  // Keep rememberMe if checked
  const rememberMe = localStorage.getItem('rememberMe');
  if (rememberMe !== 'true') {
    localStorage.removeItem('rememberMe');
  }

  // Redirect to login
  window.location.href = '/login.html';
}

/**
 * Require authentication
 * Redirects to login if not authenticated
 */
function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = '/login.html';
    return false;
  }
  return true;
}

/**
 * Require specific role
 * Shows error if user doesn't have role
 * @param {string|Array<string>} roles - Required role(s)
 * @returns {boolean} True if user has role
 */
function requireRole(roles) {
  if (!requireAuth()) return false;

  if (!hasRole(roles)) {
    alert('Anda tidak memiliki akses ke halaman ini.');
    window.location.href = '/';
    return false;
  }
  return true;
}

/**
 * Make authenticated API request
 * @param {string} url - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} Fetch response
 */
async function fetchWithAuth(url, options = {}) {
  const token = getAccessToken();

  if (!token) {
    throw new Error('Not authenticated');
  }

  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  // Handle 401 (token expired)
  if (response.status === 401) {
    // Try to refresh token
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      // Retry request with new token
      const newToken = getAccessToken();
      headers['Authorization'] = `Bearer ${newToken}`;
      return fetch(url, { ...options, headers });
    } else {
      // Refresh failed, logout
      logout();
      throw new Error('Session expired');
    }
  }

  return response;
}

/**
 * Refresh access token
 * @returns {Promise<boolean>} True if refresh successful
 */
async function refreshAccessToken() {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    return false;
  }

  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken })
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();

    // Update tokens
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);

    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Update user info in navbar
 */
function updateNavbarUser() {
  const user = getCurrentUser();
  const userNameElement = document.getElementById('userName');
  const userRoleElement = document.getElementById('userRole');

  if (user && userNameElement) {
    userNameElement.textContent = user.full_name || user.username;
  }

  if (user && userRoleElement) {
    const roleLabels = {
      admin: 'Administrator',
      guru: 'Guru',
      staff: 'Staff'
    };
    userRoleElement.textContent = roleLabels[user.role] || user.role;
  }
}

/**
 * Show/hide elements based on role
 */
function applyRoleBasedUI() {
  const user = getCurrentUser();
  if (!user) return;

  // Hide admin-only elements
  const adminOnlyElements = document.querySelectorAll('[data-role="admin"]');
  adminOnlyElements.forEach(el => {
    if (user.role !== 'admin') {
      el.style.display = 'none';
    }
  });

  // Hide guru-only elements
  const guruOnlyElements = document.querySelectorAll('[data-role="guru"]');
  guruOnlyElements.forEach(el => {
    if (user.role !== 'guru' && user.role !== 'admin') {
      el.style.display = 'none';
    }
  });

  // Show role-specific elements
  const roleElements = document.querySelectorAll(`[data-role="${user.role}"]`);
  roleElements.forEach(el => {
    el.style.display = '';
  });
}

/**
 * Initialize auth state
 */
function initAuthState() {
  // Check if logged in
  if (!requireAuth()) return;

  // Update navbar
  updateNavbarUser();

  // Apply role-based UI
  applyRoleBasedUI();

  // Add logout handler
  const logoutButtons = document.querySelectorAll('[data-action="logout"]');
  logoutButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('Apakah Anda yakin ingin logout?')) {
        logout();
      }
    });
  });
}

// Export functions
window.authState = {
  getCurrentUser,
  getAccessToken,
  getRefreshToken,
  isLoggedIn,
  hasRole,
  isAdmin,
  isGuru,
  isStaff,
  logout,
  requireAuth,
  requireRole,
  fetchWithAuth,
  refreshAccessToken,
  updateNavbarUser,
  applyRoleBasedUI,
  initAuthState
};
