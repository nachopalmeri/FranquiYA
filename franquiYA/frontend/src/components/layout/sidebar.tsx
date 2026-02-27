'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  UserCheck
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAuth } from './auth-provider'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/employees', label: 'Empleados', icon: Users },
  { href: '/shifts', label: 'Turnos', icon: CalendarDays },
  { href: '/holidays', label: 'Vacaciones', icon: CalendarRange },
  { href: '/calendar', label: 'Eventos', icon: UserCheck },
  { href: '/tasks', label: 'Tareas', icon: CheckSquare },
  { href: '/invoices', label: 'Facturas', icon: FileText },
  { href: '/audit', label: 'Auditoría', icon: ClipboardCheck },
  { href: '/stock', label: 'Stock', icon: Package },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()

  const handleLogout = () => {
    localStorage.removeItem('token')
    window.location.href = '/login'
  }

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-[#0a0a0a]">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center gap-3 border-b border-border px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E31D2B] shadow-lg shadow-[#E31D2B]/20">
            <IceCreamBowl className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Grido Smart</h1>
            <p className="text-xs text-gray-400">{user?.franchise_name || 'Mi Franquicia'}</p>
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
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-[#E31D2B] text-white shadow-lg shadow-[#E31D2B]/20'
                    : 'text-gray-400 hover:bg-secondary hover:text-white'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <Separator className="bg-border" />

        <div className="p-4">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-gray-400 hover:bg-secondary hover:text-white"
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
