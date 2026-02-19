'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Product } from '@/lib/types'
import { cn } from '@/lib/utils'

interface AuditSummaryProps {
  items: { productId: number; closedQty: number; openQty: number }[]
  products: Product[]
}

export function AuditSummary({ items, products }: AuditSummaryProps) {
  const summaryData = items.map(item => {
    const product = products.find(p => p.id === item.productId)
    const countedQty = item.closedQty + item.openQty
    const systemQty = product?.current_stock || 0
    const difference = countedQty - systemQty

    return {
      product,
      countedQty,
      systemQty,
      difference
    }
  }).filter(item => item.product)

  const totalDifferences = summaryData.filter(item => item.difference !== 0)

  return (
    <Card className="mt-6 border border-white/10 bg-[#1a1a1a]">
      <CardHeader>
        <CardTitle className="text-white">Resumen de Diferencias</CardTitle>
      </CardHeader>
      <CardContent>
        {totalDifferences.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-400">
              ¡Perfecto! No hay diferencias entre el stock contado y el sistema.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {totalDifferences.map((item, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-center justify-between rounded-xl p-4",
                  item.difference > 0 ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'
                )}
              >
                <div>
                  <p className="font-medium text-white">{item.product?.name}</p>
                  <p className="text-sm text-gray-400">
                    Sistema: <span className="font-mono">{item.systemQty}</span> | Contado: <span className="font-mono">{item.countedQty}</span>
                  </p>
                </div>
                <div className={cn(
                  "text-xl font-bold font-mono",
                  item.difference > 0 ? 'text-emerald-400' : 'text-red-400'
                )}>
                  {item.difference > 0 ? '+' : ''}{item.difference}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
