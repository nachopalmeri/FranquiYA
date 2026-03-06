'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { 
  LayoutDashboard, 
  FileText, 
  ClipboardCheck, 
  Package, 
  LogOut,
  IceCreamBowl,
  Users,
  CalendarDays,
  CalendarRange,
  CheckSquare,
  UserCheck,
  ShoppingCart,
  DollarSign,
  MessageCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAuth } from './auth-provider'
import { availableModules, themes, type ThemeName } from '@/lib/theme'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  moduleId?: string
}

const MODULE_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  stock: Package,
  invoices: FileText,
  employees: Users,
  shifts: CalendarDays,
  holidays: CalendarRange,
  calendar: UserCheck,
  tasks: CheckSquare,
  pos: ShoppingCart,
  cash: DollarSign,
  customers: UserCheck,
  chat: MessageCircle,
}

const ALL_NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, moduleId: 'stock' },
  { href: '/stock', label: 'Stock', icon: Package, moduleId: 'stock' },
  { href: '/invoices', label: 'Facturas', icon: FileText, moduleId: 'invoices' },
  { href: '/audit', label: 'Auditoría', icon: ClipboardCheck, moduleId: 'stock' },
  { href: '/employees', label: 'Empleados', icon: Users, moduleId: 'employees' },
  { href: '/shifts', label: 'Turnos', icon: CalendarDays, moduleId: 'employees' },
  { href: '/holidays', label: 'Vacaciones', icon: CalendarRange, moduleId: 'employees' },
  { href: '/calendar', label: 'Calendario', icon: UserCheck, moduleId: 'calendar' },
  { href: '/tasks', label: 'Tareas', icon: CheckSquare, moduleId: 'tasks' },
  { href: '/pos', label: 'TPV', icon: ShoppingCart, moduleId: 'pos' },
  { href: '/cash', label: 'Caja', icon: DollarSign, moduleId: 'cash' },
  { href: '/customers', label: 'Clientes', icon: UserCheck, moduleId: 'customers' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [activeModules, setActiveModules] = useState<string[]>([])
  const [theme, setTheme] = useState<ThemeName>('modern')
  const [franchiseName, setFranchiseName] = useState('Mi Franquicia')

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/franchise`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          const settings = data.settings || {}
          setActiveModules(settings.modules || ['stock', 'invoices', 'employees', 'tasks', 'calendar', 'chat'])
          setTheme(settings.theme || 'modern')
          setFranchiseName(data.name || 'Mi Franquicia')
        }
      } catch (e) {
        // Use defaults
        setActiveModules(['stock', 'invoices', 'employees', 'tasks', 'calendar', 'chat'])
      }
    }
    loadSettings()
  }, [])

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token')
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
    } catch (e) {
      // Ignore
    }
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }

  // Filter nav items based on active modules
  const navItems = ALL_NAV_ITEMS.filter(item => {
    if (!item.moduleId) return true // Always show root items
    return activeModules.includes(item.moduleId)
  })

  const currentTheme = themes[theme]
  const primaryColor = currentTheme?.colors.primary || '#2563eb'
  const primaryHover = currentTheme?.colors.primaryHover || '#1d4ed8'
  const textColor = currentTheme?.colors.text || '#1e293b'
  const textMuted = currentTheme?.colors.textMuted || '#64748b'
  const background = currentTheme?.colors.background || '#f8fafc'
  const border = currentTheme?.colors.border || '#e2e8f0'

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r shadow-lg" style={{ backgroundColor: 'white', borderColor: border }}>
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center gap-3 border-b px-6" style={{ borderColor: border, backgroundColor: background }}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl shadow-lg" style={{ backgroundColor: primaryColor }}>
            <IceCreamBowl className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: textColor }}>Dashboard</h1>
            <p className="text-xs" style={{ color: textMuted }}>{franchiseName}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200'
                )}
                style={{
                  backgroundColor: isActive ? primaryColor : 'transparent',
                  color: isActive ? 'white' : textColor,
                  boxShadow: isActive ? `0 4px 12px ${primaryColor}40` : 'none'
                }}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <Separator />

        <div className="p-4">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3"
            style={{ color: textMuted }}
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            Cerrar sesión
          </Button>
        </div>
      </div>
    </aside>
  )
}
