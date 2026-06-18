import api from '@/lib/api'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface LoginPayload {
  username: string
  password: string
}

/** Coincide con el LoginResponse del backend:
 *  { "username": "admin", "role": "ADMIN" }
 */
export interface LoginResult {
  username: string
  role?: string | null
}

export interface AuthMe {
  username: string
  role: string
  tenantId: string
}

// ─── Funciones de API ─────────────────────────────────────────────────────────

/**
 * POST /api/auth/login
 * Envía credenciales y retorna el JWT del backend.
 * Lanza un error Axios si las credenciales son incorrectas (401).
 */
export async function loginRequest(payload: LoginPayload): Promise<LoginResult> {
  const { data } = await api.post<LoginResult>('/api/auth/login', payload)
  return data
}

export async function logoutRequest(): Promise<void> {
  await api.post('/api/auth/logout')
}

export async function csrfRequest(): Promise<void> {
  await api.get('/api/auth/csrf')
}

export async function meRequest(): Promise<AuthMe> {
  const { data } = await api.get<AuthMe>('/api/auth/me')
  return data
}
