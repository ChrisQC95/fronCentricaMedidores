import { useState } from 'react'
import { Sun, Moon, Bell, LogOut, Menu, Gauge } from 'lucide-react'
import { useTheme } from '@/components/theme-provider'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { useNavigate } from 'react-router-dom'
import { NavLinks } from './Navigation'


interface HeaderProps {
  title?: string
}

export function Header({ title = 'Dashboard' }: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const { logout, username } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isDark = theme === 'dark'

  // Derivar iniciales del avatar desde el username real
  const displayName = username ?? 'Usuario'
  const avatarInitials = displayName
    .split(/[\s._-]+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')
    || displayName.slice(0, 2).toUpperCase()

  const handleToggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark')
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-4 md:px-6 shadow-sm fixed top-0 w-full z-30 md:relative md:z-10 transition-all">

      {/* ── Mobile Branding & Menu Trigger ── */}
      <div className="flex md:hidden items-center gap-3">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Abrir menú</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 bg-slate-900 border-r-slate-800 flex flex-col">
            <SheetTitle className="sr-only">Menú de Navegación</SheetTitle>
            <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/40">
                <Gauge className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0 overflow-hidden">
                <p className="truncate text-sm font-bold text-white leading-tight">Centrica</p>
                <p className="truncate text-[11px] font-medium text-blue-400">Medidores</p>
              </div>
            </div>
            <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-4">
              {/* Le pasamos un callback para cerrar el menú al navegar */}
              <NavLinks onClick={() => setMobileMenuOpen(false)} />
            </nav>
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Gauge className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight text-foreground hidden sm:inline-block">Centrica</span>
        </div>
      </div>

      {/* ── Desktop Title ── */}
      <div className="hidden md:block">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground">Plataforma de Gestión de Medidores</p>
      </div>

      {/* ── Actions (Theme, Notifs, Avatar) ── */}
      <div className="flex items-center gap-1 sm:gap-2">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleTheme}
              aria-label="Cambiar tema"
              className="h-9 w-9 rounded-lg"
            >
              {isDark ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isDark ? 'Modo claro' : 'Modo oscuro'}
          </TooltipContent>
        </Tooltip>

        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 rounded-lg"
              aria-label="Notificaciones"
            >
              <Bell className="h-4 w-4" />
              <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-accent text-accent-foreground border-0">
                3
              </Badge>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Notificaciones (3)</TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 rounded-lg px-2 h-9 ml-1"
              aria-label="Menú de usuario"
            >
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                  {avatarInitials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden flex-col items-start text-left md:flex">
                <span className="text-xs font-medium leading-none">{displayName}</span>
                <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">Administrador</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
