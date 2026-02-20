'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Sparkles, 
  LayoutDashboard, 
  Package, 
  FileText, 
  ClipboardCheck,
  CloudSun,
  MessageCircle,
  ArrowRight
} from 'lucide-react'

const features = [
  {
    icon: LayoutDashboard,
    title: 'Dashboard',
    description: 'Vista general de tu negocio con métricas clave',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20'
  },
  {
    icon: Package,
    title: 'Stock',
    description: 'Gestión completa de productos y alertas',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20'
  },
  {
    icon: FileText,
    title: 'Facturas',
    description: 'Procesá facturas PDF y actualizá stock automáticamente',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20'
  },
  {
    icon: ClipboardCheck,
    title: 'Auditoría',
    description: 'Conteo de stock en cámara desde el celular',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20'
  },
  {
    icon: CloudSun,
    title: 'Clima Inteligente',
    description: 'Pronóstico del tiempo para anticipar ventas',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20'
  },
  {
    icon: MessageCircle,
    title: 'Asistente IA',
    description: 'Consultá stock y recibí recomendaciones',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/20'
  }
]

export default function WelcomePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl border-white/10 bg-[#1a1a1a] overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-[#E31D2B] via-purple-500 to-[#E31D2B]" />
        
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-[#E31D2B] to-[#ff4757] shadow-lg shadow-[#E31D2B]/30">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              ¡Bienvenido a Grido Smart Ops!
            </h1>
            <p className="text-gray-400">
              Tu sistema de gestión integral para franquicias
            </p>
          </div>

          <div className="space-y-3 mb-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${feature.bgColor}`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{feature.title}</h3>
                  <p className="text-sm text-gray-400">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <p className="text-gray-500 text-sm mb-4">
              Te llevamos de la mano con un tour rápido
            </p>
            <Button
              onClick={() => router.push('/tour')}
              className="bg-[#E31D2B] hover:bg-[#C41925] shadow-lg shadow-[#E31D2B]/30"
            >
              Hacer el Tour
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
