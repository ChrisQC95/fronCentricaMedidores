import { NavLink } from 'react-router-dom'
import {
  Layers, Users, Gauge, LayoutDashboard
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useAuth } from '@/context/AuthContext'

export const navItems = [
  { to: '/',                label: 'Dashboard',              icon: LayoutDashboard, end: true,  adminOnly: true },
  { to: '/clientes',        label: 'Clientes (Empresas)',    icon: Users,           end: false, adminOnly: true },
  { to: '/infraestructura', label: 'Infraestructura',        icon: Layers,          end: false, adminOnly: true },
  { to: '/medidores',       label: 'Registro de Medidores',  icon: Gauge,           end: false, adminOnly: false },
]

interface NavLinksProps {
  collapsed?: boolean
  onClick?: () => void
}

export function NavLinks({ collapsed = false, onClick }: NavLinksProps) {
  const { userRole } = useAuth()
  
  const filteredNavItems = navItems.filter(item => 
    userRole === 'ADMIN' ? true : !item.adminOnly
  )

  return (
    <>
      {!collapsed && (
        <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Menú principal
        </p>
      )}

      {filteredNavItems.map(({ to, label, icon: Icon, end }) => (
        <Tooltip key={to} delayDuration={0}>
          <TooltipTrigger asChild>
            <NavLink
              to={to}
              end={end}
              onClick={onClick}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-primary text-white shadow-md shadow-primary/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white',
                  collapsed && 'justify-center px-0'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn(
                      'h-4 w-4 shrink-0 transition-colors',
                      isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'
                    )}
                  />
                  {!collapsed && (
                    <span className="truncate">{label}</span>
                  )}
                  {/* Indicador activo */}
                  {!collapsed && isActive && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/70" />
                  )}
                </>
              )}
            </NavLink>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right" className="font-medium">
              {label}
            </TooltipContent>
          )}
        </Tooltip>
      ))}
    </>
  )
}
