// Login Page JavaScript

// DOM Elements
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const rememberMeCheckbox = document.getElementById('rememberMe');
const loginButton = document.getElementById('loginButton');
const togglePasswordButton = document.getElementById('togglePassword');
const errorAlert = document.getElementById('errorAlert');
const errorText = document.getElementById('errorText');

// Toggle password visibility
togglePasswordButton.addEventListener('click', () => {
  const type = passwordInput.type === 'password' ? 'text' : 'password';
  passwordInput.type = type;

  const showIcon = togglePasswordButton.querySelector('.show-icon');
  const hideIcon = togglePasswordButton.querySelector('.hide-icon');

  if (type === 'text') {
    showIcon.style.display = 'none';
    hideIcon.style.display = 'inline';
  } else {
    showIcon.style.display = 'inline';
    hideIcon.style.display = 'none';
  }
});

// Show error message
function showError(message) {
  errorText.textContent = message;
  errorAlert.style.display = 'flex';
}

// Hide error message
function hideError() {
  errorAlert.style.display = 'none';
}

// Show loading state
function showLoading() {
  loginButton.disabled = true;
  loginButton.querySelector('.button-text').style.display = 'none';
  loginButton.querySelector('.button-loading').style.display = 'flex';
}

// Hide loading state
function hideLoading() {
  loginButton.disabled = false;
  loginButton.querySelector('.button-text').style.display = 'inline';
  loginButton.querySelector('.button-loading').style.display = 'none';
}

// Validate form
function validateForm() {
  hideError();
  let isValid = true;

  if (!usernameInput.value.trim()) {
    showError('Username tidak boleh kosong');
    usernameInput.focus();
    isValid = false;
  } else if (!passwordInput.value) {
    showError('Password tidak boleh kosong');
    passwordInput.focus();
    isValid = false;
  }

  return isValid;
}

// Handle login
async function handleLogin(event) {
  event.preventDefault();

  if (!validateForm()) {
    return;
  }

  showLoading();
  hideError();

  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  const rememberMe = rememberMeCheckbox.checked;

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login gagal');
    }

    // Save tokens
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));

    if (rememberMe) {
      localStorage.setItem('rememberMe', 'true');
    }

    // Show success
    loginButton.classList.add('success');
    loginButton.querySelector('.button-text').textContent = '✓ Berhasil!';

    // Redirect to dashboard
    setTimeout(() => {
      window.location.href = '/';
    }, 500);

  } catch (error) {
    hideLoading();
    showError(error.message);

    // Shake animation
    loginForm.style.animation = 'none';
    setTimeout(() => {
      loginForm.style.animation = '';
    }, 10);
  }
}

// Check if already logged in
function checkAuth() {
  const token = localStorage.getItem('accessToken');
  if (token) {
    // Verify token
    fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (response.ok) {
        // Already logged in, redirect to dashboard
        window.location.href = '/';
      }
    })
    .catch(() => {
      // Token invalid, clear storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    });
  }
}

// Auto-fill username if remembered
function autoFillUsername() {
  const rememberMe = localStorage.getItem('rememberMe');
  const user = localStorage.getItem('user');

  if (rememberMe === 'true' && user) {
    try {
      const userData = JSON.parse(user);
      usernameInput.value = userData.username;
      rememberMeCheckbox.checked = true;
      passwordInput.focus();
    } catch (e) {
      // Ignore error
    }
  }
}

// Event listeners
loginForm.addEventListener('submit', handleLogin);

// Clear error on input
usernameInput.addEventListener('input', hideError);
passwordInput.addEventListener('input', hideError);

// Initialize
checkAuth();
autoFillUsername();
