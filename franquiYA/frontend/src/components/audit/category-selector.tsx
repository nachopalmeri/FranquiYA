'use client'

import { Card, CardContent } from '@/components/ui/card'
import type { ProductCategory } from '@/lib/types'

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
            className="cursor-pointer transition-all hover:border-[#E31D2B] hover:shadow-lg"
            onClick={() => onSelect(category.value)}
          >
            <CardContent className="p-6 text-center">
              <span className="text-4xl">{category.icon}</span>
              <h3 className="mt-3 font-semibold text-gray-900">{category.label}</h3>
              <p className="mt-1 text-sm text-gray-500">{count} productos</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
