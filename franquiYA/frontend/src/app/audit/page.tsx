'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { AuditProgressBar } from '@/components/audit/progress-bar'
import { ProductCard } from '@/components/audit/product-card'
import type { Product } from '@/lib/types'
import { useAuth } from '@/components/layout/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, RotateCcw } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

export default function AuditPage() {
  const { user, loading: authLoading } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [confirmedProducts, setConfirmedProducts] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [auditComplete, setAuditComplete] = useState(false)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return

        const res = await fetch(`${API_URL}/audit/products`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setProducts(data.filter((p: Product) => p.category === 'sabor_7.8kg'))
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

  const handleConfirmProduct = (productId: number, _closedQty?: number, _openQty?: number) => {
    setConfirmedProducts(prev => new Set([...prev, productId]))
  }

  const handleSubmitAudit = async () => {
    setSubmitting(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const res = await fetch(`${API_URL}/audit/submit`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: Array.from(confirmedProducts).map(id => ({
            product_id: id,
            counted_qty: 1
          }))
        })
      })

      if (res.ok) {
        setAuditComplete(true)
      }
    } catch (error) {
      console.error('Failed to submit audit:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    setConfirmedProducts(new Set())
    setAuditComplete(false)
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E31D2B] border-t-transparent" />
      </div>
    )
  }

  if (auditComplete) {
    return (
      <div className="min-h-screen bg-gray-50 lg:ml-64">
        <div className="mx-auto max-w-lg p-6 pt-20">
          <Card className="border-2 border-emerald-500 bg-emerald-50">
            <CardContent className="p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500">
                <CheckCircle2 className="h-8 w-8 text-white" />
              </div>
              <h2 className="mb-2 text-xl font-bold text-gray-900">
                ¡Auditoría Completada!
              </h2>
              <p className="mb-6 text-gray-600">
                Se registraron {confirmedProducts.size} productos correctamente.
              </p>
              <Button
                onClick={handleReset}
                variant="outline"
                className="w-full"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Nueva Auditoría
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const pendingProducts = products.filter(p => !confirmedProducts.has(p.id))

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      <Sidebar />
      
      <main className="flex-1 lg:ml-64">
        <AuditProgressBar 
          current={confirmedProducts.size} 
          total={products.length} 
        />

        <div className="mx-auto max-w-lg p-4 pt-4">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Auditoría de Stock</h1>
            {confirmedProducts.size > 0 && (
              <Button
                onClick={handleSubmitAudit}
                disabled={submitting}
                className="bg-[#E31D2B] hover:bg-[#C41925]"
              >
                {submitting ? 'Guardando...' : `Finalizar (${confirmedProducts.size})`}
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

          {pendingProducts.length === 0 && confirmedProducts.size > 0 && (
            <Card className="mt-6 border-2 border-dashed border-emerald-300 bg-emerald-50">
              <CardContent className="p-6 text-center">
                <p className="text-emerald-700">
                  Todos los productos han sido contados. 
                  Presiona &quot;Finalizar&quot; para guardar.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
