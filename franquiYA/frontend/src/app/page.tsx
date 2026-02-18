'use client'

import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { KPICards } from '@/components/stock/kpi-cards'
import { StockAlerts } from '@/components/stock/alert-badge'
import type { DashboardStats, StockAlert } from '@/lib/types'
import { useAuth } from '@/components/layout/auth-provider'

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [alerts, setAlerts] = useState<StockAlert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return

        const [statsRes, alertsRes] = await Promise.all([
          fetch('http://localhost:8000/api/dashboard/stats', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch('http://localhost:8000/api/stock/alerts', {
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

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E31D2B] border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-64">
        <Header />
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500">Bienvenido, {user?.name}</p>
          </div>

          <div className="space-y-6">
            <KPICards stats={stats} loading={loading} />
            
            <div className="grid gap-6 lg:grid-cols-2">
              <StockAlerts alerts={alerts} loading={loading} />
              
              <div className="rounded-xl border bg-white p-6">
                <h3 className="mb-4 font-semibold text-gray-900">Acciones Rápidas</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <a
                    href="/invoices"
                    className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-gray-50"
                  >
                    <div className="rounded-lg bg-purple-50 p-2">
                      <span className="text-2xl">📄</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Cargar Factura</p>
                      <p className="text-sm text-gray-500">Procesar PDF de Helacor</p>
                    </div>
                  </a>
                  <a
                    href="/audit"
                    className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-gray-50"
                  >
                    <div className="rounded-lg bg-blue-50 p-2">
                      <span className="text-2xl">📱</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Iniciar Auditoría</p>
                      <p className="text-sm text-gray-500">Contar stock en cámara</p>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
