'use client'

import { Package, AlertTriangle, FileText, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { DashboardStats } from '@/lib/types'
import { cn } from '@/lib/utils'

interface KPICardsProps {
  stats: DashboardStats | null
  loading: boolean
}

export function KPICards({ stats, loading }: KPICardsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-[#E8DFD3] bg-white shadow-sm">
            <CardContent className="p-6">
              <Skeleton className="h-16 w-full bg-[#F5E6D3]" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const cards = [
    {
      title: 'Total Productos',
      value: stats?.total_products || 0,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      borderColor: 'hover:border-blue-300',
    },
    {
      title: 'Stock Crítico',
      value: stats?.critical_stock_count || 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      borderColor: 'hover:border-red-300',
      alert: (stats?.critical_stock_count || 0) > 0,
    },
    {
      title: 'Stock Bajo',
      value: stats?.low_stock_count || 0,
      icon: TrendingUp,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
      borderColor: 'hover:border-amber-300',
    },
    {
      title: 'Facturas Pendientes',
      value: stats?.pending_invoices || 0,
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      borderColor: 'hover:border-purple-300',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card 
          key={card.title} 
          className={cn(
            "border-[#E8DFD3] bg-white shadow-sm transition-all duration-200",
            card.borderColor,
            card.alert && "border-red-300 ring-2 ring-red-100"
          )}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#8B7355] mb-1">{card.title}</p>
                <p className={cn("text-3xl font-bold font-mono", card.color)}>
                  {card.value}
                </p>
              </div>
              <div className={cn("rounded-xl p-3", card.bgColor)}>
                <card.icon className={cn("h-6 w-6", card.color)} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
