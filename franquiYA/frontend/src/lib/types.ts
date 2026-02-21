export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'operator';
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
