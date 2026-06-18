import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { csrfRequest, loginRequest, logoutRequest, meRequest } from '@/lib/authService'
import { TOKEN_KEY, USERNAME_KEY } from '@/lib/api'

interface AuthContextType {
  isAuthenticated: boolean
  token: string | null
  username: string | null
  userRole: string | null
  tenantId: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const ROLE_KEY = 'user_role'
const TENANT_KEY = 'tenant_id'

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  localStorage.removeItem(TOKEN_KEY)

  const [token, setToken] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem(USERNAME_KEY))
  const [userRole, setUserRole] = useState<string | null>(() => localStorage.getItem(ROLE_KEY))
  const [tenantId, setTenantId] = useState<string | null>(() => localStorage.getItem(TENANT_KEY))

  const isAuthenticated = username !== null

  useEffect(() => {
    if (!username) return
    csrfRequest().catch(() => undefined)
    meRequest()
      .then(me => {
        localStorage.setItem(USERNAME_KEY, me.username)
        localStorage.setItem(ROLE_KEY, me.role)
        if (me.tenantId) localStorage.setItem(TENANT_KEY, me.tenantId)
        else localStorage.removeItem(TENANT_KEY)
        setUsername(me.username)
        setUserRole(me.role)
        setTenantId(me.tenantId || null)
      })
      .catch(() => {
        localStorage.removeItem(USERNAME_KEY)
        localStorage.removeItem(ROLE_KEY)
        localStorage.removeItem(TENANT_KEY)
        setUsername(null)
        setUserRole(null)
        setTenantId(null)
      })
  }, [username])

  const login = async (user: string, password: string): Promise<void> => {
    const result = await loginRequest({ username: user, password })
    await csrfRequest().catch(() => undefined)
    const me = await meRequest().catch(() => ({
      username: result.username,
      role: result.role || 'USUARIO',
      tenantId: '',
    }))

    localStorage.removeItem(TOKEN_KEY)
    localStorage.setItem(USERNAME_KEY, me.username)
    localStorage.setItem(ROLE_KEY, me.role)
    if (me.tenantId) localStorage.setItem(TENANT_KEY, me.tenantId)
    else localStorage.removeItem(TENANT_KEY)

    setToken(null)
    setUsername(me.username)
    setUserRole(me.role)
    setTenantId(me.tenantId || null)
  }

  const logout = () => {
    logoutRequest().catch(() => undefined)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USERNAME_KEY)
    localStorage.removeItem(ROLE_KEY)
    localStorage.removeItem(TENANT_KEY)
    setToken(null)
    setUsername(null)
    setUserRole(null)
    setTenantId(null)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, username, userRole, tenantId, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
