'use client'

import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface StepperInputProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  fractions?: boolean
}

export function StepperInput({ 
  label, 
  value, 
  onChange, 
  min = 0, 
  max = 100,
  fractions = false 
}: StepperInputProps) {
  const increment = () => {
    if (value < max) onChange(value + 1)
  }

  const decrement = () => {
    if (value > min) onChange(value - 1)
  }

  const handleFraction = (frac: number) => {
    onChange(frac)
  }

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-gray-600">{label}</p>
      
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-14 w-14 rounded-xl text-2xl font-bold"
          onClick={decrement}
          disabled={value <= min}
        >
          <Minus className="h-6 w-6" />
        </Button>

        <div className="flex h-14 min-w-[80px] items-center justify-center rounded-xl bg-gray-100 font-mono text-2xl font-bold">
          {value}
        </div>

        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-14 w-14 rounded-xl text-2xl font-bold"
          onClick={increment}
          disabled={value >= max}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {fractions && (
        <div className="mt-2 flex gap-2">
          {[0.25, 0.5, 0.75, 1].map((frac) => (
            <Button
              key={frac}
              type="button"
              variant={value === frac ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'flex-1 rounded-lg py-2 text-sm font-medium',
                value === frac && 'bg-[#E31D2B] hover:bg-[#C41925]'
              )}
              onClick={() => handleFraction(frac)}
            >
              {frac === 1 ? '1' : `¼`.repeat(frac * 4)}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
