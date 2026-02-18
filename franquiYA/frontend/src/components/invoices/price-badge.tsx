'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface PriceBadgeProps {
  change: number
}

export function PriceBadge({ change }: PriceBadgeProps) {
  if (change === 0) {
    return (
      <Badge variant="outline" className="gap-1 border-gray-300 text-gray-600">
        <Minus className="h-3 w-3" />
        Sin cambio
      </Badge>
    )
  }

  const isIncrease = change > 0
  const isHighInflation = change > 15

  return (
    <Badge
      className={cn(
        'gap-1 font-mono font-semibold',
        isHighInflation 
          ? 'animate-pulse bg-red-500 text-white shadow-lg shadow-red-200' 
          : isIncrease 
            ? 'bg-amber-500 text-white' 
            : 'bg-emerald-500 text-white'
      )}
    >
      {isIncrease ? (
        <>
          <TrendingUp className="h-3 w-3" />
          ▲ {change}%
          {isHighInflation && ' Inflación'}
        </>
      ) : (
        <>
          <TrendingDown className="h-3 w-3" />
          ▼ {Math.abs(change)}%
        </>
      )}
    </Badge>
  )
}
