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
      <Card className="border-[#E8DFD3] bg-white shadow-sm">
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-[#F5E6D3]" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (alerts.length === 0) {
    return (
      <Card className="border-[#E8DFD3] bg-white shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-emerald-100 p-3 mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-[#4A3728] mb-1">Stock OK</h3>
            <p className="text-sm text-[#8B7355]">
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
    <Card className="border-[#E8DFD3] bg-white shadow-sm">
      <CardContent className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <h3 className="font-semibold text-[#4A3728]">Alertas de Stock</h3>
          <Badge className="ml-auto bg-[#E31D2B] text-white border-0">
            {alerts.length}
          </Badge>
        </div>

        <div className="space-y-4">
          {criticalAlerts.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase text-red-600 tracking-wider">
                Crítico ({criticalAlerts.length})
              </p>
              {criticalAlerts.slice(0, 3).map((alert) => (
                <div
                  key={alert.product.id}
                  className="group flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 transition-colors hover:bg-red-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-red-100 p-2">
                      <Package className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-[#4A3728]">{alert.product.name}</p>
                      <p className="text-sm text-red-600">{alert.message}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-xl font-bold text-red-600">
                      {alert.product.current_stock}
                    </p>
                    <p className="text-xs text-[#8B7355]">
                      Mín: {alert.product.min_stock}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {lowAlerts.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase text-amber-600 tracking-wider">
                Bajo ({lowAlerts.length})
              </p>
              {lowAlerts.slice(0, 3).map((alert) => (
                <div
                  key={alert.product.id}
                  className="group flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-4 transition-colors hover:bg-amber-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-amber-100 p-2">
                      <Package className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium text-[#4A3728]">{alert.product.name}</p>
                      <p className="text-sm text-amber-600">{alert.message}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-xl font-bold text-amber-600">
                      {alert.product.current_stock}
                    </p>
                    <p className="text-xs text-[#8B7355]">
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
            className="mt-4 flex items-center justify-center gap-2 text-sm text-[#8B7355] hover:text-[#E31D2B] transition-colors"
          >
            Ver todos los productos
            <ArrowRight className="h-4 w-4" />
          </a>
        )}
      </CardContent>
    </Card>
  )
}
