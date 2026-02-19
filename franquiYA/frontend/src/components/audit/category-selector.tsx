'use client'

import { Card, CardContent } from '@/components/ui/card'
import type { ProductCategory } from '@/lib/types'
import { cn } from '@/lib/utils'

interface CategorySelectorProps {
  categories: { value: ProductCategory; label: string; icon: string }[]
  counts: Record<string, number>
  onSelect: (category: ProductCategory) => void
}

export function CategorySelector({ categories, counts, onSelect }: CategorySelectorProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {categories.map((category) => {
        const count = counts[category.value] || 0
        if (count === 0) return null

        return (
          <Card
            key={category.value}
            className={cn(
              "cursor-pointer border border-white/10 bg-[#1a1a1a] transition-all duration-200",
              "hover:border-[#E31D2B]/50 hover:bg-[#1a1a1a] hover:shadow-lg hover:shadow-[#E31D2B]/10",
              "active:scale-[0.98]"
            )}
            onClick={() => onSelect(category.value)}
          >
            <CardContent className="p-6 text-center">
              <span className="text-4xl block mb-3">{category.icon}</span>
              <h3 className="font-semibold text-white">{category.label}</h3>
              <p className="mt-1 text-sm text-gray-400">{count} productos</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
