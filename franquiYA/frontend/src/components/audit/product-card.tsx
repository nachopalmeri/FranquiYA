'use client'

import { useState } from 'react'
import { Check, Package } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { Product } from '@/lib/types'
import { StepperInput } from './stepper-input'

interface ProductCardProps {
  product: Product
  onConfirm: (productId: number, closedQty: number, openQty: number) => void
  disabled?: boolean
}

export function ProductCard({ product, onConfirm, disabled }: ProductCardProps) {
  const [closedQty, setClosedQty] = useState(0)
  const [openQty, setOpenQty] = useState(0)
  const [confirmed, setConfirmed] = useState(false)

  const handleConfirm = () => {
    if (closedQty > 0 || openQty > 0) {
      onConfirm(product.id, closedQty, openQty)
      setConfirmed(true)
    }
  }

  const total = closedQty + openQty
  const diff = total - product.current_stock

  if (confirmed) {
    return (
      <Card className="border-2 border-emerald-500 bg-emerald-50 transition-all duration-300">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500">
              <Check className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{product.name}</p>
              <p className="text-sm text-emerald-600">
                Conteo: {total} • Sistema: {product.current_stock}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn(
      'transition-all duration-200',
      disabled && 'opacity-50'
    )}>
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100">
            <Package className="h-10 w-10 text-gray-400" />
          </div>

          <div className="flex-1">
            <div className="mb-2 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                <p className="text-sm text-gray-500">
                  Sistema: <span className="font-mono">{product.current_stock}</span>
                </p>
              </div>
              {diff !== 0 && total > 0 && (
                <span className={cn(
                  'rounded-full px-2 py-1 text-xs font-medium',
                  diff > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                )}>
                  {diff > 0 ? '+' : ''}{diff}
                </span>
              )}
            </div>

            <div className="space-y-3">
              <StepperInput
                label="Cerrados"
                value={closedQty}
                onChange={setClosedQty}
                min={0}
                max={100}
              />
              <StepperInput
                label="Abiertos"
                value={openQty}
                onChange={setOpenQty}
                min={0}
                max={10}
                fractions
              />
            </div>

            <button
              onClick={handleConfirm}
              disabled={disabled || (closedQty === 0 && openQty === 0)}
              className={cn(
                'mt-3 w-full rounded-xl py-3 text-base font-semibold transition-colors',
                closedQty > 0 || openQty > 0
                  ? 'bg-[#E31D2B] text-white hover:bg-[#C41925]'
                  : 'bg-gray-200 text-gray-400'
              )}
            >
              {closedQty === 0 && openQty === 0 ? 'Ingresa cantidad' : `Confirmar: ${total}`}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
