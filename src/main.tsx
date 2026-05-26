import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from '@/components/theme-provider.tsx'
import { AuthProvider } from '@/context/AuthContext.tsx'
import { TooltipProvider } from '@/components/ui/tooltip.tsx'
import { Toaster } from '@/components/ui/sonner.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="light" storageKey="centrica_theme">
      <AuthProvider>
        <TooltipProvider>
          <App />
          {/* Sonner toast — position top-right, rich colors */}
          <Toaster position="top-right" richColors closeButton />
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
)
