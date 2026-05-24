const TOKEN_KEY = 'inventory_access_token';
const REFRESH_KEY = 'inventory_refresh_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = localStorage.getItem(REFRESH_KEY);
  if (!refresh) return null;

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
  if (data.access) {
    localStorage.setItem(TOKEN_KEY, data.access);
    return data.access;
  }
  return null;
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
    const message =
      typeof data === 'object' && data && 'detail' in data
        ? String((data as { detail: string }).detail)
        : `Request failed (${response.status})`;
    throw new ApiError(response.status, message, data);
  }

  return data as T;
}

export const api = {
  login: (username: string, password: string) =>
    apiRequest<{ access: string; refresh: string }>('/api/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  me: () => apiRequest<import('../types').User>('/api/auth/me/'),

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
