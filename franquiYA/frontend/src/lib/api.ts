import type { 
  User, 
  Franchise, 
  Product, 
  Invoice, 
  StockAudit, 
  WeatherData, 
  DashboardStats,
  LoginCredentials,
  AuthResponse,
  StockAlert
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new ApiError(response.status, error.detail || 'Request failed');
  }

  return response.json();
}

export const api = {
  auth: {
    login: (credentials: LoginCredentials) => 
      fetchApi<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    
    me: () => fetchApi<User>('/auth/me'),
    
    register: (data: { email: string; password: string; name: string }) =>
      fetchApi<User>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  franchise: {
    get: () => fetchApi<Franchise>('/franchise'),
    update: (data: Partial<Franchise>) =>
      fetchApi<Franchise>('/franchise', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  stock: {
    list: (category?: string) => 
      fetchApi<Product[]>(category ? `/stock?category=${category}` : '/stock'),
    
    get: (id: number) => fetchApi<Product>(`/stock/${id}`),
    
    update: (id: number, data: Partial<Product>) =>
      fetchApi<Product>(`/stock/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    
    alerts: () => fetchApi<StockAlert[]>('/stock/alerts'),
  },

  invoices: {
    list: () => fetchApi<Invoice[]>('/invoices'),
    
    get: (id: number) => fetchApi<Invoice>(`/invoices/${id}`),
    
    upload: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/invoices/upload`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
        throw new ApiError(response.status, error.detail);
      }

      return response.json() as Promise<Invoice>;
    },
    
    confirm: (id: number) =>
      fetchApi<Invoice>(`/invoices/${id}/confirm`, {
        method: 'POST',
      }),
    
    approveLine: (invoiceId: number, lineId: number, productId?: number) =>
      fetchApi<Invoice>(`/invoices/${invoiceId}/lines/${lineId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ product_id: productId }),
      }),
  },

  audit: {
    products: () => fetchApi<Product[]>('/audit/products'),
    
    submit: (data: { product_id: number; counted_qty: number }[]) =>
      fetchApi<StockAudit[]>('/audit/submit', {
        method: 'POST',
        body: JSON.stringify({ items: data }),
      }),
    
    history: () => fetchApi<StockAudit[]>('/audit/history'),
  },

  weather: {
    current: () => fetchApi<WeatherData>('/weather'),
  },

  dashboard: {
    stats: () => fetchApi<DashboardStats>('/dashboard/stats'),
  },
};

export { ApiError };
