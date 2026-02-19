'use client'

import { useState, useEffect } from 'react'
import { Thermometer, Droplets, Wind } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { WeatherData, WeatherInsight } from '@/lib/types'
import { getWeatherInsight, getWeatherIcon } from '@/lib/utils'

export function Header() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [insight, setInsight] = useState<WeatherInsight | null>(null)

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/weather`, {
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
    <header className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">
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
              <Card className="border shadow-sm">
                <CardContent className="flex items-center gap-3 px-4 py-2">
                  <span className="text-3xl">{getWeatherIcon(weather.condition)}</span>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <Thermometer className="h-4 w-4 text-gray-500" />
                      <span className="text-lg font-semibold">{Math.round(weather.temp)}°C</span>
                      <span className="text-sm text-gray-500">
                        ST: {Math.round(weather.feels_like)}°C
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
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
                <Card className={`border-2 ${insight.bgColor} ${insight.borderColor}`}>
                  <CardContent className="flex items-center gap-3 px-4 py-2">
                    <span className="text-2xl">{insight.icon}</span>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-800">{insight.message}</span>
                      <span className="text-xs text-gray-600">{insight.action}</span>
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
