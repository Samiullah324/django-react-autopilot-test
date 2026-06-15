/**
 * JWT token storage uses localStorage/sessionStorage (not httpOnly cookies).
 *
 * SECURITY NOTE: Browser storage is readable by any script on the page, so a
 * successful XSS attack could exfiltrate tokens. Mitigations in this project:
 * - Content-Security-Policy headers (Django middleware + nginx) restrict script sources
 * - JWT is sent via Authorization header (not cookies), so CSRF does not apply to API auth
 * - Tokens are cleared on logout and after password change
 *
 * httpOnly cookies would be preferable for production hardening but require
 * cookie-based auth, CSRF tokens, and CORS credential changes across the stack.
 */
const TOKEN_KEY = 'inventory_access_token';
const REFRESH_KEY = 'inventory_refresh_token';
const STORAGE_TYPE_KEY = 'inventory_token_storage';

type StorageType = 'local' | 'session';

function getValidatedStorageType(): StorageType | null {
  const type = localStorage.getItem(STORAGE_TYPE_KEY);
  if (type !== 'local' && type !== 'session') {
    return null;
  }
  return type;
}

function getActiveStorage(): Storage | null {
  const type = getValidatedStorageType();
  if (!type) {
    return null;
  }
  return type === 'session' ? sessionStorage : localStorage;
}

function getRefreshToken(): string | null {
  const storage = getActiveStorage();
  if (!storage) {
    return null;
  }
  return storage.getItem(REFRESH_KEY);
}

export function getToken(): string | null {
  const storage = getActiveStorage();
  if (!storage) {
    return null;
  }
  return storage.getItem(TOKEN_KEY);
}

export { getRefreshToken };

export function setTokens(access: string, refresh: string, remember = true) {
  clearTokens();
  const storageType: StorageType = remember ? 'local' : 'session';
  localStorage.setItem(STORAGE_TYPE_KEY, storageType);
  const storage = storageType === 'session' ? sessionStorage : localStorage;
  storage.setItem(TOKEN_KEY, access);
  storage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(STORAGE_TYPE_KEY);
}

export class ApiError extends Error {
  status: number;
  data: unknown;
  fieldErrors: Record<string, string[]>;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
    this.fieldErrors = ApiError.extractFieldErrors(data);
  }

  static extractFieldErrors(data: unknown): Record<string, string[]> {
    if (!data || typeof data !== 'object') return {};
    const errors: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (key === 'detail') continue;
      if (Array.isArray(value)) {
        errors[key] = value.map(String);
      } else if (typeof value === 'string') {
        errors[key] = [value];
      }
    }
    return errors;
  }
}

function formatErrorMessage(data: unknown, status: number): string {
  if (typeof data === 'object' && data) {
    if ('detail' in data) {
      const detail = (data as { detail: unknown }).detail;
      if (typeof detail === 'string') return detail;
      if (Array.isArray(detail)) return detail.map(String).join(' ');
    }
    const fieldErrors = ApiError.extractFieldErrors(data);
    const messages = Object.values(fieldErrors).flat();
    if (messages.length) return messages.join(' ');
  }
  return `Request failed (${status})`;
}

let refreshPromise: Promise<string | null> | null = null;

async function performRefreshAccessToken(): Promise<string | null> {
  const storageType = localStorage.getItem(STORAGE_TYPE_KEY);
  if (storageType !== 'local' && storageType !== 'session') {
    clearTokens();
    return null;
  }

  const refresh = getRefreshToken();
  if (!refresh) {
    clearTokens();
    return null;
  }

  const res = await fetch('/api/auth/refresh/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) {
    clearTokens();
    return null;
  }

  const data = await res.json();
  if (!data.access) {
    clearTokens();
    return null;
  }

  const storage = storageType === 'session' ? sessionStorage : localStorage;
  storage.setItem(TOKEN_KEY, data.access);
  if (data.refresh) {
    storage.setItem(REFRESH_KEY, data.refresh);
  }
  return data.access;
}

function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = performRefreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response = await fetch(path, { ...options, headers });

  if (response.status === 401 && getToken()) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`);
      response = await fetch(path, { ...options, headers });
    }
  }

  if (response.status === 204) return undefined as T;

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    throw new ApiError(response.status, formatErrorMessage(data, response.status), data);
  }

  return data as T;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
}

export interface ProfileUpdatePayload {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
  new_password_confirm: string;
}

export const api = {
  register: (data: RegisterPayload) =>
    apiRequest<import('../types').User>('/api/auth/register/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (username: string, password: string) =>
    apiRequest<{ access: string; refresh: string }>('/api/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  logout: (refresh: string) =>
    apiRequest<{ detail: string }>('/api/auth/logout/', {
      method: 'POST',
      body: JSON.stringify({ refresh }),
    }),

  getCurrentUser: () => apiRequest<import('../types').User>('/api/auth/user/'),

  me: () => apiRequest<import('../types').User>('/api/auth/user/'),

  updateUser: (data: ProfileUpdatePayload) =>
    apiRequest<import('../types').User>('/api/auth/user/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  changePassword: (data: ChangePasswordPayload) =>
    apiRequest<{ detail: string }>('/api/auth/change-password/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  dashboard: () => apiRequest<import('../types').DashboardData>('/api/dashboard/'),

  products: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest<import('../types').Paginated<import('../types').Product>>(
      `/api/products/${qs}`,
    );
  },

  product: (id: number) =>
    apiRequest<import('../types').Product>(`/api/products/${id}/`),

  createProduct: (data: FormData | Record<string, unknown>) =>
    apiRequest<import('../types').Product>('/api/products/', {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),

  updateProduct: (id: number, data: FormData | Record<string, unknown>) =>
    apiRequest<import('../types').Product>(`/api/products/${id}/`, {
      method: 'PATCH',
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),

  deleteProduct: (id: number) =>
    apiRequest<void>(`/api/products/${id}/`, { method: 'DELETE' }),

  suppliers: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest<import('../types').Paginated<import('../types').Supplier>>(
      `/api/suppliers/${qs}`,
    );
  },

  createSupplier: (data: Partial<import('../types').Supplier>) =>
    apiRequest<import('../types').Supplier>('/api/suppliers/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateSupplier: (id: number, data: Partial<import('../types').Supplier>) =>
    apiRequest<import('../types').Supplier>(`/api/suppliers/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteSupplier: (id: number) =>
    apiRequest<void>(`/api/suppliers/${id}/`, { method: 'DELETE' }),

  warehouses: () =>
    apiRequest<import('../types').Paginated<import('../types').Warehouse>>(
      '/api/warehouses/',
    ),

  createWarehouse: (data: Partial<import('../types').Warehouse>) =>
    apiRequest<import('../types').Warehouse>('/api/warehouses/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  categories: () =>
    apiRequest<import('../types').Paginated<import('../types').Category>>(
      '/api/categories/',
    ),

  stockMove: (data: Record<string, unknown>) =>
    apiRequest<import('../types').Transaction>('/api/stock/move/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  transactions: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest<import('../types').Paginated<import('../types').Transaction>>(
      `/api/transactions/${qs}`,
    );
  },

  notifications: () =>
    apiRequest<import('../types').Paginated<import('../types').Notification>>(
      '/api/notifications/',
    ),

  markNotificationRead: (id: number) =>
    apiRequest<import('../types').Notification>(`/api/notifications/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ is_read: true }),
    }),

  markAllNotificationsRead: () =>
    apiRequest<{ detail: string }>('/api/notifications/mark_all_read/', {
      method: 'POST',
    }),
};
