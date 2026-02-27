'use client'

import { useState } from 'react'
import { IceCreamBowl, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/components/layout/auth-provider'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
    } catch {
      setError('Email o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#FFF8F0] via-[#FEF3E2] to-[#F5E6D3] p-4">
      <Card className="w-full max-w-md border-[#E8DFD3] bg-white/90 shadow-2xl backdrop-blur">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E31D2B] shadow-lg shadow-[#E31D2B]/20">
            <IceCreamBowl className="h-10 w-10 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-[#4A3728] font-heading">Grido Smart Ops</CardTitle>
          <CardDescription className="text-[#8B7355]">
            Ingresa a tu cuenta para continuar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#4A3728]">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-[#8B7355]" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-[#E8DFD3] bg-[#FFF8F0] pl-10 text-[#4A3728] placeholder:text-[#8B7355]"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#4A3728]">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-[#8B7355]" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-[#E8DFD3] bg-[#FFF8F0] pl-10 pr-10 text-[#4A3728] placeholder:text-[#8B7355]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-[#8B7355] hover:text-[#4A3728]"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-[#E31D2B] hover:bg-[#C41925] text-white"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Ingresando...
                </span>
              ) : (
                'Ingresar'
              )}
            </Button>
          </form>

          <div className="mt-6 rounded-xl bg-[#F5E6D3] border border-[#E8DFD3] p-4">
            <p className="text-center text-sm text-[#8B7355]">
              Demo: <span className="font-mono font-semibold text-[#4A3728]">admin@grido.com</span> / <span className="font-mono font-semibold text-[#4A3728]">admin123</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
