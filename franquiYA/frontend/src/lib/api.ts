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
  StockAlert,
  Role,
  Employee,
  Shift,
  ShiftCalendar,
  Holiday,
  VacationSummary,
  Task,
  TaskStats,
  ExternalEvent
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

  roles: {
    list: () => fetchApi<Role[]>('/roles'),
    create: (data: { name: string; color: string; permissions?: string }) =>
      fetchApi<Role>('/roles', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: { name: string; color: string; permissions?: string }) =>
      fetchApi<Role>(`/roles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => fetchApi<void>(`/roles/${id}`, { method: 'DELETE' }),
  },

  employees: {
    list: () => fetchApi<Employee[]>('/employees'),
    get: (id: number) => fetchApi<Employee>(`/employees/${id}`),
    create: (data: {
      name: string;
      role_id: number;
      phone?: string;
      dni?: string;
      emergency_contact?: string;
      vacation_days_total?: number;
      hourly_rate?: number;
      user_id?: number;
    }) => fetchApi<Employee>('/employees', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Employee>) =>
      fetchApi<Employee>(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => fetchApi<void>(`/employees/${id}`, { method: 'DELETE' }),
    vacationSummary: (id: number) => fetchApi<VacationSummary>(`/employees/${id}/vacation-summary`),
  },

  shifts: {
    list: () => fetchApi<Shift[]>('/shifts'),
    calendar: () => fetchApi<ShiftCalendar>('/shifts/calendar'),
    create: (data: {
      employee_id: number;
      role_id: number;
      day_of_week: number;
      start_time: string;
      end_time: string;
      is_recurring?: boolean;
    }) => fetchApi<Shift>('/shifts', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Shift>) =>
      fetchApi<Shift>(`/shifts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => fetchApi<void>(`/shifts/${id}`, { method: 'DELETE' }),
  },

  holidays: {
    list: () => fetchApi<Holiday[]>('/holidays'),
    calendar: () => fetchApi<{ calendar: Record<string, Holiday[]> }>('/holidays/calendar'),
    create: (data: {
      employee_id: number;
      start_date: string;
      end_date: string;
      days_count: number;
      notes?: string;
      status?: string;
    }) => fetchApi<Holiday>('/holidays', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: { status?: string }) =>
      fetchApi<Holiday>(`/holidays/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => fetchApi<void>(`/holidays/${id}`, { method: 'DELETE' }),
  },

  tasks: {
    list: (params?: { status?: string; priority?: string; assigned_to?: number }) => {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      return fetchApi<Task[]>(`/tasks${query ? `?${query}` : ''}`);
    },
    create: (data: {
      title: string;
      description?: string;
      priority?: string;
      due_date?: string;
      assigned_to?: number;
    }) => fetchApi<Task>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Task>) =>
      fetchApi<Task>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => fetchApi<void>(`/tasks/${id}`, { method: 'DELETE' }),
    stats: () => fetchApi<TaskStats>('/tasks/stats'),
  },

  externalEvents: {
    list: (month?: string) => 
      fetchApi<ExternalEvent[]>(month ? `/external-events?month=${month}` : '/external-events'),
    create: (data: {
      title: string;
      description?: string;
      visitor_name: string;
      visitor_contact?: string;
      date: string;
      time_start?: string;
      time_end?: string;
      is_recurring?: boolean;
    }) => fetchApi<ExternalEvent>('/external-events', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<ExternalEvent>) =>
      fetchApi<ExternalEvent>(`/external-events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => fetchApi<void>(`/external-events/${id}`, { method: 'DELETE' }),
  },
};

export { ApiError };
