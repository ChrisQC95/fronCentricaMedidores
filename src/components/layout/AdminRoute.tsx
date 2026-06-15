import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export function AdminRoute() {
  const { userRole, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (userRole !== 'ADMIN' && userRole !== 'SUPERADMIN') {
    return <Navigate to="/medidores" replace />
  }

  return <Outlet />
}
