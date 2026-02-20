'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  LayoutDashboard, 
  Package, 
  FileText, 
  ClipboardCheck,
  MessageCircle,
  ArrowRight,
  ArrowLeft,
  Check
} from 'lucide-react'
import { cn } from '@/lib/utils'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

const steps = [
  {
    icon: LayoutDashboard,
    title: 'Dashboard',
    description: 'Acá ves el estado general de tu franquicia',
    details: [
      'Métricas de stock en tiempo real',
      'Alertas de productos críticos',
      'Resumen rápido del clima',
      'Accesos directos a las secciones'
    ],
    color: 'from-purple-500 to-indigo-500'
  },
  {
    icon: Package,
    title: 'Stock',
    description: 'Gestión completa de tu inventario',
    details: [
      'Ver todos los productos',
      'Filtrar por categoría y estado',
      'Exportar a Excel',
      'Gráficos de stock por categoría'
    ],
    color: 'from-emerald-500 to-teal-500'
  },
  {
    icon: FileText,
    title: 'Facturas',
    description: 'Procesá facturas de Helacor automáticamente',
    details: [
      'Subí PDFs de facturas',
      'IA extrae los productos',
      'Matching con tu catálogo',
      'Actualizá stock con un click'
    ],
    color: 'from-blue-500 to-cyan-500'
  },
  {
    icon: ClipboardCheck,
    title: 'Auditoría',
    description: 'Conteo de stock desde el celular',
    details: [
      'Conteo por categorías',
      'Detección de diferencias',
      'Guardado automático',
      'Historial de auditorías'
    ],
    color: 'from-amber-500 to-orange-500'
  },
  {
    icon: MessageCircle,
    title: 'Asistente IA',
    description: 'Tu ayudante personal para consultas',
    details: [
      'Consultar stock rápidamente',
      'Alertas inteligentes',
      'Recomendaciones de pedidos',
      'Disponible 24/7'
    ],
    color: 'from-[#E31D2B] to-[#ff4757]'
  }
]

export default function TourPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleFinish = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      await fetch(`${API_URL}/auth/complete-tour`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      router.push('/')
    } catch {
      router.push('/')
    }
  }

  const step = steps[currentStep]
  const StepIcon = step.icon

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl border-white/10 bg-[#1a1a1a] overflow-hidden">
        <div className={cn("h-1 w-full bg-gradient-to-r", step.color)} />
        
        <div className="px-8 pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">
              Paso {currentStep + 1} de {steps.length}
            </span>
            <span className="text-xs text-gray-500">
              {Math.round(((currentStep + 1) / steps.length) * 100)}% completado
            </span>
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div 
              className={cn("h-full bg-gradient-to-r transition-all duration-500", step.color)}
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        <CardContent className="p-8">
          <div className="text-center mb-6">
            <div className={cn(
              "mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r",
              step.color
            )}>
              <StepIcon className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{step.title}</h2>
            <p className="text-gray-400">{step.description}</p>
          </div>

          <div className="space-y-3 mb-8">
            {step.details.map((detail, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="text-gray-300">{detail}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Anterior
            </Button>

            {currentStep === steps.length - 1 ? (
              <Button
                onClick={handleFinish}
                disabled={loading}
                className="bg-[#E31D2B] hover:bg-[#C41925]"
              >
                {loading ? 'Guardando...' : '¡Empezar a usar!'}
                <Check className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                className="bg-[#E31D2B] hover:bg-[#C41925]"
              >
                Siguiente
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
