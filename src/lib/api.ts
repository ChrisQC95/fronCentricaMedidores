import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

export const TOKEN_KEY = 'centrica_token'
export const USERNAME_KEY = 'centrica_user'

const BASE_URL = import.meta.env.VITE_API_URL || 'https://backendcentricamedidores.onrender.com'
const XSRF_COOKIE_NAME = 'XSRF-TOKEN'
const XSRF_HEADER_NAME = 'X-XSRF-TOKEN'
const UNSAFE_METHODS = new Set(['post', 'put', 'patch', 'delete'])

let csrfRequestInFlight: Promise<string | null> | null = null

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10_000,
  withCredentials: true,
  xsrfCookieName: XSRF_COOKIE_NAME,
  xsrfHeaderName: XSRF_HEADER_NAME,
  withXSRFToken: true,
})

function readCookie(name: string): string | null {
  const cookie = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${name}=`))

  return cookie ? decodeURIComponent(cookie.split('=').slice(1).join('=')) : null
}

async function ensureCsrfToken(): Promise<string | null> {
  const existingToken = readCookie(XSRF_COOKIE_NAME)
  if (existingToken) return existingToken

  if (!csrfRequestInFlight) {
    csrfRequestInFlight = fetch(`${BASE_URL}/api/auth/csrf`, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })
      .then(async response => {
        if (!response.ok) return null
        const body = await response.json().catch(() => null)
        return readCookie(XSRF_COOKIE_NAME) || body?.token || null
      })
      .finally(() => {
        csrfRequestInFlight = null
      })
  }

  return csrfRequestInFlight
}

function isAuthLogin(config: InternalAxiosRequestConfig): boolean {
  return Boolean(config.url?.includes('/api/auth/login') || config.url === '/auth/login')
}

api.interceptors.request.use(async config => {
  const method = (config.method || 'get').toLowerCase()

  if (UNSAFE_METHODS.has(method) && !isAuthLogin(config)) {
    const csrfToken = await ensureCsrfToken()
    if (csrfToken) {
      config.headers.set(XSRF_HEADER_NAME, csrfToken)
    }
  }

  return config
})

api.interceptors.response.use(
  response => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const isLoginEndpoint = error.config?.url?.includes('/api/auth/login')
      if (!isLoginEndpoint) {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USERNAME_KEY)
        localStorage.removeItem('user_role')
        localStorage.removeItem('tenant_id')
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export default api
