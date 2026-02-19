import { getStockStatus, formatPrice, getWeatherIcon } from '../src/lib/utils'
import type { Product, WeatherData } from '../src/lib/types'

describe('getStockStatus', () => {
  it('returns critical when stock is 0 or below', () => {
    const product = { current_stock: 0, min_stock: 5 } as Product
    expect(getStockStatus(product)).toBe('critical')
  })

  it('returns critical when stock is negative', () => {
    const product = { current_stock: -5, min_stock: 5 } as Product
    expect(getStockStatus(product)).toBe('critical')
  })

  it('returns low when stock is below min_stock but above 0', () => {
    const product = { current_stock: 3, min_stock: 5 } as Product
    expect(getStockStatus(product)).toBe('low')
  })

  it('returns ok when stock is above min_stock', () => {
    const product = { current_stock: 10, min_stock: 5 } as Product
    expect(getStockStatus(product)).toBe('ok')
  })
})

describe('formatPrice', () => {
  it('formats price in ARS currency', () => {
    const result = formatPrice(24545)
    expect(result).toContain('24.545')
  })

  it('handles zero price', () => {
    const result = formatPrice(0)
    expect(result).toContain('0')
  })

  it('handles large numbers', () => {
    const result = formatPrice(1000000)
    expect(result).toContain('1.000.000')
  })
})

describe('getWeatherIcon', () => {
  it('returns sun emoji for clear conditions', () => {
    expect(getWeatherIcon('Clear')).toBe('☀️')
    expect(getWeatherIcon('clear')).toBe('☀️')
    expect(getWeatherIcon('Sunny')).toBe('☀️')
  })

  it('returns cloud emoji for cloudy conditions', () => {
    expect(getWeatherIcon('Clouds')).toBe('☁️')
    expect(getWeatherIcon('cloudy')).toBe('☁️')
  })

  it('returns rain emoji for rainy conditions', () => {
    expect(getWeatherIcon('Rain')).toBe('🌧️')
    expect(getWeatherIcon('drizzle')).toBe('🌧️')
  })

  it('returns default emoji for unknown conditions', () => {
    expect(getWeatherIcon('Unknown')).toBe('🌤️')
  })
})

describe('getWeatherInsight', () => {
  it('returns heatwave insight when temp > 30', () => {
    const { getWeatherInsight } = require('../src/lib/utils')
    const weather = {
      temp: 32,
      feels_like: 35,
      condition: 'Clear',
      description: 'Soleado',
      icon: '01d',
      humidity: 45,
      wind_speed: 10,
      forecast: [{ temp_max: 33 }]
    } as WeatherData
    
    const insight = getWeatherInsight(weather)
    expect(insight).not.toBeNull()
    expect(insight?.type).toBe('heatwave')
    expect(insight?.icon).toBe('🔥')
  })

  it('returns rain insight for rainy conditions', () => {
    const { getWeatherInsight } = require('../src/lib/utils')
    const weather = {
      temp: 20,
      feels_like: 19,
      condition: 'Rain',
      description: 'Lluvia',
      icon: '10d',
      humidity: 80,
      wind_speed: 15,
      forecast: []
    } as WeatherData
    
    const insight = getWeatherInsight(weather)
    expect(insight).not.toBeNull()
    expect(insight?.type).toBe('rain')
    expect(insight?.icon).toBe('🌧️')
  })

  it('returns null for normal conditions', () => {
    const { getWeatherInsight } = require('../src/lib/utils')
    const weather = {
      temp: 22,
      feels_like: 21,
      condition: 'Clouds',
      description: 'Nublado',
      icon: '03d',
      humidity: 60,
      wind_speed: 10,
      forecast: [{ temp_max: 25 }]
    } as WeatherData
    
    const insight = getWeatherInsight(weather)
    expect(insight).toBeNull()
  })
})
