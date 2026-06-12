import { useState, useEffect } from 'react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { Building2, Layers, Users, Gauge, TrendingUp, TrendingDown, Activity, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import { Button } from '@/components/ui/button'
import { dashboardService, type DashboardStats } from '@/services/dashboard.service'
import api from '@/lib/api'

// ─── Helpers de tiempo ───────────────────────────────────────────────────────
function getRelativeTime(isoDateString: string | null): string {
  if (!isoDateString) return 'Desconocido'
  const date = new Date(isoDateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return `Hace ${diffInSeconds} s`
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `Hace ${diffInHours} h`
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) return `Hace ${diffInDays} d`
  return date.toLocaleDateString()
}

// ─── Componentes auxiliares ──────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <div className="h-4 w-24 animate-pulse rounded bg-muted"></div>
            <div className="h-8 w-16 animate-pulse rounded bg-muted"></div>
            <div className="h-3 w-20 animate-pulse rounded bg-muted"></div>
          </div>
          <div className="h-12 w-12 animate-pulse rounded-xl bg-muted"></div>
        </div>
      </CardContent>
    </Card>
  )
}

function SkeletonChart() {
  return (
    <Card>
      <CardHeader>
        <div className="h-5 w-40 animate-pulse rounded bg-muted mb-2"></div>
        <div className="h-4 w-60 animate-pulse rounded bg-muted"></div>
      </CardHeader>
      <CardContent>
        <div className="h-[220px] w-full animate-pulse rounded-lg bg-muted/50"></div>
      </CardContent>
    </Card>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [totalPuntosMedicion, setTotalPuntosMedicion] = useState<number>(0)

  const fetchStats = async () => {
    setIsLoading(true)
    try {
      const data = await dashboardService.getStats()
      setStats(data)
    } catch (error) {
      toast.error('Error al cargar métricas del Dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    // TAREA 3: Lógica para llamar al endpoint genérico de puntos de medición
    api.get('/api/dashboard/stats/puntos-medicion')
      .then(res => setTotalPuntosMedicion(res.data?.total || res.data || 0))
      .catch(() => console.error('Error al cargar puntos de medición'))
  }, [])

  if (isLoading || !stats) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <SkeletonChart />
          <SkeletonChart />
        </div>
        <Card>
          <CardHeader>
            <div className="h-5 w-40 animate-pulse rounded bg-muted mb-2"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between py-2">
                  <div className="flex gap-3">
                    <div className="h-6 w-16 animate-pulse rounded bg-muted"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-40 animate-pulse rounded bg-muted"></div>
                      <div className="h-3 w-24 animate-pulse rounded bg-muted"></div>
                    </div>
                  </div>
                  <div className="h-3 w-16 animate-pulse rounded bg-muted"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const kpiCards = [
    {
      id: 'kpi-clientes',
      title: 'Empresas / Clientes',
      value: stats.totalEmpresas,
      change: 'Total registrados',
      trend: 'up',
      icon: Users,
      color: 'text-accent',
      bg: 'bg-accent/10',
    },
    {
      id: 'kpi-edificios',
      title: 'Total Infraestructura',
      value: stats.totalEdificios,
      change: 'Unidades principales',
      trend: 'up',
      icon: Building2,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      id: 'kpi-pisos',
      title: 'Unidades / Pisos / Bloques',
      value: stats.totalPisos,
      change: 'Niveles intermedios',
      trend: 'up',
      icon: Layers,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      id: 'kpi-medidores',
      title: 'Puntos de Medición',
      value: totalPuntosMedicion,
      change: 'Arrendatarios activos',
      trend: 'up',
      icon: Gauge,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
  ]

  // Normalizar datos de actividad reciente para coincidir con la vista
  const actividadReciente = stats.actividadReciente.map(item => {
    let accionTexto = ''
    if (item.consumo != null) {
      accionTexto = `Lectura de ${Number(item.voltaje).toFixed(2)}V (Δ ${Number(item.consumo).toFixed(2)}V)`
    } else {
      accionTexto = `Lectura inicial de ${Number(item.voltaje).toFixed(2)}V registrada`
    }

    return {
      id: item.id,
      accion: accionTexto,
      edificio: `${item.empresaNombre} - ${item.puntoMedicion}`,
      tiempo: getRelativeTime(item.createdAt),
      tipo: item.consumo == null ? 'nuevo' : 'actualización'
    }
  })

  const tipoBadge: Record<string, string> = {
    nuevo: 'bg-primary/10 text-primary',
    actualización: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Dashboard General</h2>
        <Button variant="outline" size="sm" onClick={fetchStats} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map(card => (
          <Card key={card.id} id={card.id} className="relative overflow-hidden transition-shadow hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                  <p className="mt-1 text-3xl font-bold tracking-tight text-foreground">{card.value}</p>
                  <div className="mt-2 flex items-center gap-1">
                    {card.trend === 'up' ? (
                      <TrendingUp className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-destructive" />
                    )}
                    <span className={`text-xs font-medium ${card.trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
                      {card.change}
                    </span>
                  </div>
                </div>
                <div className={`rounded-xl p-3 ${card.bg}`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
            <div className={`absolute bottom-0 left-0 h-1 w-full ${card.trend === 'up' ? 'bg-gradient-to-r from-primary/50 to-primary' : 'bg-gradient-to-r from-destructive/50 to-destructive'}`} />
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Gráfico 1: Medidores Registrados */}
        <Card id="chart-medidores">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-primary" />
              Nuevas Lecturas por Mes
            </CardTitle>
            <CardDescription>Cantidad de registros capturados en los últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.medidoresPorMes} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  cursor={{ fill: 'currentColor', fillOpacity: 0.05 }}
                />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="registrados" name="Lecturas Registradas" fill="oklch(0.50 0.22 240)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico 2: Consumo Mensual */}
        <Card id="chart-consumo">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-accent" />
              Consumo Total Mensual (Δ Voltaje)
            </CardTitle>
            <CardDescription>Sumatoria del consumo real de todos los medidores</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={stats.consumoMensual} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                <Line
                  type="monotone"
                  dataKey="consumo"
                  name="Consumo (V)"
                  stroke="oklch(0.72 0.19 45)"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: 'oklch(0.72 0.19 45)' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card id="recent-activity">
        <CardHeader>
          <CardTitle className="text-base">Últimas Lecturas Registradas</CardTitle>
          <CardDescription>Los 5 registros de medidores más recientes en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col divide-y divide-border">
            {actividadReciente.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No hay actividad reciente.</p>
            ) : (
              actividadReciente.map(item => (
                <div key={item.id} className="flex items-center justify-between py-3">
                  <div className="flex items-start gap-3">
                    <Badge
                      variant="secondary"
                      className={`mt-0.5 shrink-0 text-[10px] font-medium capitalize ${tipoBadge[item.tipo]}`}
                    >
                      {item.tipo}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.accion}</p>
                      <p className="text-xs text-muted-foreground">{item.edificio}</p>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{item.tiempo}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
