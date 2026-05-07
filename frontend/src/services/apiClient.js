/**
 * apiClient.js — Centralized API fetch wrapper with auth headers
 * 
 * Semua frontend service harus menggunakan fungsi ini agar:
 * 1. Token Authorization otomatis dikirim
 * 2. Error handling konsisten
 * 3. Auto-logout jika token expired (401)
 */

const API_BASE = '/api';

/**
 * Get auth headers dari localStorage
 */
function getAuthHeaders(extraHeaders = {}) {
  const token = localStorage.getItem('token');
  return {
    ...extraHeaders,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

/**
 * Handle response errors secara konsisten
 */
async function handleResponse(response) {
  if (response.status === 401) {
    // Token expired atau invalid — trigger logout
    localStorage.removeItem('token');
    // Dispatch custom event agar AuthContext bisa react
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
  }
  
  if (!response.ok) {
    let errorMessage = `Request gagal (${response.status})`;
    try {
      const error = await response.json();
      errorMessage = error.error || error.message || errorMessage;
    } catch {
      // Response bukan JSON
    }
    throw new Error(errorMessage);
  }
  
  return response.json();
}

/**
 * GET request with auth
 */
export async function apiGet(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'GET',
    headers: getAuthHeaders(),
    cache: options.noCache ? 'no-store' : undefined,
    ...options,
  });
  return handleResponse(response);
}

/**
 * POST request with auth
 */
export async function apiPost(endpoint, data, options = {}) {
  const isFormData = data instanceof FormData;
  const headers = isFormData 
    ? getAuthHeaders() // FormData sets Content-Type automatically
    : getAuthHeaders({ 'Content-Type': 'application/json' });

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers,
    body: isFormData ? data : JSON.stringify(data),
    ...options,
  });
  return handleResponse(response);
}

/**
 * PUT request with auth
 */
export async function apiPut(endpoint, data) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'PUT',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

/**
 * DELETE request with auth
 */
export async function apiDelete(endpoint) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export { API_BASE, getAuthHeaders };
