import {
  ChevronLeft, ChevronRight, Menu, Gauge
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { NavLinks } from './Navigation'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={cn(
        // Responsive classes: hidden on mobile, fixed on desktop
        'hidden md:flex md:flex-col md:fixed md:inset-y-0 z-40',
        'border-r border-slate-800 bg-slate-900 transition-all duration-300 ease-in-out',
        collapsed ? 'md:w-16' : 'md:w-64'
      )}
    >
      {/* ── Logo / Brand ─────────────────────────────── */}
      <div
        className={cn(
          'flex h-16 items-center border-b border-slate-800 px-4 transition-all duration-300',
          collapsed ? 'justify-center px-0' : 'gap-3'
        )}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/40">
          <Gauge className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0 overflow-hidden">
            <p className="truncate text-sm font-bold text-white leading-tight">Centrica</p>
            <p className="truncate text-[11px] font-medium text-blue-400">Medidores</p>
          </div>
        )}
      </div>

      {/* ── Nav Items ────────────────────────────────── */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2 pt-3">
        <NavLinks collapsed={collapsed} />
      </nav>

      {/* ── Collapse Toggle ──────────────────────────── */}
      <div className="border-t border-slate-800 p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className={cn(
            'w-full text-slate-500 hover:bg-slate-800 hover:text-white',
            collapsed ? 'justify-center px-0' : 'justify-between gap-2 px-3'
          )}
          aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Menu className="h-4 w-4" />
                <span className="text-xs font-medium">Colapsar menú</span>
              </div>
              <ChevronLeft className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </aside>
  )
}
