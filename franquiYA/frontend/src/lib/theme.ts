/**
 * Theme Configuration System
 * Supports: Modern (blue), Classic (neutral), Vibrant (colorful)
 */

export type ThemeName = 'modern' | 'classic' | 'vibrant'

export interface ThemeColors {
  primary: string
  primaryHover: string
  secondary: string
  accent: string
  background: string
  surface: string
  border: string
  text: string
  textMuted: string
  success: string
  warning: string
  error: string
  info: string
}

export interface Theme {
  name: ThemeName
  colors: ThemeColors
  fonts: {
    heading: string
    body: string
  }
}

export const themes: Record<ThemeName, Theme> = {
  modern: {
    name: 'modern',
    colors: {
      primary: '#2563eb',      // Blue 600
      primaryHover: '#1d4ed8', // Blue 700
      secondary: '#64748b',    // Slate 500
      accent: '#0ea5e9',       // Sky 500
      background: '#f8fafc',   // Slate 50
      surface: '#ffffff',
      border: '#e2e8f0',       // Slate 200
      text: '#1e293b',         // Slate 800
      textMuted: '#64748b',    // Slate 500
      success: '#22c55e',      // Green 500
      warning: '#f59e0b',      // Amber 500
      error: '#ef4444',        // Red 500
      info: '#3b82f6',         // Blue 500
    },
    fonts: {
      heading: 'Inter, system-ui, sans-serif',
      body: 'Inter, system-ui, sans-serif',
    },
  },
  classic: {
    name: 'classic',
    colors: {
      primary: '#4a3728',      // Brown 800
      primaryHover: '#3d2e22', // Brown 900
      secondary: '#8b7355',    // Brown 500
      accent: '#d4a574',       // Tan 400
      background: '#fff8f0',   // Warm white
      surface: '#ffffff',
      border: '#e8dfd3',       // Tan 200
      text: '#4a3728',         // Brown 800
      textMuted: '#8b7355',    // Brown 500
      success: '#65a30d',      // Lime 600
      warning: '#d97706',      // Amber 600
      error: '#dc2626',        // Red 700
      info: '#0891b2',         // Cyan 600
    },
    fonts: {
      heading: 'Georgia, serif',
      body: 'Georgia, serif',
    },
  },
  vibrant: {
    name: 'vibrant',
    colors: {
      primary: '#7c3aed',      // Violet 600
      primaryHover: '#6d28d9', // Violet 700
      secondary: '#ec4899',    // Pink 500
      accent: '#14b8a6',       // Teal 500
      background: '#faf5ff',   // Violet 50
      surface: '#ffffff',
      border: '#ddd6fe',       // Violet 200
      text: '#1f2937',         // Gray 800
      textMuted: '#6b7280',    // Gray 500
      success: '#10b981',      // Emerald 500
      warning: '#f97316',      // Orange 500
      error: '#f43f5e',        // Rose 500
      info: '#6366f1',         // Indigo 500
    },
    fonts: {
      heading: 'Poppins, system-ui, sans-serif',
      body: 'Inter, system-ui, sans-serif',
    },
  },
}

// Module configuration
export interface ModuleConfig {
  id: string
  name: string
  description: string
  icon: string
  enabled: boolean
  required: boolean // Required modules cannot be disabled
}

export const availableModules: ModuleConfig[] = [
  {
    id: 'stock',
    name: 'Control de Stock',
    description: 'Gestión de inventario y alertas',
    icon: 'Package',
    enabled: true,
    required: true,
  },
  {
    id: 'invoices',
    name: ' Proveedores',
    description: 'Conciliación de facturas PDF',
    icon: 'FileText',
    enabled: true,
    required: false,
  },
  {
    id: 'employees',
    name: 'Gestión de Personal',
    description: 'Empleados, turnos y vacaciones',
    icon: 'Users',
    enabled: true,
    required: false,
  },
  {
    id: 'pos',
    name: 'Punto de Venta',
    description: 'TPV y cobros',
    icon: 'ShoppingCart',
    enabled: false,
    required: false,
  },
  {
    id: 'cash',
    name: 'Control de Caja',
    description: 'Apertura, cierre y arqueo',
    icon: 'DollarSign',
    enabled: false,
    required: false,
  },
  {
    id: 'customers',
    name: 'Clientes',
    description: 'CRM y historial de ventas',
    icon: 'UserCheck',
    enabled: false,
    required: false,
  },
  {
    id: 'tasks',
    name: 'Tareas',
    description: 'Gestión de tareas',
    icon: 'CheckSquare',
    enabled: true,
    required: false,
  },
  {
    id: 'calendar',
    name: 'Calendario',
    description: 'Eventos y scheduler',
    icon: 'Calendar',
    enabled: true,
    required: false,
  },
  {
    id: 'chat',
    name: 'Asistente IA',
    description: 'Chatbot de ayuda',
    icon: 'MessageCircle',
    enabled: true,
    required: false,
  },
]

export type BusinessType = 'heladeria' | 'restaurant' | 'retail' | 'servicios'

export const businessTypes: Record<BusinessType, { name: string; icon: string }> = {
  heladeria: { name: 'Heladería / Heladería', icon: 'IceCream' },
  restaurant: { name: 'Restaurante / Bar', icon: 'Utensils' },
  retail: { name: 'Retail / Almacén', icon: 'Store' },
  servicios: { name: 'Servicios', icon: 'Briefcase' },
}

// Get CSS variables for a theme
export function getThemeCSS(theme: Theme): string {
  const { colors, fonts } = theme
  return `
    --color-primary: ${colors.primary};
    --color-primary-hover: ${colors.primaryHover};
    --color-secondary: ${colors.secondary};
    --color-accent: ${colors.accent};
    --color-background: ${colors.background};
    --color-surface: ${colors.surface};
    --color-border: ${colors.border};
    --color-text: ${colors.text};
    --color-text-muted: ${colors.textMuted};
    --color-success: ${colors.success};
    --color-warning: ${colors.warning};
    --color-error: ${colors.error};
    --color-info: ${colors.info};
    --font-heading: ${fonts.heading};
    --font-body: ${fonts.body};
  `
}

// Default settings for new franchises
export const defaultSettings = {
  theme: 'modern' as ThemeName,
  businessType: 'heladeria' as BusinessType,
  modules: availableModules.filter(m => m.required).map(m => m.id),
}
