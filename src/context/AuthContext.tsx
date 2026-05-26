import { createContext, useContext, useState, type ReactNode } from 'react'
import { loginRequest } from '@/lib/authService'
import { TOKEN_KEY, USERNAME_KEY } from '@/lib/api'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface AuthContextType {
  /** true si hay un token JWT válido almacenado */
  isAuthenticated: boolean
  /** Token JWT en crudo (Bearer) */
  token: string | null
  /** Username del usuario autenticado */
  username: string | null
  /** Rol del usuario extraído del token JWT (ej. ADMIN, USUARIO) */
  userRole: string | null
  /**
   * Llama al backend y, si es exitoso, persiste el token y actualiza el estado.
   * Lanza un error (AxiosError) si las credenciales son incorrectas.
   */
  login: (username: string, password: string) => Promise<void>
  /** Limpia el token del estado y del localStorage */
  logout: () => void
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  // Inicializar desde localStorage para persistir sesión entre recargas
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem(TOKEN_KEY)
  )
  const [username, setUsername] = useState<string | null>(
    () => localStorage.getItem(USERNAME_KEY)
  )
  const [userRole, setUserRole] = useState<string | null>(
    () => localStorage.getItem('user_role')
  )

  /** Derivado: hay sesión activa si el token no es null */
  const isAuthenticated = token !== null

  /**
   * login() llama a POST /api/auth/login en el backend.
   * En caso de error (401, red caída, etc.) propaga el error
   * para que el componente que llama pueda manejarlo con try/catch.
   */
  const login = async (user: string, password: string): Promise<void> => {
    const result = await loginRequest({ username: user, password })
    
    // Decodificar JWT payload (header.payload.signature)
    let role = 'USUARIO'
    try {
      const payloadBase64 = result.token.split('.')[1]
      const payloadDecoded = JSON.parse(atob(payloadBase64))
      role = payloadDecoded.rol || 'USUARIO'
    } catch (e) {
      console.error('Error decodificando token', e)
    }

    // Persistir en localStorage
    localStorage.setItem(TOKEN_KEY, result.token)
    localStorage.setItem(USERNAME_KEY, result.username)
    localStorage.setItem('user_role', role)

    // Actualizar estado React
    setToken(result.token)
    setUsername(result.username)
    setUserRole(role)
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USERNAME_KEY)
    localStorage.removeItem('user_role')
    setToken(null)
    setUsername(null)
    setUserRole(null)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, username, userRole, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
