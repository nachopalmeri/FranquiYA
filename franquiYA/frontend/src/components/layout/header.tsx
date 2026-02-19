'use client'

import { useState, useEffect } from 'react'
import { Thermometer, Droplets, Wind } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { WeatherData, WeatherInsight } from '@/lib/types'
import { getWeatherInsight, getWeatherIcon } from '@/lib/utils'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

export function Header() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [insight, setInsight] = useState<WeatherInsight | null>(null)

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return

        const res = await fetch(`${API_URL}/weather`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setWeather(data)
          setInsight(getWeatherInsight(data))
        }
      } catch (error) {
        console.error('Failed to fetch weather:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchWeather()
  }, [])

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-[#0a0a0a]/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-white">
            {new Date().toLocaleDateString('es-AR', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
          </h2>
        </div>

        <div className="flex items-center gap-4">
          {loading ? (
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-48 rounded-lg" />
              <Skeleton className="h-12 w-64 rounded-lg" />
            </div>
          ) : weather ? (
            <div className="flex items-center gap-4">
              <Card className="border-border bg-secondary">
                <CardContent className="flex items-center gap-3 px-4 py-2">
                  <span className="text-3xl">{getWeatherIcon(weather.condition)}</span>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <Thermometer className="h-4 w-4 text-gray-400" />
                      <span className="text-lg font-semibold text-white">{Math.round(weather.temp)}°C</span>
                      <span className="text-sm text-gray-400">
                        ST: {Math.round(weather.feels_like)}°C
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Droplets className="h-3 w-3" />
                        {weather.humidity}%
                      </span>
                      <span className="flex items-center gap-1">
                        <Wind className="h-3 w-3" />
                        {weather.wind_speed} km/h
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {insight && (
                <Card className={`border-2 ${insight.bgColor.replace('bg-orange-50', 'bg-orange-500/10').replace('bg-slate-100', 'bg-blue-500/10')} ${insight.borderColor.replace('border-orange-300', 'border-orange-500/30').replace('border-slate-300', 'border-blue-500/30')}`}>
                  <CardContent className="flex items-center gap-3 px-4 py-2">
                    <span className="text-2xl">{insight.icon}</span>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-white">{insight.message}</span>
                      <span className="text-xs text-gray-400">{insight.action}</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
