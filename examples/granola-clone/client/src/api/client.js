// Every call to the backend goes through this file.
// Endpoints match docs/api-contract.md exactly.
import { useMemo } from 'react';
import { useSession } from '../auth/SessionProvider.jsx';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Error carrying the backend's { error, message } body.
export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request(path, { method = 'GET', body, token, onUnauthorized } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'network_error', 'Could not reach the server. Is the backend running?');
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    // A 401 on a protected call means the session is gone: clear it.
    if (res.status === 401 && onUnauthorized) onUnauthorized();
    throw new ApiError(res.status, data?.error || 'error', data?.message || 'Something went wrong');
  }
  return data;
}

// Public auth calls (no token needed).
export const authApi = {
  signup: (name, email, password) =>
    request('/auth/signup', { method: 'POST', body: { name, email, password } }),
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: { email, password } }),
  me: (token) => request('/auth/me', { token }),
};

// Protected calls, bound to the current session token.
export function useApi() {
  const { accessToken, signOut } = useSession();

  return useMemo(() => {
    const call = (path, opts = {}) =>
      request(path, { ...opts, token: accessToken, onUnauthorized: signOut });

    return {
      listTemplates: () => call('/api/templates'),
      listNotes: () => call('/api/notes'),
      createNote: (fields = {}) => call('/api/notes', { method: 'POST', body: fields }),
      getNote: (id) => call(`/api/notes/${id}`),
      updateNote: (id, fields) => call(`/api/notes/${id}`, { method: 'PUT', body: fields }),
      enhanceNote: (id) => call(`/api/notes/${id}/enhance`, { method: 'POST' }),
      deleteNote: (id) => call(`/api/notes/${id}`, { method: 'DELETE' }),
    };
  }, [accessToken, signOut]);
}
