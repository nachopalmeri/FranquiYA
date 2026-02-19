'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select'
import { Search, ArrowUp, ArrowDown } from 'lucide-react'
import type { ProductCategory } from '@/lib/types'

interface StockFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  categoryFilter: ProductCategory | 'all'
  onCategoryChange: (value: ProductCategory | 'all') => void
  stockFilter: 'all' | 'critical' | 'low' | 'ok'
  onStockFilterChange: (value: 'all' | 'critical' | 'low' | 'ok') => void
  sortBy: 'name' | 'stock' | 'price'
  onSortByChange: (value: 'name' | 'stock' | 'price') => void
  sortOrder: 'asc' | 'desc'
  onSortOrderChange: (value: 'asc' | 'desc') => void
  categoryOptions: { value: ProductCategory | 'all'; label: string }[]
}

export function StockFilters({
  search,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  stockFilter,
  onStockFilterChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  categoryOptions
}: StockFiltersProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-secondary p-4">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="border-border bg-[#0a0a0a] pl-10 text-white placeholder:text-gray-500"
        />
      </div>

      <Select value={categoryFilter} onValueChange={(v) => onCategoryChange(v as ProductCategory | 'all')}>
        <SelectTrigger className="w-[180px] border-border bg-[#0a0a0a] text-white">
          <SelectValue placeholder="Categoría" />
        </SelectTrigger>
        <SelectContent className="bg-secondary border-border">
          {categoryOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className="text-white hover:bg-muted">
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={stockFilter} onValueChange={(v) => onStockFilterChange(v as 'all' | 'critical' | 'low' | 'ok')}>
        <SelectTrigger className="w-[140px] border-border bg-[#0a0a0a] text-white">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent className="bg-secondary border-border">
          <SelectItem value="all" className="text-white hover:bg-muted">Todos</SelectItem>
          <SelectItem value="critical" className="text-white hover:bg-muted">Crítico</SelectItem>
          <SelectItem value="low" className="text-white hover:bg-muted">Bajo</SelectItem>
          <SelectItem value="ok" className="text-white hover:bg-muted">OK</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        <Select value={sortBy} onValueChange={(v) => onSortByChange(v as 'name' | 'stock' | 'price')}>
          <SelectTrigger className="w-[140px] border-border bg-[#0a0a0a] text-white">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent className="bg-secondary border-border">
            <SelectItem value="name" className="text-white hover:bg-muted">Nombre</SelectItem>
            <SelectItem value="stock" className="text-white hover:bg-muted">Stock</SelectItem>
            <SelectItem value="price" className="text-white hover:bg-muted">Precio</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="border-border text-gray-400 hover:text-white"
        >
          {sortOrder === 'asc' ? (
            <ArrowUp className="h-4 w-4" />
          ) : (
            <ArrowDown className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}
