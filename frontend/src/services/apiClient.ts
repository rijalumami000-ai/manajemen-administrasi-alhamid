/**
 * apiClient.ts — Centralized API fetch wrapper with auth headers
 * 
 * Semua frontend service harus menggunakan fungsi ini agar:
 * 1. Token Authorization otomatis dikirim
 * 2. Error handling konsisten
 * 3. Auto-logout jika token expired (401)
 */

const API_BASE = '/api';

export interface ApiRequestOptions extends Omit<RequestInit, 'headers'> {
  noCache?: boolean;
  headers?: Record<string, string>;
}

/**
 * Get auth headers dari localStorage
 */
function getAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const token = localStorage.getItem('token');
  return {
    ...extraHeaders,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

/**
 * Handle response errors secara konsisten
 */
async function handleResponse<T = any>(response: Response): Promise<T> {
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
  
  return response.json() as Promise<T>;
}

/**
 * GET request with auth
 */
export async function apiGet<T = any>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
  const { noCache, headers: customHeaders, ...rest } = options;
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'GET',
    headers: getAuthHeaders(customHeaders),
    cache: noCache ? 'no-store' : undefined,
    ...rest,
  });
  return handleResponse<T>(response);
}

/**
 * POST request with auth
 */
export async function apiPost<T = any>(endpoint: string, data?: any, options: ApiRequestOptions = {}): Promise<T> {
  const { headers: customHeaders, ...rest } = options;
  const isFormData = data instanceof FormData;
  const headers = isFormData 
    ? getAuthHeaders(customHeaders) // FormData sets Content-Type automatically
    : getAuthHeaders({ 'Content-Type': 'application/json', ...customHeaders });

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers,
    body: isFormData ? data : (data !== undefined ? JSON.stringify(data) : undefined),
    ...rest,
  });
  return handleResponse<T>(response);
}

/**
 * PUT request with auth
 */
export async function apiPut<T = any>(endpoint: string, data?: any, options: ApiRequestOptions = {}): Promise<T> {
  const { headers: customHeaders, ...rest } = options;
  const isFormData = data instanceof FormData;
  const headers = isFormData 
    ? getAuthHeaders(customHeaders) // FormData sets Content-Type automatically
    : getAuthHeaders({ 'Content-Type': 'application/json', ...customHeaders });

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'PUT',
    headers,
    body: isFormData ? data : (data !== undefined ? JSON.stringify(data) : undefined),
    ...rest,
  });
  return handleResponse<T>(response);
}

/**
 * DELETE request with auth
 */
export async function apiDelete<T = any>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse<T>(response);
}

/**
 * PATCH request with auth
 */
export async function apiPatch<T = any>(endpoint: string, data?: any): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'PATCH',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: data !== undefined ? JSON.stringify(data) : undefined,
  });
  return handleResponse<T>(response);
}

export { API_BASE, getAuthHeaders };
