// Talks to the private admin functions (/api/admin/*). The session lives in an HttpOnly cookie
// that this page cannot read; every request just sends it along.

export interface AdminUser { id: string; name: string; role: 'superadmin' | 'admin' | 'agent'; permissions: { dashboard: boolean; applications: boolean; bookings: boolean; edit: boolean; remove: boolean } }
export type Status = 'New' | 'Contacted' | 'Done';
export const STATUSES: Status[] = ['New', 'Contacted', 'Done'];

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function api<T = Record<string, unknown>>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const res = await fetch(`/api/admin/${path}`, {
    method,
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { 'x-phirst-request': '1', ...(body !== undefined ? { 'content-type': 'application/json' } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) throw new ApiError(res.status, data.error || 'Something went wrong. Please try again.');
  return data as T;
}

export const login = (username: string, password: string) => api<{ user: AdminUser }>('auth/login', 'POST', { username, password });
