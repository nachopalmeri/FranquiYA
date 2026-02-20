'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Edit3, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

export default function SetupProductsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<'base' | 'manual' | null>(null)

  const handleContinue = async () => {
    if (!selected) return
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/auth/setup/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ load_base_products: selected === 'base' })
      })

      if (res.ok) {
        router.push('/welcome')
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
      <Card className="w-full max-w-2xl border-white/10 bg-[#1a1a1a]">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-500">
            <Package className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl text-white">¿Cómo querés cargar los productos?</CardTitle>
          <p className="text-gray-400 text-sm mt-2">
            Elegí la opción que mejor se adapte a tu necesidad
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <button
            type="button"
            onClick={() => setSelected('base')}
            className={cn(
              "w-full p-6 rounded-xl border-2 transition-all duration-200 text-left",
              selected === 'base'
                ? "border-emerald-500 bg-emerald-500/10"
                : "border-white/10 bg-white/5 hover:border-white/20"
            )}
          >
            <div className="flex items-start gap-4">
              <div className={cn(
                "flex h-12 w-12 items-center justify-center rounded-xl shrink-0",
                selected === 'base' ? "bg-emerald-500/20" : "bg-white/5"
              )}>
                <Package className={cn(
                  "h-6 w-6",
                  selected === 'base' ? "text-emerald-400" : "text-gray-400"
                )} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className={cn(
                    "font-semibold text-lg",
                    selected === 'base' ? "text-emerald-400" : "text-white"
                  )}>
                    Cargar lista base Grido
                  </h3>
                  {selected === 'base' && <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
                </div>
                <p className="text-gray-400 text-sm mt-1">
                  107 productos precargados con stock inicial
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Sabores, bombones, palitos, tortas, familiares y más
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelected('manual')}
            className={cn(
              "w-full p-6 rounded-xl border-2 transition-all duration-200 text-left",
              selected === 'manual'
                ? "border-blue-500 bg-blue-500/10"
                : "border-white/10 bg-white/5 hover:border-white/20"
            )}
          >
            <div className="flex items-start gap-4">
              <div className={cn(
                "flex h-12 w-12 items-center justify-center rounded-xl shrink-0",
                selected === 'manual' ? "bg-blue-500/20" : "bg-white/5"
              )}>
                <Edit3 className={cn(
                  "h-6 w-6",
                  selected === 'manual' ? "text-blue-400" : "text-gray-400"
                )} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className={cn(
                    "font-semibold text-lg",
                    selected === 'manual' ? "text-blue-400" : "text-white"
                  )}>
                    Cargar manualmente
                  </h3>
                  {selected === 'manual' && <CheckCircle2 className="h-5 w-5 text-blue-400" />}
                </div>
                <p className="text-gray-400 text-sm mt-1">
                  Agregar productos uno a uno desde cero
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Personalizado para tu negocio
                </p>
              </div>
            </div>
          </button>

          <Button
            onClick={handleContinue}
            disabled={!selected || loading}
            className="w-full bg-[#E31D2B] hover:bg-[#C41925] mt-6"
          >
            {loading ? 'Configurando...' : 'Comenzar'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
