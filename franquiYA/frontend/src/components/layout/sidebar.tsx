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
  Menu,
  X,
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

interface SidebarProps {
  isOpen?: boolean
  onToggle?: () => void
}

export function Sidebar({ isOpen = true, onToggle }: SidebarProps) {
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
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 z-40 h-screen w-64 bg-[#1a1a1a] border-r border-white/10 transition-transform duration-300",
        "lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E31D2B]">
              <IceCreamBowl className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-white">FranquiYA</h1>
              <p className="text-xs text-gray-400 truncate max-w-[150px]">{franchiseName}</p>
            </div>
            {/* Mobile close button */}
            <button 
              onClick={onToggle}
              className="lg:hidden p-2 text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation - simple, fast */}
          <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    // Close sidebar on mobile after navigation
                    if (window.innerWidth < 1024 && onToggle) {
                      onToggle()
                    }
                  }}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-[#E31D2B] text-white'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <Separator className="bg-white/10" />

          {/* Footer */}
          <div className="p-3">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-gray-400 hover:bg-white/5 hover:text-white"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              Cerrar sesión
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}

// Mobile menu button component
export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden p-2 text-white hover:bg-white/10 rounded-lg"
    >
      <Menu className="h-6 w-6" />
    </button>
  )
}
