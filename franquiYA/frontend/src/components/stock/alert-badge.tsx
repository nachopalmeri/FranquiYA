'use client'

import { AlertTriangle, Package, CheckCircle2, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { StockAlert } from '@/lib/types'

interface StockAlertsProps {
  alerts: StockAlert[]
  loading: boolean
}

export function StockAlerts({ alerts, loading }: StockAlertsProps) {
  if (loading) {
    return (
      <Card className="border border-white/10 bg-[#1a1a1a]">
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (alerts.length === 0) {
    return (
      <Card className="border border-white/10 bg-[#1a1a1a]">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-emerald-500/20 p-3 mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Stock OK</h3>
            <p className="text-sm text-gray-400">
              No hay productos con stock bajo o crítico
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const criticalAlerts = alerts.filter(a => a.status === 'critical')
  const lowAlerts = alerts.filter(a => a.status === 'low')

  return (
    <Card className="border border-white/10 bg-[#1a1a1a]">
      <CardContent className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-400" />
          <h3 className="font-semibold text-white">Alertas de Stock</h3>
          <Badge className="ml-auto bg-[#E31D2B] text-white border-0">
            {alerts.length}
          </Badge>
        </div>

        <div className="space-y-4">
          {criticalAlerts.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase text-red-400 tracking-wider">
                Crítico ({criticalAlerts.length})
              </p>
              {criticalAlerts.slice(0, 3).map((alert) => (
                <div
                  key={alert.product.id}
                  className="group flex items-center justify-between rounded-xl border border-red-500/30 bg-red-500/5 p-4 transition-colors hover:bg-red-500/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-red-500/20 p-2">
                      <Package className="h-4 w-4 text-red-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{alert.product.name}</p>
                      <p className="text-sm text-red-400">{alert.message}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-xl font-bold text-red-400">
                      {alert.product.current_stock}
                    </p>
                    <p className="text-xs text-gray-500">
                      Mín: {alert.product.min_stock}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {lowAlerts.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase text-amber-400 tracking-wider">
                Bajo ({lowAlerts.length})
              </p>
              {lowAlerts.slice(0, 3).map((alert) => (
                <div
                  key={alert.product.id}
                  className="group flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 transition-colors hover:bg-amber-500/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-amber-500/20 p-2">
                      <Package className="h-4 w-4 text-amber-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{alert.product.name}</p>
                      <p className="text-sm text-amber-400">{alert.message}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-xl font-bold text-amber-400">
                      {alert.product.current_stock}
                    </p>
                    <p className="text-xs text-gray-500">
                      Mín: {alert.product.min_stock}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {alerts.length > 6 && (
          <a 
            href="/stock" 
            className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Ver todos los productos
            <ArrowRight className="h-4 w-4" />
          </a>
        )}
      </CardContent>
    </Card>
  )
}
