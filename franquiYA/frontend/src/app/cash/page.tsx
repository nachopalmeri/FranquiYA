'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { ChatWidget } from '@/components/chat/chat-widget'
import { useAuth } from '@/components/layout/auth-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  DollarSign, 
  TrendingUp, 
  Plus, 
  Minus,
  Lock,
  Unlock,
  AlertCircle,
  X,
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CashRegister, TodaySummary } from '@/lib/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

export default function CashPage() {
  const { user, loading: authLoading } = useAuth()
  const [cashRegister, setCashRegister] = useState<CashRegister | null>(null)
  const [summary, setSummary] = useState<TodaySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [showOpenModal, setShowOpenModal] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [showMovementModal, setShowMovementModal] = useState(false)
  const [openingAmount, setOpeningAmount] = useState('0')
  const [closingAmount, setClosingAmount] = useState('')
  const [movementType, setMovementType] = useState<'income' | 'expense'>('income')
  const [movementAmount, setMovementAmount] = useState('')
  const [movementConcept, setMovementConcept] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (!authLoading && user) {
      fetchData()
    }
  }, [authLoading, user])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const [registerRes, summaryRes] = await Promise.all([
        fetch(`${API_URL}/pay/cash-register/status`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/pay/sales/today-summary`, { headers: { Authorization: `Bearer ${token}` } })
      ])

      if (registerRes.ok) setCashRegister(await registerRes.json())
      if (summaryRes.ok) setSummary(await summaryRes.json())
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const openRegister = async () => {
    setProcessing(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/pay/cash-register/open`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ opening_amount: parseFloat(openingAmount) || 0 })
      })
      
      if (res.ok) {
        setCashRegister(await res.json())
        setShowOpenModal(false)
        setOpeningAmount('0')
      }
    } catch (error) {
      console.error('Failed to open register:', error)
    } finally {
      setProcessing(false)
    }
  }

  const closeRegister = async () => {
    if (!cashRegister || !closingAmount) return
    
    setProcessing(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/pay/cash-register/${cashRegister.id}/close`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ closing_amount: parseFloat(closingAmount) })
      })
      
      if (res.ok) {
        setCashRegister(null)
        setShowCloseModal(false)
        setClosingAmount('')
        fetchData()
      }
    } catch (error) {
      console.error('Failed to close register:', error)
    } finally {
      setProcessing(false)
    }
  }

  const addMovement = async () => {
    if (!cashRegister || !movementAmount) return
    
    setProcessing(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/pay/cash-register/${cashRegister.id}/movements`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          type: movementType,
          amount: parseFloat(movementAmount),
          concept: movementConcept,
          payment_method: 'cash'
        })
      })
      
      if (res.ok) {
        setShowMovementModal(false)
        setMovementAmount('')
        setMovementConcept('')
        fetchData()
      }
    } catch (error) {
      console.error('Failed to add movement:', error)
    } finally {
      setProcessing(false)
    }
  }

  // Calculate expected cash
  const expectedCash = cashRegister ? (
    cashRegister.opening_amount + 
    (summary?.by_payment_method.cash || 0)
  ) : 0

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
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Caja</h1>
              <p className="text-gray-400">Gestión de efectivo</p>
            </div>
            {cashRegister ? (
              <Button
                onClick={() => setShowCloseModal(true)}
                className="bg-red-500 hover:bg-red-600"
              >
                <Lock className="mr-2 h-4 w-4" />
                Cerrar Caja
              </Button>
            ) : (
              <Button
                onClick={() => setShowOpenModal(true)}
                className="bg-green-500 hover:bg-green-600"
              >
                <Unlock className="mr-2 h-4 w-4" />
                Abrir Caja
              </Button>
            )}
          </div>

          {cashRegister ? (
            <>
              {/* Cash Register Status */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20">
                        <DollarSign className="h-6 w-6 text-green-500" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Monto de Apertura</p>
                        <p className="text-2xl font-bold text-white">
                          ${cashRegister.opening_amount.toLocaleString('es-AR')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/20">
                        <TrendingUp className="h-6 w-6 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Ventas en Efectivo</p>
                        <p className="text-2xl font-bold text-white">
                          ${(summary?.by_payment_method.cash || 0).toLocaleString('es-AR')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/20">
                        <Clock className="h-6 w-6 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Efectivo Esperado</p>
                        <p className="text-2xl font-bold text-white">
                          ${expectedCash.toLocaleString('es-AR')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-4">
                <Button
                  onClick={() => {
                    setMovementType('income')
                    setShowMovementModal(true)
                  }}
                  variant="outline"
                  className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Ingreso
                </Button>
                <Button
                  onClick={() => {
                    setMovementType('expense')
                    setShowMovementModal(true)
                  }}
                  variant="outline"
                  className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                >
                  <Minus className="mr-2 h-4 w-4" />
                  Egreso
                </Button>
              </div>

              {/* Today's Summary */}
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Resumen del Día</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-5">
                    <div className="text-center p-4 rounded-lg bg-white/5">
                      <p className="text-sm text-gray-400">Total Ventas</p>
                      <p className="text-xl font-bold text-white">
                        {summary?.total_sales || 0}
                      </p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-white/5">
                      <p className="text-sm text-gray-400">Total</p>
                      <p className="text-xl font-bold text-white">
                        ${(summary?.total_amount || 0).toLocaleString('es-AR')}
                      </p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-white/5">
                      <p className="text-sm text-gray-400">Efectivo</p>
                      <p className="text-xl font-bold text-green-400">
                        ${(summary?.by_payment_method.cash || 0).toLocaleString('es-AR')}
                      </p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-white/5">
                      <p className="text-sm text-gray-400">Tarjeta</p>
                      <p className="text-xl font-bold text-blue-400">
                        ${(summary?.by_payment_method.card || 0).toLocaleString('es-AR')}
                      </p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-white/5">
                      <p className="text-sm text-gray-400">Transferencia</p>
                      <p className="text-xl font-bold text-purple-400">
                        ${(summary?.by_payment_method.transfer || 0).toLocaleString('es-AR')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/20 mb-4">
                  <AlertCircle className="h-8 w-8 text-amber-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Caja Cerrada</h3>
                <p className="text-gray-400 text-center mb-4">
                  La caja está cerrada. Abrila para comenzar el día.
                </p>
                <Button
                  onClick={() => setShowOpenModal(true)}
                  className="bg-green-500 hover:bg-green-600"
                >
                  <Unlock className="mr-2 h-4 w-4" />
                  Abrir Caja
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
        <ChatWidget />
      </main>

      {/* Open Register Modal */}
      {showOpenModal && (
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
                  onClick={() => setShowOpenModal(false)}
                  className="flex-1 border-white/10 text-white hover:bg-white/10"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={openRegister}
                  disabled={processing}
                  className="flex-1 bg-green-500 hover:bg-green-600"
                >
                  {processing ? 'Abriendo...' : 'Abrir Caja'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Close Register Modal */}
      {showCloseModal && cashRegister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <Card className="w-full max-w-sm border-white/10 bg-[#1a1a1a]">
            <CardHeader>
              <CardTitle className="text-white">Cerrar Caja</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-white/5 space-y-2">
                <div className="flex justify-between text-gray-400">
                  <span>Monto apertura:</span>
                  <span>${cashRegister.opening_amount.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Ventas efectivo:</span>
                  <span>${(summary?.by_payment_method.cash || 0).toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between text-white font-bold pt-2 border-t border-white/10">
                  <span>Esperado:</span>
                  <span>${expectedCash.toLocaleString('es-AR')}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Monto de Cierre ($)</Label>
                <Input
                  type="number"
                  value={closingAmount}
                  onChange={(e) => setClosingAmount(e.target.value)}
                  placeholder="Ingresá el monto en caja"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              {closingAmount && (
                <div className={cn(
                  "p-3 rounded-lg text-center font-bold",
                  parseFloat(closingAmount) >= expectedCash 
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                )}>
                  Diferencia: ${(parseFloat(closingAmount) - expectedCash).toLocaleString('es-AR')}
                </div>
              )}
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => setShowCloseModal(false)}
                  className="flex-1 border-white/10 text-white hover:bg-white/10"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={closeRegister}
                  disabled={processing || !closingAmount}
                  className="flex-1 bg-red-500 hover:bg-red-600"
                >
                  {processing ? 'Cerrando...' : 'Cerrar Caja'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Movement Modal */}
      {showMovementModal && cashRegister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <Card className="w-full max-w-sm border-white/10 bg-[#1a1a1a]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">
                {movementType === 'income' ? 'Ingreso' : 'Egreso'}
              </CardTitle>
              <button onClick={() => setShowMovementModal(false)}>
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setMovementType('income')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border",
                    movementType === 'income'
                      ? "border-green-500 bg-green-500/10 text-green-400"
                      : "border-white/10 text-gray-400 hover:border-white/20"
                  )}
                >
                  <ArrowUpRight className="h-4 w-4" />
                  Ingreso
                </button>
                <button
                  onClick={() => setMovementType('expense')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border",
                    movementType === 'expense'
                      ? "border-red-500 bg-red-500/10 text-red-400"
                      : "border-white/10 text-gray-400 hover:border-white/20"
                  )}
                >
                  <ArrowDownRight className="h-4 w-4" />
                  Egreso
                </button>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Monto ($)</Label>
                <Input
                  type="number"
                  value={movementAmount}
                  onChange={(e) => setMovementAmount(e.target.value)}
                  placeholder="0.00"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Concepto</Label>
                <Input
                  type="text"
                  value={movementConcept}
                  onChange={(e) => setMovementConcept(e.target.value)}
                  placeholder="Descripción del movimiento"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <Button
                onClick={addMovement}
                disabled={processing || !movementAmount}
                className={cn(
                  "w-full",
                  movementType === 'income' 
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-red-500 hover:bg-red-600"
                )}
              >
                {processing ? 'Guardando...' : 'Registrar'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
