'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, User, Building, FileText } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

export default function SetupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    franchise_code: '',
    address: '',
    city: '',
    province: '',
    cuit: '',
    supplier: 'Helacor S.A.'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/auth/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        router.push('/setup/products')
      } else {
        const data = await res.json()
        alert(data.detail || 'Error al guardar')
      }
    } catch {
      alert('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
      <Card className="w-full max-w-xl border-white/10 bg-[#1a1a1a]">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-[#E31D2B] to-[#ff4757]">
            <Building className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl text-white">Configurá tu Franquicia</CardTitle>
          <p className="text-gray-400 text-sm mt-2">
            Completá los datos de tu negocio para empezar
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <User className="h-4 w-4" />
                Tu nombre *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Juan García"
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#E31D2B]/50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Código de Franquicia *
              </label>
              <Input
                value={formData.franchise_code}
                onChange={(e) => setFormData({ ...formData, franchise_code: e.target.value })}
                placeholder="Ej: 101535"
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#E31D2B]/50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Dirección *
              </label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Ej: Av. San Martín 1234"
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#E31D2B]/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Ciudad *</label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Ej: Lanús"
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#E31D2B]/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Provincia *</label>
                <Input
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  placeholder="Ej: Buenos Aires"
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#E31D2B]/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">CUIT (opcional)</label>
              <Input
                value={formData.cuit}
                onChange={(e) => setFormData({ ...formData, cuit: e.target.value })}
                placeholder="Ej: 20-12345678-9"
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#E31D2B]/50"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E31D2B] hover:bg-[#C41925]"
            >
              {loading ? 'Guardando...' : 'Continuar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
