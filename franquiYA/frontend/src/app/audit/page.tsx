'use client'

import { useState, useEffect, useMemo } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { AuditProgressBar } from '@/components/audit/progress-bar'
import { ProductCard } from '@/components/audit/product-card'
import { CategorySelector } from '@/components/audit/category-selector'
import { AuditSummary } from '@/components/audit/summary'
import { ChatWidget } from '@/components/chat/chat-widget'
import type { Product, ProductCategory } from '@/lib/types'
import { useAuth } from '@/components/layout/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, RotateCcw } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

const CATEGORIES: { value: ProductCategory; label: string; icon: string }[] = [
  { value: 'sabor_7.8kg', label: 'Sabores a Granel', icon: '🍦' },
  { value: 'tentacion', label: 'Tentación', icon: '🧁' },
  { value: 'bombones', label: 'Bombones', icon: '🍫' },
  { value: 'palitos', label: 'Palitos', icon: '🍨' },
  { value: 'tortas', label: 'Tortas', icon: '🎂' },
  { value: 'familiares', label: 'Familiares', icon: '🪣' },
  { value: 'frizzio', label: 'Congelados', icon: '❄️' },
  { value: 'smoothies', label: 'Smoothies', icon: '🥤' },
  { value: 'sin_tacc', label: 'Sin TACC', icon: '🌾' },
  { value: 'insumos', label: 'Insumos', icon: '📦' },
]

interface AuditItem {
  productId: number
  closedQty: number
  openQty: number
}

export default function AuditPage() {
  const { user, loading: authLoading } = useAuth()
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null)
  const [countedItems, setCountedItems] = useState<Map<number, AuditItem>>(new Map())
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [auditComplete, setAuditComplete] = useState(false)
  const [auditSummary, setAuditSummary] = useState<AuditItem[]>([])

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return

        const res = await fetch(`${API_URL}/audit/products`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          setAllProducts(await res.json())
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

  const products = useMemo(() => {
    if (!selectedCategory) return []
    return allProducts
      .filter(p => p.category === selectedCategory)
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [allProducts, selectedCategory])

  const handleConfirmProduct = (productId: number, closedQty: number, openQty: number) => {
    setCountedItems(prev => {
      const newMap = new Map(prev)
      newMap.set(productId, { productId, closedQty, openQty })
      return newMap
    })
  }

  const handleSubmitAudit = async () => {
    setSubmitting(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const items = Array.from(countedItems.values()).map(item => ({
        product_id: item.productId,
        counted_qty: item.closedQty + item.openQty
      }))

      const res = await fetch(`${API_URL}/audit/submit`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ items })
      })

      if (res.ok) {
        setAuditSummary(Array.from(countedItems.values()))
        setAuditComplete(true)
      }
    } catch (error) {
      console.error('Failed to submit audit:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    setCountedItems(new Map())
    setAuditComplete(false)
    setSelectedCategory(null)
    setAuditSummary([])
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E31D2B] border-t-transparent" />
      </div>
    )
  }

  if (auditComplete) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] lg:ml-64">
        <Sidebar />
        <div className="mx-auto max-w-2xl p-6 pt-20">
          <Card className="border border-emerald-500/30 bg-emerald-500/10 overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-emerald-400" />
            <CardContent className="p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="h-8 w-8 text-white" />
              </div>
              <h2 className="mb-2 text-xl font-bold text-white">
                ¡Auditoría Completada!
              </h2>
              <p className="mb-6 text-gray-400">
                Se registraron <span className="text-emerald-400 font-semibold">{countedItems.size}</span> productos correctamente.
              </p>
              <Button
                onClick={handleReset}
                variant="outline"
                className="w-full border-white/10 text-white hover:bg-white/10"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Nueva Auditoría
              </Button>
            </CardContent>
          </Card>
          
          <AuditSummary items={auditSummary} products={allProducts} />
        </div>
      </div>
    )
  }

  if (!selectedCategory) {
    return (
      <div className="flex min-h-screen bg-[#0a0a0a]">
        <Sidebar />
        <main className="flex-1 ml-64 p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-1">Auditoría de Stock</h1>
            <p className="text-gray-400">Seleccioná una categoría para comenzar el conteo</p>
          </div>
          
          <CategorySelector
            categories={CATEGORIES}
            counts={CATEGORIES.reduce((acc, cat) => {
              acc[cat.value] = allProducts.filter(p => p.category === cat.value).length
              return acc
            }, {} as Record<string, number>)}
            onSelect={setSelectedCategory}
          />
        </main>
      </div>
    )
  }

  const pendingProducts = products.filter(p => !countedItems.has(p.id))

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />
      <main className="flex-1 ml-64">
        <AuditProgressBar 
          current={countedItems.size} 
          total={products.length} 
        />

        <div className="mx-auto max-w-lg p-4 pt-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">
                {CATEGORIES.find(c => c.value === selectedCategory)?.label}
              </h1>
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-sm text-[#E31D2B] hover:text-[#ff4757] transition-colors"
              >
                ← Cambiar categoría
              </button>
            </div>
            {countedItems.size > 0 && (
              <Button
                onClick={handleSubmitAudit}
                disabled={submitting}
                className="bg-[#E31D2B] hover:bg-[#C41925] shadow-lg shadow-[#E31D2B]/30"
              >
                {submitting ? 'Guardando...' : `Finalizar (${countedItems.size})`}
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {pendingProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onConfirm={handleConfirmProduct}
              />
            ))}
          </div>

          {pendingProducts.length === 0 && countedItems.size > 0 && (
            <Card className="mt-6 border border-emerald-500/30 bg-emerald-500/10">
              <CardContent className="p-6 text-center">
                <p className="text-emerald-400">
                  Todos los productos de esta categoría han sido contados.
                </p>
                <p className="mt-2 text-sm text-emerald-400/70">
                  Presioná &quot;Finalizar&quot; para guardar la auditoría.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
        <ChatWidget />
      </main>
    </div>
  )
}
