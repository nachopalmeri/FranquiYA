'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

// Simplified sidebar - show all items, load fast
const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/stock', label: 'Stock', icon: Package },
  { href: '/invoices', label: 'Facturas', icon: FileText },
  { href: '/audit', label: 'Auditoría', icon: ClipboardCheck },
  { href: '/employees', label: 'Empleados', icon: Users },
  { href: '/shifts', label: 'Turnos', icon: CalendarDays },
  { href: '/holidays', label: 'Vacaciones', icon: CalendarRange },
  { href: '/calendar', label: 'Calendario', icon: UserCheck },
  { href: '/tasks', label: 'Tareas', icon: CheckSquare },
  { href: '/pos', label: 'TPV', icon: ShoppingCart },
  { href: '/cash', label: 'Caja', icon: DollarSign },
]

export function Sidebar() {
  const pathname = usePathname()
  const [franchiseName, setFranchiseName] = useState('Mi Negocio')

  // Solo cargar nombre de franquicia una vez
  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        const parsed = JSON.parse(userData)
        if (parsed.franchise_name) {
          setFranchiseName(parsed.franchise_name)
        }
      } catch {
        // Ignore
      }
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-white border-r border-slate-200 shadow-lg">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-4 bg-gradient-to-r from-white to-slate-50">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20">
            <IceCreamBowl className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Dashboard</h1>
            <p className="text-xs text-slate-500 truncate max-w-[150px]">{franchiseName}</p>
          </div>
        </div>

        {/* Navigation - simple, fast */}
        <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <Separator />

        {/* Footer */}
        <div className="p-3">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
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
