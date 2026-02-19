'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Product } from '@/lib/types'

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
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Resumen de Diferencias</CardTitle>
      </CardHeader>
      <CardContent>
        {totalDifferences.length === 0 ? (
          <p className="text-center text-gray-500">
            ¡Perfecto! No hay diferencias entre el stock contado y el sistema.
          </p>
        ) : (
          <div className="space-y-2">
            {totalDifferences.map((item, index) => (
              <div
                key={index}
                className={`flex items-center justify-between rounded-lg p-3 ${
                  item.difference > 0 ? 'bg-emerald-50' : 'bg-red-50'
                }`}
              >
                <div>
                  <p className="font-medium text-gray-900">{item.product?.name}</p>
                  <p className="text-sm text-gray-500">
                    Sistema: {item.systemQty} | Contado: {item.countedQty}
                  </p>
                </div>
                <div className={`text-lg font-semibold ${
                  item.difference > 0 ? 'text-emerald-600' : 'text-red-600'
                }`}>
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
