import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { Gauge, Eye, EyeOff, Lock, User, ShieldAlert } from 'lucide-react'
import { isAxiosError } from 'axios'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function LoginPage() {
  const { login, isAuthenticated } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Si ya está autenticado, redirigir al dashboard
  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!username.trim() || !password.trim()) {
      setError('Por favor ingresa tu usuario y contraseña.')
      return
    }

    setIsLoading(true)
    try {
      // Llama al backend real: POST /api/auth/login
      // En caso de éxito, login() persiste el token y actualiza isAuthenticated.
      // El Navigate de arriba redirigirá automáticamente al Dashboard.
      await login(username, password)
    } catch (err) {
      if (isAxiosError(err)) {
        const status = err.response?.status
        if (status === 401 || status === 403) {
          setError('Credenciales incorrectas. Verifica tu usuario y contraseña.')
        } else if (err.code === 'ECONNABORTED' || err.code === 'ERR_NETWORK') {
          setError('No se pudo conectar al servidor. Verifica que el backend esté activo.')
        } else {
          setError(`Error del servidor (${status ?? 'desconocido'}). Intenta de nuevo.`)
        }
      } else {
        setError('Error inesperado. Por favor intenta de nuevo.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
      {/* Background decorative elements */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo + Brand */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25">
            <Gauge className="h-8 w-8 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Centrica Medidores</h1>
            <p className="text-sm text-muted-foreground">Plataforma de Gestión Administrativa</p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="border-border/50 shadow-xl shadow-black/5">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Iniciar Sesión</CardTitle>
            <CardDescription>
              Ingresa tus credenciales para acceder al sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} id="login-form" className="flex flex-col gap-4">

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive" className="border-destructive/50 bg-destructive/5">
                  <ShieldAlert className="h-4 w-4" />
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              {/* Username */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="username" className="text-sm font-medium text-foreground">
                  Usuario
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Ingresa tu usuario"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="pl-9"
                    autoComplete="username"
                    autoFocus
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Ingresa tu contraseña"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="pl-9 pr-9"
                    autoComplete="current-password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <Button
                id="login-submit-btn"
                type="submit"
                className="mt-2 h-10 w-full font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                    Verificando...
                  </span>
                ) : (
                  'Ingresar al Sistema'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          © 2025 Centrica Medidores. Todos los derechos reservados.
        </p>
      </div>
    </div>
  )
}
