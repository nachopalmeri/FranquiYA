'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Store, Building2, Palette, Package, FileText, Users, 
  ShoppingCart, DollarSign, UserCheck, Calendar, CheckSquare, 
  MessageCircle, ArrowRight, ArrowLeft, Check, Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { themes, availableModules, businessTypes, type ThemeName, type BusinessType } from '@/lib/theme'
import { api } from '@/lib/api'

const STEP_COUNT = 4

interface OnboardingData {
  // Step 1: Business Info
  businessName: string
  ownerName: string
  businessType: BusinessType
  // Step 2: Modules
  modules: string[]
  // Step 3: Theme
  theme: ThemeName
  // Step 4: Products
  loadSampleProducts: boolean
}

const MODULE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Package,
  FileText,
  Users,
  ShoppingCart,
  DollarSign,
  UserCheck,
  Calendar,
  CheckSquare,
  MessageCircle,
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<OnboardingData>({
    businessName: '',
    ownerName: '',
    businessType: 'heladeria',
    modules: ['stock', 'invoices', 'employees', 'tasks', 'calendar', 'chat'],
    theme: 'modern',
    loadSampleProducts: true,
  })

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }))
  }

  const toggleModule = (moduleId: string) => {
    const module = availableModules.find(m => m.id === moduleId)
    if (module?.required) return // Can't toggle required modules
    
    setData(prev => {
      if (prev.modules.includes(moduleId)) {
        return { ...prev, modules: prev.modules.filter(m => m !== moduleId) }
      } else {
        return { ...prev, modules: [...prev.modules, moduleId] }
      }
    })
  }

  const handleNext = () => {
    if (step < STEP_COUNT) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      // Save franchise settings
      await api.franchise.update({
        name: data.businessName,
        owner: data.ownerName,
        city: data.businessName.split(' ').slice(1).join(' ') || data.businessName,
        settings: {
          theme: data.theme,
          business_type: data.businessType,
          modules: data.modules,
        }
      })

      // Load sample products if requested
      if (data.loadSampleProducts) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/auth/setup/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ load_base_products: true })
        })
      }

      router.push('/welcome')
    } catch (error) {
      console.error('Onboarding error:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
          <Store className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Información de tu Negocio</h2>
        <p className="text-slate-500">Cuéntanos sobre tu local</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="businessName" className="text-slate-700">Nombre del Negocio *</Label>
          <Input
            id="businessName"
            placeholder="Ej: Heladería Grido Lanús"
            value={data.businessName}
            onChange={(e) => updateData({ businessName: e.target.value })}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="ownerName" className="text-slate-700">Nombre del Dueño *</Label>
          <Input
            id="ownerName"
            placeholder="Tu nombre completo"
            value={data.ownerName}
            onChange={(e) => updateData({ ownerName: e.target.value })}
            className="mt-1"
          />
        </div>

        <div>
          <Label className="text-slate-700">Tipo de Negocio</Label>
          <div className="grid grid-cols-2 gap-3 mt-2">
            {(Object.entries(businessTypes) as [BusinessType, { name: string; icon: string }][]).map(([key, { name }]) => (
              <button
                key={key}
                type="button"
                onClick={() => updateData({ businessType: key })}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  data.businessType === key
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className={`font-medium ${data.businessType === key ? 'text-blue-700' : 'text-slate-700'}`}>
                  {name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mb-4">
          <Palette className="w-8 h-8 text-purple-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Elige tus Módulos</h2>
        <p className="text-slate-500">Selecciona las funcionalidades que necesitás</p>
      </div>

      <div className="grid gap-3">
        {availableModules.map((module) => {
          const Icon = MODULE_ICONS[module.icon] || Package
          const isEnabled = data.modules.includes(module.id)
          
          return (
            <button
              key={module.id}
              type="button"
              onClick={() => toggleModule(module.id)}
              disabled={module.required}
              className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all text-left ${
                isEnabled
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              } ${module.required ? 'opacity-70' : ''}`}
            >
              <div className={`p-2 rounded-lg ${isEnabled ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${isEnabled ? 'text-blue-800' : 'text-slate-700'}`}>
                    {module.name}
                  </span>
                  {module.required && (
                    <Badge variant="secondary" className="text-xs">Requerido</Badge>
                  )}
                </div>
                <p className="text-sm text-slate-500">{module.description}</p>
              </div>
              {isEnabled && (
                <Check className="w-5 h-5 text-blue-500" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <Sparkles className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Elige tu Estilo</h2>
        <p className="text-slate-500">Personaliza la apariencia de tu dashboard</p>
      </div>

      <div className="grid gap-4">
        {(Object.entries(themes) as [ThemeName, typeof themes.modern][]).map(([key, theme]) => (
          <button
            key={key}
            type="button"
            onClick={() => updateData({ theme: key })}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              data.theme === key
                ? 'border-blue-500 ring-2 ring-blue-200'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium capitalize text-slate-800">{theme.name}</span>
              {data.theme === key && (
                <Badge className="bg-blue-500">Seleccionado</Badge>
              )}
            </div>
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded" style={{ backgroundColor: theme.colors.primary }} />
              <div className="w-8 h-8 rounded" style={{ backgroundColor: theme.colors.secondary }} />
              <div className="w-8 h-8 rounded" style={{ backgroundColor: theme.colors.accent }} />
              <div className="w-8 h-8 rounded" style={{ backgroundColor: theme.colors.success }} />
              <div className="w-8 h-8 rounded" style={{ backgroundColor: theme.colors.error }} />
            </div>
          </button>
        ))}
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4">
          <Package className="w-8 h-8 text-amber-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Productos Iniciales</h2>
        <p className="text-slate-500">¿Querés cargar productos de ejemplo?</p>
      </div>

      <div className="space-y-4">
        <button
          type="button"
          onClick={() => updateData({ loadSampleProducts: true })}
          className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
            data.loadSampleProducts
              ? 'border-blue-500 bg-blue-50'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <Check className={`w-5 h-5 ${data.loadSampleProducts ? 'text-blue-500' : 'text-slate-300'}`} />
            <div>
              <p className="font-medium text-slate-800">Sí, cargar productos de ejemplo</p>
              <p className="text-sm text-slate-500">Ideal para empezar rápido</p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => updateData({ loadSampleProducts: false })}
          className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
            !data.loadSampleProducts
              ? 'border-blue-500 bg-blue-50'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-5 h-5 rounded-full border-2 ${!data.loadSampleProducts ? 'border-blue-500' : 'border-slate-300'}`} />
            <div>
              <p className="font-medium text-slate-800">No, empezar desde cero</p>
              <p className="text-sm text-slate-500">Cargar mis propios productos después</p>
            </div>
          </div>
        </button>
      </div>

      <div className="bg-slate-50 rounded-lg p-4 mt-6">
        <h4 className="font-medium text-slate-800 mb-2">Resumen de configuración:</h4>
        <ul className="text-sm text-slate-600 space-y-1">
          <li>• Negocio: <strong>{data.businessName || 'Sin nombre'}</strong></li>
          <li>• Tipo: <strong>{businessTypes[data.businessType].name}</strong></li>
          <li>• Módulos: <strong>{data.modules.length} seleccionados</strong></li>
          <li>• Tema: <strong className="capitalize">{themes[data.theme].name}</strong></li>
        </ul>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {['Negocio', 'Módulos', 'Estilo', 'Productos'].map((label, i) => (
              <div key={label} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step > i + 1
                    ? 'bg-blue-500 text-white'
                    : step === i + 1
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-200 text-slate-500'
                }`}>
                  {step > i + 1 ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span className="text-xs text-slate-500 mt-1 hidden sm:block">{label}</span>
              </div>
            ))}
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${(step / STEP_COUNT) * 100}%` }}
            />
          </div>
        </div>

        <Card className="shadow-xl">
          <CardContent className="p-8">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
          </CardContent>
          
          <div className="flex justify-between p-6 border-t bg-slate-50">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 1}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Atrás
            </Button>

            {step < STEP_COUNT ? (
              <Button onClick={handleNext} className="gap-2 bg-blue-600 hover:bg-blue-700">
                Continuar
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                {loading ? 'Guardando...' : 'Completar Configuración'}
                <Check className="w-4 h-4" />
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
