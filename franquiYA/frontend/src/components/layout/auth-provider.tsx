'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import type { User } from '@/lib/types'
import { api } from '@/lib/api'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<User | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const refreshUser = async () => {
    try {
      const userData = await api.auth.me()
      setUser(userData)
      return userData
    } catch {
      localStorage.removeItem('token')
      setUser(null)
      return null
    }
  }

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        if (pathname !== '/login') {
          router.push('/login')
        }
        return
      }

      try {
        const userData = await api.auth.me()
        setUser(userData)
      } catch {
        localStorage.removeItem('token')
        if (pathname !== '/login') {
          router.push('/login')
        }
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [pathname, router])

  useEffect(() => {
    if (!loading && user) {
      const isSetupPage = pathname.startsWith('/setup')
      const isWelcomePage = pathname === '/welcome'
      const isTourPage = pathname === '/tour'
      const isLoginPage = pathname === '/login'

      if (user.requires_setup && !isSetupPage && !isLoginPage) {
        router.push('/setup')
      } else if (!user.requires_setup && !user.completed_tour && !isWelcomePage && !isTourPage && !isLoginPage) {
        router.push('/welcome')
      }
    }
  }, [user, loading, pathname, router])

  const login = async (email: string, password: string) => {
    const response = await api.auth.login({ email, password })
    localStorage.setItem('token', response.access_token)
    setUser(response.user)
    
    if (response.user.requires_setup) {
      router.push('/setup')
    } else if (!response.user.completed_tour) {
      router.push('/welcome')
    } else {
      router.push('/')
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
