'use client'

import { useState } from 'react'
import { IceCreamBowl, Mail, Lock, Eye, EyeOff, FlaskConical, ShieldCheck, PackageCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/components/layout/auth-provider'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, demoLogin } = useAuth()

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
    <main className="min-h-screen overflow-x-hidden bg-gradient-to-br from-[#FFF8F0] via-[#FEF3E2] to-[#F5E6D3] px-4 py-6 sm:px-6 lg:grid lg:place-items-center">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-7 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] lg:gap-12">
        <section className="w-[calc(100vw-2rem)] min-w-0 max-w-full space-y-5 sm:w-full sm:space-y-6">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E31D2B] shadow-lg shadow-[#E31D2B]/20">
              <IceCreamBowl className="h-7 w-7 text-white" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xl font-bold text-[#4A3728]">FranquiYA</p>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#8B7355]">Operaciones de franquicia</p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#B84A37]">Una mirada rápida al producto</p>
            <h1 className="max-w-xl text-3xl font-bold leading-tight text-[#4A3728] font-heading sm:text-4xl lg:text-5xl">
              Stock claro. <span className="text-[#E31D2B]">Decisiones a tiempo.</span>
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-[#765E49] sm:text-lg">
              Recorré el tablero y las alertas de inventario antes de entrar al demo interactivo.
            </p>
          </div>

          <div className="w-full max-w-full overflow-hidden rounded-2xl border border-[#E8DFD3] bg-[#251B17] shadow-xl shadow-[#4A3728]/10">
            <video
              className="block aspect-video h-auto w-full min-w-0 max-w-full bg-[#1A1A1A] object-cover"
              controls
              playsInline
              preload="none"
              poster="/videos/franquiya-preview-poster.jpg"
              aria-label="Vista previa en video del tablero de FranquiYA"
            >
              <source src="/videos/franquiya-preview.mp4" type="video/mp4" />
              Tu navegador no puede reproducir este video.
            </video>
            <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <PackageCheck className="h-4 w-4 text-[#F0B878]" aria-hidden="true" />
                Vista previa del tablero
              </div>
              <p className="text-xs leading-relaxed text-[#E2D2C7]">
                Cifras ilustrativas de una versión anterior. El demo actual usa datos ficticios.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-[#765E49]">
            <ShieldCheck className="h-4 w-4 shrink-0 text-[#5C7A50]" aria-hidden="true" />
            <span>Demo sin contraseña, con datos de ejemplo y solo lectura.</span>
          </div>
        </section>

        <Card className="w-full min-w-0 border-[#E8DFD3] bg-white/95 shadow-2xl shadow-[#4A3728]/10 backdrop-blur">
        <CardHeader className="space-y-2 pb-5">
          <CardTitle className="text-2xl font-bold text-[#4A3728] font-heading">Ingresá a FranquiYA</CardTitle>
          <CardDescription className="text-[#8B7355]">Usá tu cuenta o explorá el demo interactivo.</CardDescription>
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
                  autoComplete="email"
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
                  autoComplete="current-password"
                  placeholder="Tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-[#E8DFD3] bg-[#FFF8F0] pl-10 pr-10 text-[#4A3728] placeholder:text-[#8B7355]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-3 top-3 text-[#8B7355] hover:text-[#4A3728] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E31D2B]"
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
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-[#E31D2B] text-white hover:bg-[#C41925] focus-visible:ring-[#E31D2B]"
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

          <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wider text-[#A28C77]">
            <span className="h-px flex-1 bg-[#E8DFD3]" />
            o entrá sin cuenta
            <span className="h-px flex-1 bg-[#E8DFD3]" />
          </div>

          <div className="space-y-3 rounded-xl border border-[#E8DFD3] bg-[#FFF8F0] p-4">
            <p className="text-sm leading-relaxed text-[#765E49]">Probá el tablero y el inventario con seis productos ficticios.</p>
            <Button type="button" variant="outline" className="w-full border-[#8B7355] bg-white text-[#4A3728] hover:bg-[#F5E6D3]" onClick={async () => { setLoading(true); setError(''); try { await demoLogin() } catch { setError('El demo no está disponible por el momento.') } finally { setLoading(false) } }} disabled={loading}>
              <FlaskConical className="mr-2 h-4 w-4" aria-hidden="true" /> {loading ? 'Abriendo demo...' : 'Entrar al demo'}
            </Button>
            <p className="text-center text-xs text-[#8B7355]">Sin contraseña · solo lectura</p>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-[#8B7355]">
              ¿No tenés una cuenta?{' '}
              <Link href="/register" className="font-semibold text-[#E31D2B] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E31D2B]">
                Crear cuenta
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
      </div>
    </main>
  )
}
