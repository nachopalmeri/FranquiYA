import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { WeatherData, WeatherInsight, Product } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number, currency: string = 'ARS'): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('es-AR').format(num)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function getStockStatus(product: Product): 'critical' | 'low' | 'ok' {
  if (product.current_stock <= 0) return 'critical'
  if (product.current_stock <= product.min_stock) return 'low'
  return 'ok'
}

export function getStockStatusColor(status: 'critical' | 'low' | 'ok'): string {
  switch (status) {
    case 'critical':
      return 'bg-red-500 text-white'
    case 'low':
      return 'bg-amber-500 text-white'
    case 'ok':
      return 'bg-emerald-500 text-white'
  }
}

export function getWeatherInsight(weather: WeatherData | null): WeatherInsight | null {
  if (!weather) return null

  const maxTemp = weather.forecast?.[0]?.temp_max || weather.temp
  const condition = weather.condition.toLowerCase()

  if (maxTemp > 30) {
    return {
      type: 'heatwave',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-300',
      icon: '🔥',
      message: 'Ola de Calor Detectada. Se proyecta +40% en ventas de Impulsivos.',
      action: 'Revisar stock de Limón y Agua.',
    }
  }

  if (condition.includes('rain') || condition.includes('drizzle') || condition.includes('thunderstorm')) {
    return {
      type: 'rain',
      bgColor: 'bg-slate-100',
      borderColor: 'border-slate-300',
      icon: '🌧️',
      message: 'Alerta de Lluvia. Tráfico en local bajo.',
      action: 'Sugerencia: Activar promo Delivery.',
    }
  }

  return null
}

export function getWeatherIcon(condition: string): string {
  const c = condition.toLowerCase()
  if (c.includes('clear') || c.includes('sunny')) return '☀️'
  if (c.includes('cloud')) return '☁️'
  if (c.includes('rain') || c.includes('drizzle')) return '🌧️'
  if (c.includes('thunderstorm')) return '⛈️'
  if (c.includes('snow')) return '❄️'
  if (c.includes('mist') || c.includes('fog')) return '🌫️'
  return '🌤️'
}

export function calculatePriceChange(current: number, previous: number): number {
  if (!previous || previous === 0) return 0
  return Math.round(((current - previous) / previous) * 100)
}

export function getPriceChangeBadge(change: number): { color: string; label: string } {
  if (change > 15) return { color: 'bg-red-500 text-white', label: `▲ ${change}% Inflación` }
  if (change > 5) return { color: 'bg-amber-500 text-white', label: `▲ ${change}%` }
  if (change > 0) return { color: 'bg-amber-100 text-amber-800', label: `▲ ${change}%` }
  if (change < 0) return { color: 'bg-emerald-100 text-emerald-800', label: `▼ ${Math.abs(change)}%` }
  return { color: 'bg-gray-100 text-gray-600', label: 'Sin cambio' }
}

export function parseInvoiceLine(rawName: string): { name: string; unit: string } {
  const cleanName = rawName
    .replace(/\d+[,.]?\d*\s*KG/i, '')
    .replace(/\d+\s*LT/i, '')
    .replace(/\s*GRIDO$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
  
  let unit = '7.8kg'
  if (rawName.includes('7,800') || rawName.includes('7.800')) unit = '7.8kg'
  else if (rawName.includes('1LT') || rawName.includes('1 LT')) unit = '1lt'
  else if (rawName.includes('X3 LTS') || rawName.includes('X 3 LTS')) unit = '3lt'
  else if (rawName.includes('X 8') || rawName.includes('X8')) unit = 'caja 8u'
  else if (rawName.includes('X 6') || rawName.includes('X6')) unit = 'pack 6u'
  
  return { name: cleanName, unit }
}

export function matchProduct(rawName: string, products: Product[]): Product | undefined {
  const { name } = parseInvoiceLine(rawName)
  const normalizedName = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
  
  return products.find(p => {
    const productNorm = p.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
    return productNorm.includes(normalizedName) || normalizedName.includes(productNorm)
  })
}

export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}
