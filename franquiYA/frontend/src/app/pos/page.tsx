'use client'

import { useState, useEffect, useMemo } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { ChatWidget } from '@/components/chat/chat-widget'
import { useAuth } from '@/components/layout/auth-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  Banknote, 
  Smartphone,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Product, CartItem, CashRegister, TodaySummary } from '@/lib/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

const CATEGORIES = [
  { value: 'all', label: 'Todos' },
  { value: 'sabor_7.8kg', label: 'Helados' },
  { value: 'bombones', label: 'Bombones' },
  { value: 'palitos', label: 'Palitos' },
  { value: 'tentacion', label: 'Tentación' },
  { value: 'familiares', label: 'Familiares' },
  { value: 'frizzio', label: 'Frizzio' },
]

export default function POSPage() {
  const { user, loading: authLoading } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [cashRegister, setCashRegister] = useState<CashRegister | null>(null)
  const [summary, setSummary] = useState<TodaySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showOpenRegisterModal, setShowOpenRegisterModal] = useState(false)
  const [openingAmount, setOpeningAmount] = useState('0')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer' | 'mercadopago'>('cash')
  const [processing, setProcessing] = useState(false)
  const [saleSuccess, setSaleSuccess] = useState(false)

  useEffect(() => {
    if (!authLoading && user) {
      fetchData()
    }
  }, [authLoading, user])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const [productsRes, registerRes, summaryRes] = await Promise.all([
        fetch(`${API_URL}/stock`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/pay/cash-register/status`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/pay/sales/today-summary`, { headers: { Authorization: `Bearer ${token}` } })
      ])

      if (productsRes.ok) setProducts(await productsRes.json())
      if (registerRes.ok) setCashRegister(await registerRes.json())
      if (summaryRes.ok) setSummary(await summaryRes.json())
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = useMemo(() => {
    let filtered = products.filter(p => p.is_active && p.current_stock > 0)
    
    if (search) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase())
      )
    }
    
    if (category !== 'all') {
      filtered = filtered.filter(p => p.category === category)
    }
    
    return filtered
  }, [products, search, category])

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.total, 0)
  }, [cart])

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id)
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unit_price }
            : item
        )
      }
      return [...prev, { 
        product, 
        quantity: 1, 
        unit_price: product.unit_price, 
        total: product.unit_price 
      }]
    })
  }

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = Math.max(0, item.quantity + delta)
        return { ...item, quantity: newQty, total: newQty * item.unit_price }
      }
      return item
    }).filter(item => item.quantity > 0))
  }

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId))
  }

  const openRegister = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/pay/cash-register/open`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ opening_amount: parseFloat(openingAmount) })
      })
      
      if (res.ok) {
        setCashRegister(await res.json())
        setShowOpenRegisterModal(false)
        setOpeningAmount('0')
      }
    } catch (error) {
      console.error('Failed to open register:', error)
    }
  }

  const processSale = async () => {
    if (cart.length === 0 || !cashRegister) return
    
    setProcessing(true)
    try {
      const token = localStorage.getItem('token')
      const items = cart.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.unit_price
      }))

      const res = await fetch(`${API_URL}/pay/sales`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          items,
          payment_method: paymentMethod
        })
      })

      if (res.ok) {
        setSaleSuccess(true)
        setCart([])
        setTimeout(() => {
          setSaleSuccess(false)
          setShowPaymentModal(false)
          fetchData() // Refresh summary
        }, 2000)
      }
    } catch (error) {
      console.error('Failed to process sale:', error)
    } finally {
      setProcessing(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E31D2B] border-t-transparent" />
      </div>
    )
  }

  // If no register is open, show option to open
  if (!cashRegister) {
    return (
      <div className="flex min-h-screen bg-[#0a0a0a]">
        <Sidebar />
        <main className="flex-1 ml-64">
          <Header />
          <div className="flex h-[calc(100vh-64px)] items-center justify-center p-6">
            <Card className="w-full max-w-md border-white/10 bg-[#1a1a1a]">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/20">
                  <AlertCircle className="h-8 w-8 text-amber-500" />
                </div>
                <CardTitle className="text-xl text-white">Caja Cerrada</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-center text-gray-400">
                  Necesitás abrir la caja para comenzar a vender
                </p>
                <Button 
                  onClick={() => setShowOpenRegisterModal(true)}
                  className="w-full bg-[#E31D2B] hover:bg-[#C41925]"
                >
                  Abrir Caja
                </Button>
              </CardContent>
            </Card>
          </div>
          <ChatWidget />
        </main>

        {/* Open Register Modal */}
        {showOpenRegisterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <Card className="w-full max-w-sm border-white/10 bg-[#1a1a1a]">
              <CardHeader>
                <CardTitle className="text-white">Abrir Caja</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Monto Inicial ($)</Label>
                  <Input
                    type="number"
                    value={openingAmount}
                    onChange={(e) => setOpeningAmount(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => setShowOpenRegisterModal(false)}
                    className="flex-1 border-white/10 text-white hover:bg-white/10"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={openRegister}
                    className="flex-1 bg-[#E31D2B] hover:bg-[#C41925]"
                  >
                    Abrir
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />
      <main className="flex-1 ml-64">
        <Header />
        <div className="flex h-[calc(100vh-64px)] gap-4 p-4">
          {/* Products Panel */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search & Filter */}
            <div className="mb-4 flex gap-2">
              <Input
                placeholder="Buscar producto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value} className="bg-[#1a1a1a]">
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Products Grid */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {filteredProducts.map(product => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="flex flex-col items-start p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all text-left"
                  >
                    <span className="text-white font-medium text-sm line-clamp-2">
                      {product.name}
                    </span>
                    <span className="text-gray-400 text-xs">{product.unit}</span>
                    <span className="text-[#E31D2B] font-bold mt-auto">
                      ${product.unit_price.toLocaleString('es-AR')}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Cart Panel */}
          <div className="w-96 flex flex-col bg-white/5 rounded-xl border border-white/10">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-white" />
                <span className="text-white font-semibold">Carrito</span>
                <span className="bg-[#E31D2B] text-white text-xs px-2 py-0.5 rounded-full">
                  {cart.length}
                </span>
              </div>
              {summary && (
                <span className="text-green-400 text-sm">
                  Hoy: ${summary.total_amount.toLocaleString('es-AR')}
                </span>
              )}
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-2">
              {cart.length === 0 ? (
                <div className="flex h-full items-center justify-center text-gray-500">
                  <p>Agregá productos</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cart.map(item => (
                    <div 
                      key={item.product.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-white/5"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {item.product.name}
                        </p>
                        <p className="text-gray-400 text-xs">
                          ${item.unit_price.toLocaleString('es-AR')} x {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="p-1 rounded hover:bg-white/10"
                        >
                          <Minus className="h-4 w-4 text-gray-400" />
                        </button>
                        <span className="text-white text-sm w-6 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="p-1 rounded hover:bg-white/10"
                        >
                          <Plus className="h-4 w-4 text-gray-400" />
                        </button>
                      </div>
                      <div className="text-right w-20">
                        <p className="text-white font-medium">
                          ${item.total.toLocaleString('es-AR')}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-1 rounded hover:bg-red-500/20"
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 space-y-3">
              <div className="flex justify-between text-white">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold text-[#E31D2B]">
                  ${cartTotal.toLocaleString('es-AR')}
                </span>
              </div>
              <Button
                onClick={() => setShowPaymentModal(true)}
                disabled={cart.length === 0}
                className="w-full bg-[#E31D2B] hover:bg-[#C41925]"
              >
                Cobrar
              </Button>
            </div>
          </div>
        </div>
        <ChatWidget />
      </main>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <Card className="w-full max-w-sm border-white/10 bg-[#1a1a1a]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Forma de Pago</CardTitle>
              <button onClick={() => setShowPaymentModal(false)}>
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-2xl font-bold text-white text-center mb-4">
                ${cartTotal.toLocaleString('es-AR')}
              </p>
              
              {[
                { value: 'cash', label: 'Efectivo', icon: Banknote },
                { value: 'card', label: 'Tarjeta', icon: CreditCard },
                { value: 'transfer', label: 'Transferencia', icon: Smartphone },
                { value: 'mercadopago', label: 'MercadoPago', icon: Smartphone },
              ].map(method => (
                <button
                  key={method.value}
                  onClick={() => setPaymentMethod(method.value as typeof paymentMethod)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg border transition-all",
                    paymentMethod === method.value
                      ? "border-[#E31D2B] bg-[#E31D2B]/10"
                      : "border-white/10 hover:border-white/20"
                  )}
                >
                  <method.icon className={cn(
                    "h-5 w-5",
                    paymentMethod === method.value ? "text-[#E31D2B]" : "text-gray-400"
                  )} />
                  <span className={cn(
                    "font-medium",
                    paymentMethod === method.value ? "text-white" : "text-gray-400"
                  )}>
                    {method.label}
                  </span>
                </button>
              ))}

              <Button
                onClick={processSale}
                disabled={processing}
                className="w-full bg-[#E31D2B] hover:bg-[#C41925] mt-4"
              >
                {processing ? 'Procesando...' : 'Confirmar Venta'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Success Modal */}
      {saleSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <Card className="w-full max-w-sm border-green-500/20 bg-[#1a1a1a]">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-white">¡Venta Exitosa!</h2>
              <p className="text-gray-400 mt-2">Redirigiendo...</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
