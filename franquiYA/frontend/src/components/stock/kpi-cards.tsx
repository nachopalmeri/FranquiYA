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
          <Card key={i} className="border border-white/10 bg-[#1a1a1a]">
            <CardContent className="p-6">
              <Skeleton className="h-16 w-full bg-white/5" />
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
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'hover:border-blue-500/30',
    },
    {
      title: 'Stock Crítico',
      value: stats?.critical_stock_count || 0,
      icon: AlertTriangle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'hover:border-red-500/30',
      alert: (stats?.critical_stock_count || 0) > 0,
    },
    {
      title: 'Stock Bajo',
      value: stats?.low_stock_count || 0,
      icon: TrendingUp,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'hover:border-amber-500/30',
    },
    {
      title: 'Facturas Pendientes',
      value: stats?.pending_invoices || 0,
      icon: FileText,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'hover:border-purple-500/30',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card 
          key={card.title} 
          className={cn(
            "border border-white/10 bg-[#1a1a1a] transition-all duration-200",
            card.borderColor,
            card.alert && "animate-pulse-ring border-red-500/50"
          )}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400 mb-1">{card.title}</p>
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
