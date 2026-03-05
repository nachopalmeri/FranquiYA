'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Store, Mail, Lock, Eye, EyeOff, User, Building2, ArrowRight, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    password: '',
    confirmPassword: '',
    city: '',
    address: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.businessName.trim()) {
      newErrors.businessName = 'El nombre del negocio es requerido'
    }
    
    if (!formData.ownerName.trim()) {
      newErrors.ownerName = 'El nombre del dueño es requerido'
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El email no es válido'
    }
    
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida'
    } else if (formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres'
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.city.trim()) {
      newErrors.city = 'La ciudad es requerida'
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'La dirección es requerida'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2)
    }
  }

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      setError('')
      
      if (!validateStep2()) {
        return
      }
      
      setLoading(true)
      
      try {
        const response = await fetch(`${API_URL}/auth/register/public`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            name: formData.ownerName,
            franchise_data: {
              name: formData.businessName,
              owner: formData.ownerName,
              city: formData.city,
              address: formData.address,
              province: 'Buenos Aires'
            }
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.detail || 'Error al registrar')
        }

        // Registration successful - user is logged in automatically
        const data = await response.json()
        
        // Store token (for now, will be moved to cookies later)
        localStorage.setItem('token', data.access_token)
        localStorage.setItem('user', JSON.stringify(data.user))
        
        // Redirect to setup
        setStep(3)
        
        // Redirect after 2 seconds
        setTimeout(() => {
          window.location.href = '/setup'
        }, 2000)
        
      } catch (err: any) {
        setError(err.message || 'Error al registrar. Intenta de nuevo.')
      } finally {
        setLoading(false)
      }
    }

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="businessName" className="text-[#4A3728]">
          Nombre del Negocio *
        </Label>
        <div className="relative">
          <Store className="absolute left-3 top-3 h-4 w-4 text-[#8B7355]" />
          <Input
            id="businessName"
            placeholder="Ej: Heladería Grido Lanús"
            value={formData.businessName}
            onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
            className={`border-[#E8DFD3] bg-[#FFF8F0] pl-10 text-[#4A3728] placeholder:text-[#8B7355] ${
              errors.businessName ? 'border-red-500' : ''
            }`}
          />
        </div>
        {errors.businessName && (
          <p className="text-sm text-red-600">{errors.businessName}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="ownerName" className="text-[#4A3728]">
          Nombre del Dueño *
        </Label>
        <div className="relative">
          <User className="absolute left-3 top-3 h-4 w-4 text-[#8B7355]" />
          <Input
            id="ownerName"
            placeholder="Tu nombre completo"
            value={formData.ownerName}
            onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
            className={`border-[#E8DFD3] bg-[#FFF8F0] pl-10 text-[#4A3728] placeholder:text-[#8B7355] ${
              errors.ownerName ? 'border-red-500' : ''
            }`}
          />
        </div>
        {errors.ownerName && (
          <p className="text-sm text-red-600">{errors.ownerName}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-[#4A3728]">
          Email *
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-[#8B7355]" />
          <Input
            id="email"
            type="email"
            placeholder="tu@email.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={`border-[#E8DFD3] bg-[#FFF8F0] pl-10 text-[#4A3728] placeholder:text-[#8B7355] ${
              errors.email ? 'border-red-500' : ''
            }`}
          />
        </div>
        {errors.email && (
          <p className="text-sm text-red-600">{errors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-[#4A3728]">
          Contraseña *
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-[#8B7355]" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Mínimo 8 caracteres"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className={`border-[#E8DFD3] bg-[#FFF8F0] pl-10 pr-10 text-[#4A3728] placeholder:text-[#8B7355] ${
              errors.password ? 'border-red-500' : ''
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-[#8B7355] hover:text-[#4A3728]"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-red-600">{errors.password}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-[#4A3728]">
          Confirmar Contraseña *
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-[#8B7355]" />
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Repite tu contraseña"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            className={`border-[#E8DFD3] bg-[#FFF8F0] pl-10 pr-10 text-[#4A3728] placeholder:text-[#8B7355] ${
              errors.confirmPassword ? 'border-red-500' : ''
            }`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-3 text-[#8B7355] hover:text-[#4A3728]"
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-red-600">{errors.confirmPassword}</p>
        )}
      </div>

      <Button
        type="button"
        onClick={handleNext}
        className="w-full bg-[#E31D2B] hover:bg-[#C41925] text-white"
      >
        Continuar
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="city" className="text-[#4A3728]">
          Ciudad *
        </Label>
        <div className="relative">
          <Building2 className="absolute left-3 top-3 h-4 w-4 text-[#8B7355]" />
          <Input
            id="city"
            placeholder="Ej: Lanús"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            className={`border-[#E8DFD3] bg-[#FFF8F0] pl-10 text-[#4A3728] placeholder:text-[#8B7355] ${
              errors.city ? 'border-red-500' : ''
            }`}
          />
        </div>
        {errors.city && (
          <p className="text-sm text-red-600">{errors.city}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address" className="text-[#4A3728]">
          Dirección *
        </Label>
        <div className="relative">
          <Building2 className="absolute left-3 top-3 h-4 w-4 text-[#8B7355]" />
          <Input
            id="address"
            placeholder="Ej: Av. Hipólito Yrigoyen 1234"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className={`border-[#E8DFD3] bg-[#FFF8F0] pl-10 text-[#4A3728] placeholder:text-[#8B7355] ${
              errors.address ? 'border-red-500' : ''
            }`}
          />
        </div>
        {errors.address && (
          <p className="text-sm text-red-600">{errors.address}</p>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep(1)}
          className="flex-1 border-[#E8DFD3] text-[#4A3728] hover:bg-[#FFF8F0]"
        >
          Volver
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-[#E31D2B] hover:bg-[#C41925] text-white"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Creando cuenta...
            </span>
          ) : (
            'Crear Cuenta'
          )}
        </Button>
      </div>
    </div>
  )

  const renderSuccess = () => (
    <div className="text-center space-y-4">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <CheckCircle className="h-8 w-8 text-green-600" />
      </div>
      <h3 className="text-xl font-bold text-[#4A3728]">¡Cuenta creada!</h3>
      <p className="text-[#8B7355]">
        Tu cuenta ha sido creada exitosamente. Serás redirigido al login en unos segundos...
      </p>
    </div>
  )

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#FFF8F0] via-[#FEF3E2] to-[#F5E6D3] p-4">
      <Card className="w-full max-w-md border-[#E8DFD3] bg-white/90 shadow-2xl backdrop-blur">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E31D2B] shadow-lg shadow-[#E31D2B]/20">
            <Store className="h-10 w-10 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-[#4A3728] font-heading">
            Crear Cuenta
          </CardTitle>
          <CardDescription className="text-[#8B7355]">
            {step === 1 && 'Paso 1 de 2: Información de cuenta'}
            {step === 2 && 'Paso 2 de 2: Datos del local'}
            {step === 3 && '¡Listo!'}
          </CardDescription>
          
          {/* Progress bar */}
          {step < 3 && (
            <div className="mt-4 flex gap-2">
              <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-[#E31D2B]' : 'bg-[#E8DFD3]'}`} />
              <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-[#E31D2B]' : 'bg-[#E8DFD3]'}`} />
            </div>
          )}
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderSuccess()}
          </form>

          {step < 3 && (
            <div className="mt-6 text-center">
              <p className="text-sm text-[#8B7355]">
                ¿Ya tenés una cuenta?{' '}
                <Link href="/login" className="font-semibold text-[#E31D2B] hover:underline">
                  Ingresar
                </Link>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
