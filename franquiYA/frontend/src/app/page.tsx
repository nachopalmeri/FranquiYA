'use client'

import { useEffect, useState, useMemo } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { KPICards } from '@/components/stock/kpi-cards'
import { StockAlerts } from '@/components/stock/alert-badge'
import { ChatWidget } from '@/components/chat/chat-widget'
import type { DashboardStats, StockAlert } from '@/lib/types'
import { useAuth } from '@/components/layout/auth-provider'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, FileText, Smartphone, BarChart3, TrendingUp, Users, Calendar, Clock } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [alerts, setAlerts] = useState<StockAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'critical' | 'low'>('all')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return

        const [statsRes, alertsRes] = await Promise.all([
          fetch(`${API_URL}/dashboard/stats`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${API_URL}/stock/alerts`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ])

        if (statsRes.ok) {
          setStats(await statsRes.json())
        }
        if (alertsRes.ok) {
          setAlerts(await alertsRes.json())
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading && user) {
      fetchData()
    }
  }, [authLoading, user])

  const filteredAlerts = useMemo(() => {
    let filtered = alerts
    
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(a => 
        a.product.name.toLowerCase().includes(searchLower)
      )
    }
    
    if (filter !== 'all') {
      filtered = filtered.filter(a => a.status === filter)
    }
    
    return filtered
  }, [alerts, search, filter])

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E31D2B] border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />
      <main className="flex-1 ml-64">
        <Header />
        <div className="p-6 space-y-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white font-heading mb-1">
              Dashboard
            </h1>
            <p className="text-gray-400">Bienvenido, {user?.name}</p>
          </div>

          <KPICards stats={stats} loading={loading} />

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar productos en alerta..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-gray-500 focus:border-[#E31D2B]/50"
              />
            </div>
            
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'Todos' },
                { value: 'critical', label: 'Críticos' },
                { value: 'low', label: 'Bajo' }
              ].map((btn) => (
                <Button
                  key={btn.value}
                  variant={filter === btn.value ? 'default' : 'outline'}
                  onClick={() => setFilter(btn.value as 'all' | 'critical' | 'low')}
                  className={
                    filter === btn.value 
                      ? btn.value === 'critical' 
                        ? 'bg-red-500 hover:bg-red-600 text-white' 
                        : btn.value === 'low'
                          ? 'bg-amber-500 hover:bg-amber-600 text-white'
                          : 'bg-[#E31D2B] hover:bg-[#C41925] text-white'
                      : 'border-white/10 text-white hover:bg-white/10 hover:border-white/20'
                  }
                >
                  {btn.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <StockAlerts alerts={filteredAlerts} loading={loading} />
            
            <Card className="border-white/10 bg-white/5">
              <CardContent className="p-6">
                <h3 className="mb-4 font-semibold text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-[#E31D2B]" />
                  Acciones Rápidas
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <a
                    href="/invoices"
                    className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:bg-white/10 hover:border-white/20"
                  >
                    <div className="rounded-lg bg-purple-500/20 p-2 transition-transform duration-200 group-hover:scale-110">
                      <FileText className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white group-hover:text-[#E31D2B]">Cargar Factura</p>
                      <p className="text-sm text-gray-400">Procesar PDF de Helacor</p>
                    </div>
                  </a>
                  <a
                    href="/audit"
                    className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:bg-white/10 hover:border-white/20"
                  >
                    <div className="rounded-lg bg-blue-500/20 p-2 transition-transform duration-200 group-hover:scale-110">
                      <Smartphone className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white group-hover:text-[#E31D2B]">Iniciar Auditoría</p>
                      <p className="text-sm text-gray-400">Contar stock en cámara</p>
                    </div>
                  </a>
                  <a
                    href="/employees"
                    className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:bg-white/10 hover:border-white/20"
                  >
                    <div className="rounded-lg bg-emerald-500/20 p-2 transition-transform duration-200 group-hover:scale-110">
                      <Users className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white group-hover:text-[#E31D2B]">Empleados</p>
                      <p className="text-sm text-gray-400">Gestionar equipo</p>
                    </div>
                  </a>
                  <a
                    href="/stock"
                    className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:bg-white/10 hover:border-white/20"
                  >
                    <div className="rounded-lg bg-amber-500/20 p-2 transition-transform duration-200 group-hover:scale-110">
                      <BarChart3 className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white group-hover:text-[#E31D2B]">Ver Stock</p>
                      <p className="text-sm text-gray-400">Lista completa</p>
                    </div>
                  </a>
                  <a
                    href="/shifts"
                    className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:bg-white/10 hover:border-white/20"
                  >
                    <div className="rounded-lg bg-rose-500/20 p-2 transition-transform duration-200 group-hover:scale-110">
                      <Clock className="h-5 w-5 text-rose-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white group-hover:text-[#E31D2B]">Turnos</p>
                      <p className="text-sm text-gray-400">Horario semanal</p>
                    </div>
                  </a>
                  <a
                    href="/calendar"
                    className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:bg-white/10 hover:border-white/20"
                  >
                    <div className="rounded-lg bg-cyan-500/20 p-2 transition-transform duration-200 group-hover:scale-110">
                      <Calendar className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white group-hover:text-[#E31D2B]">Calendario</p>
                      <p className="text-sm text-gray-400">Eventos externos</p>
                    </div>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <ChatWidget />
      </main>
    </div>
  )
}
