import axios, { type AxiosError } from 'axios'

// ─── Constantes ───────────────────────────────────────────────────────────────
export const TOKEN_KEY   = 'centrica_token'
export const USERNAME_KEY = 'centrica_user'
const BASE_URL = 'http://localhost:8080'

// ─── Instancia Axios ──────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10_000,
})

// ─── Interceptor de Request: adjunta Bearer token ────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ─── Interceptor de Response: maneja 401 global (token expirado) ─────────────
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Si el token expiró o no es válido → limpiar sesión y redirigir al login
    if (error.response?.status === 401) {
      const isLoginEndpoint = error.config?.url?.includes('/api/auth/login')
      if (!isLoginEndpoint) {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USERNAME_KEY)
        // Redirigir a login sin usar el router (fuera del árbol React)
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
