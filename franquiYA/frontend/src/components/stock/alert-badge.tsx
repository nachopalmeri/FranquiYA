'use client'

import { AlertTriangle, Package } from 'lucide-react'
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
      <Card className="border-border bg-secondary">
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (alerts.length === 0) {
    return (
      <Card className="border-border bg-secondary">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-emerald-500/10 p-3">
              <Package className="h-8 w-8 text-emerald-500" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">Stock OK</h3>
            <p className="mt-1 text-sm text-gray-400">
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
    <Card className="border-border bg-secondary">
      <CardContent className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <h3 className="font-semibold text-white">Alertas de Stock</h3>
          <Badge className="ml-auto bg-[#E31D2B]">
            {alerts.length}
          </Badge>
        </div>

        <div className="space-y-3">
          {criticalAlerts.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase text-red-500">
                Crítico ({criticalAlerts.length})
              </p>
              {criticalAlerts.slice(0, 3).map((alert) => (
                <div
                  key={alert.product.id}
                  className="flex items-center justify-between rounded-lg border-2 border-red-500/30 bg-red-500/10 p-3"
                >
                  <div>
                    <p className="font-medium text-white">{alert.product.name}</p>
                    <p className="text-sm text-red-400">{alert.message}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-lg font-bold text-red-500">
                      {alert.product.current_stock}
                    </p>
                    <p className="text-xs text-gray-400">
                      Min: {alert.product.min_stock}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {lowAlerts.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase text-amber-500">
                Bajo ({lowAlerts.length})
              </p>
              {lowAlerts.slice(0, 3).map((alert) => (
                <div
                  key={alert.product.id}
                  className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 p-3"
                >
                  <div>
                    <p className="font-medium text-white">{alert.product.name}</p>
                    <p className="text-sm text-amber-400">{alert.message}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-lg font-bold text-amber-500">
                      {alert.product.current_stock}
                    </p>
                    <p className="text-xs text-gray-400">
                      Min: {alert.product.min_stock}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
