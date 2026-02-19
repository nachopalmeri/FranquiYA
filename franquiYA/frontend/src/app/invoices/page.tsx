'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { InvoiceUploader } from '@/components/invoices/invoice-uploader'
import { InvoiceTable } from '@/components/invoices/invoice-table'
import type { Invoice } from '@/lib/types'
import { useAuth } from '@/components/layout/auth-provider'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

export default function InvoicesPage() {
  const { loading: authLoading } = useAuth()
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (file: File) => {
    setUploading(true)
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
      }
    } catch (error) {
      console.error('Failed to upload invoice:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleApproveLine = async (lineId: number, productId?: number) => {
    if (!currentInvoice) return
    setLoading(true)
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
      }
    } catch (error) {
      console.error('Failed to approve line:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (!currentInvoice) return
    setLoading(true)
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
        setCurrentInvoice(await res.json())
      }
    } catch (error) {
      console.error('Failed to confirm invoice:', error)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
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
            <p className="text-gray-400">Procesa facturas PDF de Helacor S.A.</p>
          </div>

          <div className="space-y-6">
            <InvoiceUploader onUpload={handleUpload} loading={uploading} />

            {currentInvoice && (
              <InvoiceTable
                invoice={currentInvoice}
                onApproveLine={handleApproveLine}
                onConfirm={handleConfirm}
                loading={loading}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
