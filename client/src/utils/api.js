export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  return fetch(`${API_BASE_URL}${path}`, { ...options, headers });
}

