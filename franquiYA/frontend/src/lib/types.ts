export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'operator';
  user_type: 'franquiciado' | 'empleado';
  franchise_id: number;
  franchise_name?: string;
  is_active: boolean;
  requires_setup?: boolean;
  completed_tour?: boolean;
}

export interface Franchise {
  id: number;
  code: string;
  name: string;
  owner: string;
  cuit: string;
  address: string;
  city: string;
  province: string;
  weather_city: string;
  supplier: string;
}

export interface Product {
  id: number;
  name: string;
  category: ProductCategory;
  unit: string;
  current_stock: number;
  min_stock: number;
  unit_price: number;
  previous_price?: number;
  price_change_pct?: number;
  image_url?: string;
  is_active: boolean;
}

export type ProductCategory = 
  | 'sabor_7.8kg'
  | 'sabor_1lt'
  | 'bombones'
  | 'palitos'
  | 'tortas'
  | 'tentaciones'
  | 'tentacion'
  | 'familiares'
  | 'congelados'
  | 'frizzio'
  | 'smoothies'
  | 'sin_tacc'
  | 'insumos'
  | 'alfajores';

export interface Invoice {
  id: number;
  number: string;
  date: string;
  supplier: string;
  total: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  raw_text?: string;
  created_at: string;
  lines: InvoiceLine[];
}

export interface InvoiceLine {
  id: number;
  invoice_id: number;
  product_id?: number;
  raw_name: string;
  matched_name?: string;
  quantity: number;
  unit: string;
  unit_price: number;
  previous_price?: number;
  price_change_pct?: number;
  total: number;
  is_matched: boolean;
  approved: boolean;
}

export interface StockAudit {
  id: number;
  product_id: number;
  product: Product;
  system_qty: number;
  counted_qty: number;
  difference: number;
  audited_by: string;
  audited_at: string;
}

export interface WeatherData {
  temp: number;
  feels_like: number;
  condition: string;
  description: string;
  icon: string;
  humidity: number;
  wind_speed: number;
  forecast?: WeatherForecast[];
}

export interface WeatherForecast {
  dt: number;
  temp: number;
  temp_min: number;
  temp_max: number;
  condition: string;
  icon: string;
}

export interface WeatherInsight {
  type: 'heatwave' | 'rain' | 'normal';
  bgColor: string;
  borderColor: string;
  icon: string;
  message: string;
  action: string;
}

export interface StockAlert {
  product: Product;
  status: 'critical' | 'low' | 'ok';
  message: string;
}

export interface DashboardStats {
  total_products: number;
  low_stock_count: number;
  critical_stock_count: number;
  pending_invoices: number;
  last_audit_date?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  'sabor_7.8kg': 'Helados 7.8kg',
  'sabor_1lt': 'Helados 1lt',
  'bombones': 'Bombones',
  'palitos': 'Palitos',
  'tortas': 'Tortas',
  'tentaciones': 'Tentaciones',
  'tentacion': 'Tentación',
  'familiares': 'Familiares',
  'congelados': 'Congelados',
  'frizzio': 'Frizzio',
  'smoothies': 'Smoothies',
  'sin_tacc': 'Sin TACC',
  'insumos': 'Insumos',
  'alfajores': 'Alfajores',
};

export const CATEGORY_ORDER: ProductCategory[] = [
  'sabor_7.8kg',
  'sabor_1lt',
  'bombones',
  'palitos',
  'tortas',
  'tentaciones',
  'tentacion',
  'familiares',
  'congelados',
  'frizzio',
  'smoothies',
  'sin_tacc',
  'insumos',
  'alfajores',
];

// === NEW TYPES FOR TURNS/HOLIDAYS/CALENDAR ===

export interface Role {
  id: number;
  franchise_id: number;
  name: string;
  color: string;
  permissions: string;
  is_active: boolean;
}

export interface Employee {
  id: number;
  franchise_id: number;
  user_id?: number;
  role_id: number;
  name: string;
  phone?: string;
  dni?: string;
  emergency_contact?: string;
  vacation_days_total: number;
  hourly_rate?: number;
  is_active: boolean;
  hire_date: string;
  created_at: string;
  role?: Role;
  vacation_taken?: number;
  vacation_remaining?: number;
}

export interface Shift {
  id: number;
  franchise_id: number;
  employee_id: number;
  role_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  is_recurring: boolean;
  created_at: string;
  employee?: Employee;
  role?: Role;
}

export interface ShiftCalendar {
  days: string[];
  schedule: Record<number, {
    id: number;
    employee_id: number;
    employee_name: string;
    role_id: number;
    start_time: string;
    end_time: string;
    day_name: string;
  }[]>;
}

export interface Holiday {
  id: number;
  franchise_id: number;
  employee_id: number;
  start_date: string;
  end_date: string;
  days_count: number;
  status: 'planned' | 'approved' | 'taken';
  notes?: string;
  created_at: string;
  approved_by?: number;
  approved_at?: string;
  employee?: Employee;
}

export interface VacationSummary {
  employee_id: number;
  employee_name: string;
  total_days: number;
  days_taken: number;
  days_remaining: number;
  planned_holidays: {
    id: number;
    start_date: string;
    end_date: string;
    days_count: number;
    status: string;
  }[];
}

export interface Task {
  id: number;
  franchise_id: number;
  created_by: number;
  assigned_to?: number;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed';
  due_date?: string;
  created_at: string;
  completed_at?: string;
  creator?: { id: number; name: string };
  assignee?: { id: number; name: string };
}

export interface TaskStats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  urgent: number;
}

export interface ExternalEvent {
  id: number;
  franchise_id: number;
  title: string;
  description?: string;
  visitor_name: string;
  visitor_contact?: string;
  date: string;
  time_start?: string;
  time_end?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  is_recurring: boolean;
  created_at: string;
}
