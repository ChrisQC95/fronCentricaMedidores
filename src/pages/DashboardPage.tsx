import { useState, useEffect, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area, Legend
} from 'recharts'
import {
  Zap, Droplets, Gauge, Building2,
  TrendingUp, TrendingDown, RefreshCw,
  Activity, Clock, AlertCircle, CheckCircle2, Minus
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { dashboardService, type DashboardStats } from '@/services/dashboard.service'

// ─── Types ────────────────────────────────────────────────────────────────────
type ServicioFilter = 'electricidad' | 'agua' | 'ambos'

// ─── Helper: tiempo relativo ──────────────────────────────────────────────────
function getRelativeTime(isoDateString: string | null): string {
  if (!isoDateString) return 'Desconocido'
  const date = new Date(isoDateString)
  const now = new Date()
  const s = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (s < 60) return `Hace ${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `Hace ${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `Hace ${h}h`
  const d = Math.floor(h / 24)
  if (d < 30) return `Hace ${d}d`
  return date.toLocaleDateString('es-PE')
}

// ─── Helper: formato numérico ─────────────────────────────────────────────────
function fmt(val: number | string | null | undefined, dec = 2): string {
  if (val == null) return '0'
  const n = typeof val === 'string' ? parseFloat(val) : Number(val)
  if (isNaN(n)) return '0'
  return n.toLocaleString('es-PE', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}

// ─── Skeleton helpers ─────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-card p-6 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <div className="h-3 w-28 rounded-full bg-muted" />
          <div className="h-9 w-20 rounded-lg bg-muted" />
          <div className="h-3 w-24 rounded-full bg-muted" />
        </div>
        <div className="h-14 w-14 rounded-2xl bg-muted" />
      </div>
    </div>
  )
}
function SkeletonChart() {
  return (
    <div className="rounded-2xl border border-border/40 bg-card p-6 animate-pulse space-y-4">
      <div className="flex gap-3">
        <div className="h-8 w-8 rounded-lg bg-muted" />
        <div className="space-y-2">
          <div className="h-4 w-44 rounded-full bg-muted" />
          <div className="h-3 w-60 rounded-full bg-muted" />
        </div>
      </div>
      <div className="h-[240px] w-full rounded-xl bg-muted/40" />
    </div>
  )
}

// ─── Custom Tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border/60 bg-card/95 p-3 shadow-xl backdrop-blur-sm min-w-[160px]">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-xs text-muted-foreground">{entry.name}</span>
          </div>
          <span className="text-xs font-semibold text-foreground">{fmt(entry.value)}</span>
        </div>
      ))}
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
interface KpiProps {
  id: string; title: string; value: React.ReactNode; subtitle: string
  icon: React.ElementType; topGradient: string; iconColor: string; iconBg: string
}
function KpiCard({ id, title, value, subtitle, icon: Icon, topGradient, iconColor, iconBg }: KpiProps) {
  return (
    <div id={id} className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
      <div className={`absolute inset-x-0 top-0 h-0.5 ${topGradient}`} />
      <div className={`absolute -top-6 -right-6 h-24 w-24 rounded-full opacity-[0.06] blur-2xl ${iconBg}`} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">{title}</p>
          <div className="mt-1.5 text-3xl font-bold tracking-tight text-foreground leading-none">{value}</div>
          <p className="mt-2 text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>
    </div>
  )
}

// ─── Tabs de filtro reutilizable ───────────────────────────────────────────────
function ServicioTabs({ value, onChange, className = '' }: {
  value: ServicioFilter; onChange: (v: ServicioFilter) => void; className?: string
}) {
  return (
    <Tabs value={value} onValueChange={v => onChange(v as ServicioFilter)} className={className}>
      <TabsList className="h-8 rounded-lg bg-muted/60 p-0.5">
        <TabsTrigger value="electricidad" className="h-7 gap-1.5 px-3 text-xs rounded-md data-[state=active]:bg-background">
          <Zap className="h-3 w-3 text-amber-500" />Luz
        </TabsTrigger>
        <TabsTrigger value="agua" className="h-7 gap-1.5 px-3 text-xs rounded-md data-[state=active]:bg-background">
          <Droplets className="h-3 w-3 text-blue-500" />Agua
        </TabsTrigger>
        <TabsTrigger value="ambos" className="h-7 gap-1.5 px-3 text-xs rounded-md data-[state=active]:bg-background">
          <Activity className="h-3 w-3 text-violet-500" />Ambos
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [graficoFiltro, setGraficoFiltro] = useState<ServicioFilter>('electricidad')
  const [actividadFiltro, setActividadFiltro] = useState<ServicioFilter>('ambos')

  const fetchStats = async () => {
    setIsLoading(true)
    try {
      const data = await dashboardService.getStats()
      setStats(data)
    } catch {
      toast.error('Error al cargar métricas del Dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchStats() }, [])

  // ── Datos del gráfico según filtro ────────────────────────────────────────
  const graficoData = useMemo(() => {
    if (!stats) return []
    if (graficoFiltro === 'electricidad') {
      return stats.consumoMensualLuz.map(d => ({ mes: d.mes, 'Electricidad (kWh)': d.consumoLuz }))
    }
    if (graficoFiltro === 'agua') {
      return stats.consumoMensualAgua.map(d => ({ mes: d.mes, 'Agua (m³)': d.consumoLuz }))
    }
    // ambos: merge por mes
    const map = new Map<string, { mes: string; 'Electricidad (kWh)': number; 'Agua (m³)': number }>()
    stats.consumoMensualLuz.forEach(d => map.set(d.mes, { mes: d.mes, 'Electricidad (kWh)': Number(d.consumoLuz), 'Agua (m³)': 0 }))
    stats.consumoMensualAgua.forEach(d => {
      const existing = map.get(d.mes)
      if (existing) existing['Agua (m³)'] = Number(d.consumoLuz)
      else map.set(d.mes, { mes: d.mes, 'Electricidad (kWh)': 0, 'Agua (m³)': Number(d.consumoLuz) })
    })
    return Array.from(map.values())
  }, [stats, graficoFiltro]) as any[]

  // ── Actividad filtrada ────────────────────────────────────────────────────
  const actividadFiltrada = useMemo(() => {
    if (!stats) return []
    const items = stats.actividadReciente
    if (actividadFiltro === 'electricidad') return items.filter(i => i.tipoServicio === 1)
    if (actividadFiltro === 'agua') return items.filter(i => i.tipoServicio === 2)
    return items
  }, [stats, actividadFiltro])

  // ── Tendencia label ───────────────────────────────────────────────────────
  const tendencia = stats?.consumoTendenciaPct
  const tendenciaLabel = tendencia == null
    ? null
    : tendencia > 0 ? `+${fmt(tendencia, 1)}%` : `${fmt(tendencia, 1)}%`

  if (isLoading || !stats) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-7 w-44 animate-pulse rounded-lg bg-muted" />
            <div className="h-3.5 w-64 animate-pulse rounded-full bg-muted" />
          </div>
          <div className="h-9 w-28 animate-pulse rounded-xl bg-muted" />
        </div>
        <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
          <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
        <div className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-3"><SkeletonChart /></div>
          <div className="lg:col-span-2"><SkeletonChart /></div>
        </div>
        <SkeletonChart />
        <SkeletonChart />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Gestión de medidores · Electricidad &amp; Agua</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStats} className="gap-2 self-start sm:self-auto rounded-xl">
          <RefreshCw className="h-3.5 w-3.5" />Actualizar
        </Button>
      </div>

      {/* ── KPI Row 1: Puntos + Pendientes + Tendencia + Empresas ─────── */}
      <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
        <KpiCard
          id="kpi-medidores"
          title="Puntos de Medición"
          value={stats.totalPuntosMedicion}
          subtitle="Nodos en red"
          icon={Gauge}
          topGradient="bg-gradient-to-r from-violet-400 to-purple-600"
          iconColor="text-violet-500"
          iconBg="bg-violet-500/15"
        />
        <KpiCard
          id="kpi-pendientes"
          title="Pendientes Mes Actual"
          value={
            <span className={stats.pendingReadings > 0 ? 'text-amber-500' : 'text-emerald-500'}>
              {stats.pendingReadings}
            </span>
          }
          subtitle={stats.pendingReadings === 0 ? 'Todas las lecturas al día ✓' : 'Medidores sin lectura este mes'}
          icon={stats.pendingReadings === 0 ? CheckCircle2 : AlertCircle}
          topGradient={stats.pendingReadings === 0 ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'}
          iconColor={stats.pendingReadings === 0 ? 'text-emerald-500' : 'text-amber-500'}
          iconBg={stats.pendingReadings === 0 ? 'bg-emerald-500/15' : 'bg-amber-500/15'}
        />
        <KpiCard
          id="kpi-tendencia"
          title="Tendencia de Consumo"
          value={
            <div className="flex items-baseline gap-1.5">
              {tendenciaLabel == null
                ? <span className="text-2xl text-muted-foreground">—</span>
                : <>
                  {tendencia! > 0
                    ? <TrendingUp className="h-5 w-5 text-red-500 mt-1" />
                    : tendencia! < 0
                      ? <TrendingDown className="h-5 w-5 text-emerald-500 mt-1" />
                      : <Minus className="h-5 w-5 text-muted-foreground mt-1" />
                  }
                  <span className={`text-2xl font-bold ${tendencia! > 0 ? 'text-red-500' : tendencia! < 0 ? 'text-emerald-500' : ''}`}>
                    {tendenciaLabel}
                  </span>
                </>
              }
            </div>
          }
          subtitle="Mes actual vs mes anterior"
          icon={TrendingUp}
          topGradient={tendencia != null && tendencia < 0 ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-gradient-to-r from-red-400 to-rose-500'}
          iconColor="text-rose-500"
          iconBg="bg-rose-500/15"
        />
        <KpiCard
          id="kpi-clientes"
          title="Empresas"
          value={stats.totalEmpresas}
          subtitle="Clientes registrados"
          icon={Building2}
          topGradient="bg-gradient-to-r from-sky-400 to-blue-600"
          iconColor="text-sky-500"
          iconBg="bg-sky-500/15"
        />
      </div>

      {/* ── KPI Row 2: Consumos ─────────────────────────────────────────── */}
      <div className="grid gap-4 grid-cols-2">
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 transition-all hover:shadow-md">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-amber-400 to-orange-500" />
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400">Consumo Eléctrico</p>
                <Badge variant="secondary" className="text-[9px] border-0 bg-amber-500/15 text-amber-600 dark:text-amber-400 py-0">kWh</Badge>
              </div>
              <p className="text-3xl font-bold text-foreground">{fmt(stats.totalElectricidad)}</p>
              <p className="text-xs text-muted-foreground mt-1">Energía acumulada total</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10">
              <Zap className="h-6 w-6 text-amber-500" />
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-blue-500/30 bg-blue-500/5 p-5 transition-all hover:shadow-md">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-blue-400 to-cyan-500" />
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Droplets className="h-3.5 w-3.5 text-blue-500" />
                <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">Consumo de Agua</p>
                <Badge variant="secondary" className="text-[9px] border-0 bg-blue-500/15 text-blue-600 dark:text-blue-400 py-0">m³</Badge>
              </div>
              <p className="text-3xl font-bold text-foreground">{fmt(stats.totalAgua)}</p>
              <p className="text-xs text-muted-foreground mt-1">Volumen acumulado total</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10">
              <Droplets className="h-6 w-6 text-blue-500" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Charts Row ──────────────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Lecturas por mes (bar) */}
        <Card id="chart-lecturas" className="lg:col-span-3 rounded-2xl border-border/40">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Activity className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">Lecturas Registradas por Mes</CardTitle>
                <CardDescription className="text-xs">Últimos 6 meses</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={stats.medidoresPorMes} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.60 0.22 255)" stopOpacity={1} />
                    <stop offset="100%" stopColor="oklch(0.45 0.20 255)" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.07} vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 11, opacity: 0.6 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, opacity: 0.6 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'currentColor', fillOpacity: 0.04 }} />
                <Bar dataKey="registrados" name="Lecturas" fill="url(#barGrad)" radius={[6, 6, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Resumen distribución */}
        <Card className="lg:col-span-2 rounded-2xl border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Infraestructura</CardTitle>
            <CardDescription className="text-xs">Desglose de nodos en red</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {[
              { label: 'Unidades Principales', value: stats.totalEdificios, color: 'bg-violet-500' },
              { label: 'Pisos / Bloques', value: stats.totalPisos, color: 'bg-blue-500' },
              { label: 'Espacios (ENST)', value: stats.totalEnst, color: 'bg-emerald-500' },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between rounded-xl bg-muted/30 px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <div className={`h-2 w-2 rounded-full ${row.color}`} />
                  <span className="text-xs text-muted-foreground">{row.label}</span>
                </div>
                <span className="text-sm font-bold text-foreground">{row.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ── Gráfico Consumo Interactivo ────────────────────────────────── */}
      <Card id="chart-consumo" className="rounded-2xl border-border/40">
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                <TrendingUp className="h-4 w-4 text-accent" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">Consumo Mensual Acumulado</CardTitle>
                <CardDescription className="text-xs">Últimos 6 meses — filtra por servicio</CardDescription>
              </div>
            </div>
            <ServicioTabs value={graficoFiltro} onChange={setGraficoFiltro} />
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={graficoData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradLuz" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradAgua" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.07} vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 11, opacity: 0.6 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, opacity: 0.6 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              {(graficoFiltro === 'electricidad' || graficoFiltro === 'ambos') && (
                <Area type="monotone" dataKey="Electricidad (kWh)" stroke="#f59e0b" strokeWidth={2.5}
                  fill="url(#gradLuz)" dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: '#f59e0b', fill: 'white' }} />
              )}
              {(graficoFiltro === 'agua' || graficoFiltro === 'ambos') && (
                <Area type="monotone" dataKey="Agua (m³)" stroke="#3b82f6" strokeWidth={2.5}
                  fill="url(#gradAgua)" dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: '#3b82f6', fill: 'white' }} />
              )}
              {graficoFiltro === 'ambos' && <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />}
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ── Actividad Reciente ────────────────────────────────────────── */}
      <Card id="recent-activity" className="rounded-2xl border-border/40">
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                <Clock className="h-4 w-4 text-violet-500" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">Últimas Lecturas</CardTitle>
                <CardDescription className="text-xs">10 registros más recientes</CardDescription>
              </div>
            </div>
            <ServicioTabs value={actividadFiltro} onChange={setActividadFiltro} />
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {actividadFiltrada.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Activity className="h-10 w-10 text-muted-foreground/20 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">Sin registros para este filtro</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border/40">
              {actividadFiltrada.map(item => {
                const esLuz = item.tipoServicio === 1
                const esAgua = item.tipoServicio === 2
                return (
                  <div key={item.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Dot */}
                      <div className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${item.consumo == null ? 'bg-primary' : 'bg-emerald-500'}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          {/* Service badge */}
                          {esLuz && (
                            <Badge variant="secondary" className="h-5 border-0 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] px-1.5 gap-1">
                              <Zap className="h-2.5 w-2.5" />Luz
                            </Badge>
                          )}
                          {esAgua && (
                            <Badge variant="secondary" className="h-5 border-0 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] px-1.5 gap-1">
                              <Droplets className="h-2.5 w-2.5" />Agua
                            </Badge>
                          )}
                          <span className="text-sm font-medium text-foreground truncate">
                            {item.consumo != null
                              ? `${Number(item.voltaje).toFixed(1)} V · Δ ${Number(item.consumo).toFixed(1)} ${esLuz ? 'kWh' : 'm³'}`
                              : `Lectura inicial · ${Number(item.voltaje).toFixed(1)} V`
                            }
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{item.empresaNombre} · {item.puntoMedicion}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-xs text-muted-foreground tabular-nums">{getRelativeTime(item.createdAt)}</span>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] border-0 ${item.consumo == null ? 'bg-primary/10 text-primary' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}
                      >
                        {item.consumo == null ? 'nuevo' : 'actualización'}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
