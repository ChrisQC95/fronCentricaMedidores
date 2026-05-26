import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { AdminRoute } from '@/components/layout/AdminRoute'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ClientesPage } from '@/pages/ClientesPage'
import { InfraestructuraPage } from '@/pages/InfraestructuraPage'
import { MedidoresPage } from '@/pages/MedidoresPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AppLayout />}>
          {/* Rutas exclusivas de ADMIN */}
          <Route element={<AdminRoute />}>
            <Route index element={<DashboardPage />} />
            <Route path="/clientes" element={<ClientesPage />} />
            <Route path="/infraestructura" element={<InfraestructuraPage />} />
          </Route>
          
          {/* Rutas permitidas para TODOS (ADMIN y USUARIO) */}
          <Route path="/medidores" element={<MedidoresPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
