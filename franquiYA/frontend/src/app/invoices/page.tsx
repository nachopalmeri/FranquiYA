'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { InvoiceUploader } from '@/components/invoices/invoice-uploader'
import { InvoicePreview } from '@/components/invoices/invoice-preview'
import { ChatWidget } from '@/components/chat/chat-widget'
import type { Invoice } from '@/lib/types'
import { useAuth } from '@/components/layout/auth-provider'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

export default function InvoicesPage() {
  const { loading: authLoading } = useAuth()
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleUpload = async (file: File) => {
    setUploading(true)
    setError(null)
    setSuccess(null)
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`${API_URL}/invoices/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })

      if (res.ok) {
        const invoice = await res.json()
        setCurrentInvoice(invoice)
        if (invoice.status === 'confirmed') {
          setSuccess('Esta factura ya fue procesada anteriormente')
        }
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.detail || 'Error al procesar la factura')
      }
    } catch (err) {
      setError('Error de conexión. Verificá tu conexión a internet.')
      console.error('Failed to upload invoice:', err)
    } finally {
      setUploading(false)
    }
  }

  const handleApproveLine = async (lineId: number, productId?: number) => {
    if (!currentInvoice) return
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const res = await fetch(
        `${API_URL}/invoices/${currentInvoice.id}/lines/${lineId}/approve`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ product_id: productId })
        }
      )

      if (res.ok) {
        setCurrentInvoice(await res.json())
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.detail || 'Error al aprobar línea')
      }
    } catch (err) {
      setError('Error de conexión')
      console.error('Failed to approve line:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveAll = async () => {
    if (!currentInvoice) return
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const res = await fetch(
        `${API_URL}/invoices/${currentInvoice.id}/approve-all`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (res.ok) {
        const invoice = await res.json()
        setCurrentInvoice(invoice)
        setSuccess('Líneas con match aprobadas automáticamente')
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.detail || 'Error al aprobar líneas')
      }
    } catch (err) {
      setError('Error de conexión')
      console.error('Failed to approve all:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (!currentInvoice) return
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const res = await fetch(
        `${API_URL}/invoices/${currentInvoice.id}/confirm`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (res.ok) {
        const invoice = await res.json()
        setCurrentInvoice(invoice)
        setSuccess('Stock actualizado correctamente')
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.detail || 'Error al confirmar factura')
      }
    } catch (err) {
      setError('Error de conexión')
      console.error('Failed to confirm invoice:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setCurrentInvoice(null)
    setError(null)
    setSuccess(null)
  }

  if (authLoading) {
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
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">Conciliación de Facturas</h1>
            <p className="text-gray-400">Procesa facturas PDF de Helacor S.A. y actualiza el stock automáticamente</p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
              <p className="text-emerald-400">{success}</p>
            </div>
          )}

          <div className="space-y-6">
            <InvoiceUploader 
              onUpload={handleUpload} 
              loading={uploading}
              disabled={!!currentInvoice && currentInvoice.status === 'pending'}
            />

            {currentInvoice && (
              <InvoicePreview
                invoice={currentInvoice}
                onApproveLine={handleApproveLine}
                onApproveAll={handleApproveAll}
                onConfirm={handleConfirm}
                onClear={handleClear}
                loading={loading}
              />
            )}
          </div>
        </div>
        <ChatWidget />
      </main>
    </div>
  )
}
