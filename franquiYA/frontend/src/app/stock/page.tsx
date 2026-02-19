'use client'

import { useState, useEffect, useMemo } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { StockTable } from '@/components/stock/stock-table'
import { StockFilters } from '@/components/stock/stock-filters'
import { StockCharts } from '@/components/stock/stock-charts'
import { ChatWidget } from '@/components/chat/chat-widget'
import type { Product, ProductCategory } from '@/lib/types'
import { useAuth } from '@/components/layout/auth-provider'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import * as XLSX from 'xlsx'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

const CATEGORY_OPTIONS: { value: ProductCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas las categorías' },
  { value: 'sabor_7.8kg', label: 'Sabores 7.8kg' },
  { value: 'sabor_1lt', label: 'Sabores 1lt' },
  { value: 'bombones', label: 'Bombones' },
  { value: 'palitos', label: 'Palitos' },
  { value: 'tortas', label: 'Tortas' },
  { value: 'tentaciones', label: 'Tentaciones' },
  { value: 'tentacion', label: 'Tentación' },
  { value: 'familiares', label: 'Familiares' },
  { value: 'congelados', label: 'Congelados' },
  { value: 'frizzio', label: 'Frizzio' },
  { value: 'smoothies', label: 'Smoothies' },
  { value: 'sin_tacc', label: 'Sin TACC' },
  { value: 'alfajores', label: 'Alfajores' },
  { value: 'insumos', label: 'Insumos' },
]

export default function StockPage() {
  const { user, loading: authLoading } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | 'all'>('all')
  const [stockFilter, setStockFilter] = useState<'all' | 'critical' | 'low' | 'ok'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'price'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return

        const res = await fetch(`${API_URL}/stock`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          setProducts(await res.json())
        }
      } catch (error) {
        console.error('Failed to fetch products:', error)
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading && user) {
      fetchProducts()
    }
  }, [authLoading, user])

  const filteredProducts = useMemo(() => {
    let filtered = [...products]

    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchLower)
      )
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.category === categoryFilter)
    }

    if (stockFilter !== 'all') {
      if (stockFilter === 'critical') {
        filtered = filtered.filter(p => p.current_stock <= 0)
      } else if (stockFilter === 'low') {
        filtered = filtered.filter(p => p.current_stock > 0 && p.current_stock <= p.min_stock)
      } else if (stockFilter === 'ok') {
        filtered = filtered.filter(p => p.current_stock > p.min_stock)
      }
    }

    filtered.sort((a, b) => {
      let comparison = 0
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name)
      } else if (sortBy === 'stock') {
        comparison = a.current_stock - b.current_stock
      } else if (sortBy === 'price') {
        comparison = a.unit_price - b.unit_price
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [products, search, categoryFilter, stockFilter, sortBy, sortOrder])

  const exportToExcel = () => {
    const data = filteredProducts.map(p => ({
      Nombre: p.name,
      Categoría: p.category,
      Unidad: p.unit,
      'Stock Actual': p.current_stock,
      'Stock Mínimo': p.min_stock,
      'Precio Unitario': p.unit_price,
      Estado: p.current_stock <= 0 ? 'Crítico' : p.current_stock <= p.min_stock ? 'Bajo' : 'OK'
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Stock')
    XLSX.writeFile(wb, `grido-stock-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E31D2B] border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />
      <main className="flex-1 ml-64">
        <Header />
        <div className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Stock</h1>
              <p className="text-gray-400">{filteredProducts.length} productos</p>
            </div>
            <Button 
              onClick={exportToExcel} 
              variant="outline"
              className="border-white/10 text-white hover:bg-white/10"
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar Excel
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <StockFilters
                search={search}
                onSearchChange={setSearch}
                categoryFilter={categoryFilter}
                onCategoryChange={setCategoryFilter}
                stockFilter={stockFilter}
                onStockFilterChange={setStockFilter}
                sortBy={sortBy}
                onSortByChange={setSortBy}
                sortOrder={sortOrder}
                onSortOrderChange={setSortOrder}
                categoryOptions={CATEGORY_OPTIONS}
              />
              <StockTable products={filteredProducts} />
            </div>
            <div>
              <StockCharts products={products} />
            </div>
          </div>
        </div>
        <ChatWidget />
      </main>
    </div>
  )
}
