import api from '@/lib/api'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface LoginPayload {
  username: string
  password: string
}

/** Coincide con el LoginResponse del backend:
 *  { "token": "eyJ...", "username": "admin", "type": "Bearer" }
 */
export interface LoginResult {
  token: string
  username: string
  type: string
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
