import { useState } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

export function AppLayout() {
  const { isAuthenticated } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-screen bg-background relative flex w-full">
      {/* ── Sidebar (Desktop only) ── */}
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(prev => !prev)} />
      
      {/* ── Main Layout Wrapper ── */}
      <div 
        className={cn(
          "flex flex-1 flex-col min-w-0 transition-all duration-300 ease-in-out",
          // En desktop, aplicamos un margin-left igual al ancho del sidebar
          collapsed ? "md:ml-16" : "md:ml-64"
        )}
      >
        <Header />
        
        {/* ── Page Content ── */}
        {/* En móvil (hasta md), agregamos mt-16 para que la Header fija no tape el contenido */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 mt-16 md:mt-0">
          <div className="mx-auto max-w-7xl w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
