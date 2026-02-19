'use client'

import { useEffect, useState, useMemo } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { KPICards } from '@/components/stock/kpi-cards'
import { StockAlerts } from '@/components/stock/alert-badge'
import type { DashboardStats, StockAlert } from '@/lib/types'
import { useAuth } from '@/components/layout/auth-provider'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'

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
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E31D2B] border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />
      <main className="flex-1 ml-64">
        <Header />
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-400">Bienvenido, {user?.name}</p>
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar productos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-border bg-secondary pl-10 text-white placeholder:text-gray-500"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
                className={filter === 'all' ? 'bg-[#E31D2B] hover:bg-[#C41925]' : 'border-border text-gray-400 hover:text-white'}
              >
                Todos
              </Button>
              <Button
                variant={filter === 'critical' ? 'default' : 'outline'}
                onClick={() => setFilter('critical')}
                className={filter === 'critical' ? 'bg-red-500 hover:bg-red-600' : 'border-border text-gray-400 hover:text-white'}
              >
                Críticos
              </Button>
              <Button
                variant={filter === 'low' ? 'default' : 'outline'}
                onClick={() => setFilter('low')}
                className={filter === 'low' ? 'bg-amber-500 hover:bg-amber-600' : 'border-border text-gray-400 hover:text-white'}
              >
                Bajo
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <KPICards stats={stats} loading={loading} />
            
            <div className="grid gap-6 lg:grid-cols-2">
              <StockAlerts alerts={filteredAlerts} loading={loading} />
              
              <Card className="border-border bg-secondary">
                <CardContent className="p-6">
                  <h3 className="mb-4 font-semibold text-white">Acciones Rápidas</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <a
                      href="/invoices"
                      className="card-hover flex items-center gap-3 rounded-lg border border-border bg-[#0a0a0a] p-4"
                    >
                      <div className="rounded-lg bg-purple-500/10 p-2">
                        <span className="text-2xl">📄</span>
                      </div>
                      <div>
                        <p className="font-medium text-white">Cargar Factura</p>
                        <p className="text-sm text-gray-400">Procesar PDF de Helacor</p>
                      </div>
                    </a>
                    <a
                      href="/audit"
                      className="card-hover flex items-center gap-3 rounded-lg border border-border bg-[#0a0a0a] p-4"
                    >
                      <div className="rounded-lg bg-blue-500/10 p-2">
                        <span className="text-2xl">📱</span>
                      </div>
                      <div>
                        <p className="font-medium text-white">Iniciar Auditoría</p>
                        <p className="text-sm text-gray-400">Contar stock en cámara</p>
                      </div>
                    </a>
                    <a
                      href="/stock"
                      className="card-hover flex items-center gap-3 rounded-lg border border-border bg-[#0a0a0a] p-4"
                    >
                      <div className="rounded-lg bg-emerald-500/10 p-2">
                        <span className="text-2xl">📊</span>
                      </div>
                      <div>
                        <p className="font-medium text-white">Ver Stock</p>
                        <p className="text-sm text-gray-400">Lista completa</p>
                      </div>
                    </a>
                    <div className="card-hover flex items-center gap-3 rounded-lg border border-border bg-[#0a0a0a] p-4 opacity-50">
                      <div className="rounded-lg bg-amber-500/10 p-2">
                        <span className="text-2xl">📈</span>
                      </div>
                      <div>
                        <p className="font-medium text-white">Reportes</p>
                        <p className="text-sm text-gray-400">Próximamente</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
