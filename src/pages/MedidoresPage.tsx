import { useState, useEffect, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import {
  Gauge, Plus, RefreshCw, Zap, TrendingUp,
  FileSpreadsheet, CalendarRange, Droplet, Filter,
} from 'lucide-react'
import { isAxiosError } from 'axios'
import { Button }   from '@/components/ui/button'
import { Badge }    from '@/components/ui/badge'
import { Label }    from '@/components/ui/label'
import { DataTable } from '@/components/empresas/EmpresaDataTable'
import { getMedidorColumns } from '@/components/medidores/MedidorColumns'
import { MedidorFormDialog, type MedidorFormValues } from '@/components/medidores/MedidorFormDialog'
import { MedidorViewDialog }  from '@/components/medidores/MedidorViewDialog'
import { medidorService, type RegistroMedidor } from '@/services/medidor.service'
import { infraestructuraService } from '@/services/infraestructura.service'
import { generateMedidoresExcel, buildPivot } from '@/utils/excelExport'
import { useAuth } from '@/context/AuthContext'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// ─── Tipos locales ─────────────────────────────────────────────────────────────
type TipoFiltro = 1 | 2 | 3  // 1=Luz, 2=Agua, 3=Ambos

// ─── Helpers de fechas ─────────────────────────────────────────────────────────
function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}
function firstDayOfMonthIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}
function formatNum(val: number): string {
  return val.toFixed(2)
}

// ══════════════════════════════════════════════════════════════════════════════
export function MedidoresPage() {
  const { userRole } = useAuth()

  // ─── Estado principal ──────────────────────────────────────────────────────
  const [registros,    setRegistros]    = useState<RegistroMedidor[]>([])
  const [isLoading,    setIsLoading]    = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isExporting,  setIsExporting]  = useState(false)

  // Filtro de tabla: 1=Electricidad, 2=Agua, 3=Ambos
  const [tipoFiltro, setTipoFiltro] = useState<TipoFiltro>(3)

  // Rango de fechas para el export (por defecto: mes actual)
  const [dateFrom, setDateFrom] = useState<string>(firstDayOfMonthIso)
  const [dateTo,   setDateTo]   = useState<string>(todayIso)
  const [tipoServicioExport, setTipoServicioExport] = useState<string>('0')

  // Dialogs
  const [formOpen, setFormOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [viewItem, setViewItem] = useState<RegistroMedidor | null>(null)
  const [submitError, setSubmitError] = useState<string | undefined>()

  // ─── Carga de datos ────────────────────────────────────────────────────────
  const fetchRegistros = useCallback(async () => {
    setIsLoading(true)
    try {
      // Cargamos todos y filtramos en cliente para que el cambio de filtro
      // sea instantáneo sin llamada extra al backend.
      const data = await medidorService.getAll()
      setRegistros(data.sort((a, b) => b.fechaRegistro.localeCompare(a.fechaRegistro)))
    } catch (err) {
      const msg = isAxiosError(err)
        ? `Error ${err.response?.status ?? ''}: ${err.response?.data?.error ?? 'No se pudieron cargar los registros.'}`
        : 'Error inesperado.'
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchRegistros() }, [fetchRegistros])

  // ─── Datos filtrados según tipoFiltro ──────────────────────────────────────
  const registrosFiltrados = useMemo(() => {
    if (tipoFiltro === 3) return registros
    return registros.filter(r => r.tipoServicio === tipoFiltro)
  }, [registros, tipoFiltro])

  // ─── Estadísticas separadas por tipo ──────────────────────────────────────
  const stats = useMemo(() => {
    const luz  = registros.filter(r => r.tipoServicio === 1)
    const agua = registros.filter(r => r.tipoServicio === 2)

    const sumConsumo = (arr: RegistroMedidor[]) =>
      arr.filter(r => r.consumo != null).reduce((s, r) => s + Number(r.consumo), 0)

    const avgMedida = (arr: RegistroMedidor[]) =>
      arr.length ? arr.reduce((s, r) => s + Number(r.voltaje), 0) / arr.length : null

    return {
      totalLuz:        luz.length,
      totalAgua:       agua.length,
      consumoLuz:      sumConsumo(luz),
      consumoAgua:     sumConsumo(agua),
      avgMedidaLuz:    avgMedida(luz),
      avgMedidaAgua:   avgMedida(agua),
      // Para filtros únicos
      conConsumo:      registrosFiltrados.filter(r => r.consumo != null).length,
      avgFiltrado:     avgMedida(registrosFiltrados),
    }
  }, [registros, registrosFiltrados])

  // ─── Handler: Guardar nuevo registro ──────────────────────────────────────
  const handleSave = async (values: MedidorFormValues) => {
    setIsSubmitting(true)
    try {
      const created = await medidorService.create({
        infraestructuraId: values.infraestructuraId,
        voltaje:           values.voltaje,
        tipoServicio:      values.tipoServicio,
        fotoUrl:           values.fotoUrl ?? null,
        observacion:       values.observacion ?? null,
      })
      setRegistros(prev => [created, ...prev])
      setFormOpen(false)
      const unidad = created.tipoServicio === 2 ? 'm³' : 'kWh'
      toast.success('Lectura registrada', {
        description: `${Number(created.voltaje).toFixed(2)} ${unidad} en "${created.infraestructuraNombre}".`,
      })
      if (created.consumo != null) {
        toast.info(`Consumo: ${Number(created.consumo).toFixed(2)} ${unidad}`, {
          description: 'Calculado automáticamente por el trigger de la BD.',
        })
      }
    } catch (err) {
      if (isAxiosError(err)) {
        const status = err.response?.status
        const msg    = err.response?.data?.error ?? 'No se pudo guardar el registro.'
        
        // Si el backend mandó un 400 y parece un error de validación/trigger, lo mostramos en el modal
        if (status === 400 || status === 500) {
           setSubmitError(msg)
        } else if (status === 404) {
           toast.error('Punto no encontrado',  { description: msg })
        } else {
           toast.error('Error al registrar',    { description: msg })
        }
      } else {
        toast.error('Error inesperado al guardar.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChangeForm = (open: boolean) => {
    setFormOpen(open)
    if (!open) setSubmitError(undefined) // limpiar error al cerrar
  }

  // ─── Handler: Exportar Excel ───────────────────────────────────────────────
  const handleExport = async () => {
    if (!dateFrom || !dateTo) {
      toast.warning('Selecciona el rango de fechas antes de exportar.')
      return
    }
    if (dateFrom > dateTo) {
      toast.warning('La fecha de inicio no puede ser posterior a la fecha fin.')
      return
    }

    setIsExporting(true)
    const toastId = toast.loading('Descargando Reporte Excel...')

    try {
      const infraList = await infraestructuraService.getAll()
      const infraMap = new Map(infraList.map(i => [i.id, i]))

      const tipo = parseInt(tipoServicioExport, 10)
      const filteredRecords = registros.filter(r => {
        const inDate = r.fechaRegistro >= dateFrom && r.fechaRegistro <= dateTo
        const inType = tipo === 0 ? true : r.tipoServicio === tipo
        return inDate && inType
      })

      if (filteredRecords.length === 0) {
        toast.dismiss(toastId)
        toast.warning('No hay registros en este rango para exportar.')
        return
      }

      const { pivot, months } = buildPivot(filteredRecords, infraMap)
      await generateMedidoresExcel(pivot, months, dateFrom, dateTo)

      toast.dismiss(toastId)
      toast.success('Excel descargado con éxito')
    } catch (err) {
      toast.dismiss(toastId)
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      toast.error('Error al generar Excel', { description: msg })
    } finally {
      setIsExporting(false)
    }
  }

  // ─── Columnas dinámicas ────────────────────────────────────────────────────
  const handleView = (item: RegistroMedidor) => { setViewItem(item); setViewOpen(true) }
  const columns    = getMedidorColumns({ onView: handleView, tipoFiltro })

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col gap-6">

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10">
            <Gauge className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Registro de Medidores</h1>
            <p className="text-sm text-muted-foreground">
              Historial de lecturas por punto de medición — separadas por tipo de servicio.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={fetchRegistros} disabled={isLoading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button
            size="sm"
            onClick={() => setFormOpen(true)}
            className="gap-2 bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-md shadow-orange-500/25"
          >
            <Plus className="h-4 w-4" />
            Nueva Lectura
          </Button>
        </div>
      </div>

      {/* ── Tarjetas de Resumen ──────────────────────────────────────────────── */}
      {tipoFiltro === 3 ? (
        /* Modo "Ambos": 4 tarjetas separadas para no mezclar unidades */
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {/* Total Electricidad */}
          <div className="rounded-xl border border-orange-200 bg-orange-50 dark:border-orange-900/40 dark:bg-orange-950/20 px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-4 w-4 text-orange-500" />
              <span className="text-xs font-semibold text-orange-700 dark:text-orange-400">Lecturas Luz</span>
            </div>
            <p className="text-2xl font-bold tabular-nums text-orange-600 dark:text-orange-300">
              {stats.totalLuz}
            </p>
            <p className="text-[11px] text-orange-500 dark:text-orange-500 mt-0.5">
              Σ consumo: <span className="font-bold">{formatNum(stats.consumoLuz)} kWh</span>
            </p>
          </div>

          {/* Promedio Electricidad */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20 px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Prom. Medida Luz</span>
            </div>
            <p className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-300">
              {stats.avgMedidaLuz != null ? formatNum(stats.avgMedidaLuz) : '—'}
            </p>
            <p className="text-[11px] text-amber-500 mt-0.5">kWh por lectura</p>
          </div>

          {/* Total Agua */}
          <div className="rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-900/40 dark:bg-blue-950/20 px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <Droplet className="h-4 w-4 text-blue-500" />
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">Lecturas Agua</span>
            </div>
            <p className="text-2xl font-bold tabular-nums text-blue-600 dark:text-blue-300">
              {stats.totalAgua}
            </p>
            <p className="text-[11px] text-blue-500 dark:text-blue-500 mt-0.5">
              Σ consumo: <span className="font-bold">{formatNum(stats.consumoAgua)} m³</span>
            </p>
          </div>

          {/* Promedio Agua */}
          <div className="rounded-xl border border-cyan-200 bg-cyan-50 dark:border-cyan-900/40 dark:bg-cyan-950/20 px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-cyan-500" />
              <span className="text-xs font-semibold text-cyan-700 dark:text-cyan-400">Prom. Medida Agua</span>
            </div>
            <p className="text-2xl font-bold tabular-nums text-cyan-600 dark:text-cyan-300">
              {stats.avgMedidaAgua != null ? formatNum(stats.avgMedidaAgua) : '—'}
            </p>
            <p className="text-[11px] text-cyan-500 mt-0.5">m³ por lectura</p>
          </div>
        </div>
      ) : (
        /* Modo filtro único: badges compactos */
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-xs">
            <span className="font-bold text-orange-500">{registrosFiltrados.length}</span>
            registro{registrosFiltrados.length !== 1 ? 's' : ''}
          </Badge>
          <Badge variant="outline" className="gap-1.5 px-3 py-1 text-xs">
            {tipoFiltro === 2
              ? <Droplet className="h-3 w-3 text-blue-500" />
              : <Zap className="h-3 w-3 text-emerald-500" />
            }
            <span className="font-bold text-emerald-600">{stats.conConsumo}</span>
            con consumo calculado
          </Badge>
          <Badge variant="outline" className="gap-1.5 px-3 py-1 text-xs">
            <TrendingUp className="h-3 w-3 text-primary" />
            Promedio:&nbsp;
            <span className="font-bold tabular-nums text-primary">
              {stats.avgFiltrado != null ? formatNum(stats.avgFiltrado) : '—'}
              {tipoFiltro === 2 ? ' m³' : ' kWh'}
            </span>
          </Badge>
        </div>
      )}

      {/* ── Panel de Exportación ─────────────────────────────────────────────── */}
      {userRole === 'ADMIN' && (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-2 border-b border-border px-5 py-3">
            <CalendarRange className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Exportar Reporte Excel</span>
          </div>

          <div className="flex flex-wrap items-end gap-4 px-5 py-4">
            {/* Fecha Desde */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dateFrom" className="text-xs font-medium text-muted-foreground">
                Fecha desde
              </Label>
              <input
                id="dateFrom"
                type="date"
                value={dateFrom}
                max={dateTo}
                onChange={e => setDateFrom(e.target.value)}
                disabled={isExporting}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>

            {/* Fecha Hasta */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dateTo" className="text-xs font-medium text-muted-foreground">
                Fecha hasta
              </Label>
              <input
                id="dateTo"
                type="date"
                value={dateTo}
                min={dateFrom}
                onChange={e => setDateTo(e.target.value)}
                disabled={isExporting}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>

            {/* Tipo de Servicio Exportación */}
            <div className="flex flex-col gap-1.5 w-44">
              <Label className="text-xs font-medium text-muted-foreground">
                Tipo de Servicio
              </Label>
              <Select
                value={tipoServicioExport}
                onValueChange={setTipoServicioExport}
                disabled={isExporting}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex gap-0.5">
                        <Zap className="h-3 w-3 text-orange-500" />
                        <Droplet className="h-3 w-3 text-blue-500" />
                      </span>
                      <span>Ambos</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="1">
                    <div className="flex items-center gap-2">
                      <Zap className="h-3 w-3 text-orange-500" />
                      <span>Solo Electricidad</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="2">
                    <div className="flex items-center gap-2">
                      <Droplet className="h-3 w-3 text-blue-500" />
                      <span>Solo Agua</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Botón exportar */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={isExporting || isLoading || !dateFrom || !dateTo}
              className="h-9 gap-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
            >
              {isExporting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600/30 border-t-emerald-600" />
                  Generando...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="h-4 w-4" />
                  Exportar Reporte
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ── Table card ─────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card shadow-sm w-full overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4 flex-wrap">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Historial de Lecturas</h2>
            <p className="text-xs text-muted-foreground">
              La columna <span className="font-semibold text-emerald-600">Consumo</span> es calculada
              automáticamente por el trigger de la base de datos al insertar.
            </p>
          </div>

          {/* ── Selector de filtro de tabla ────────────────────────────────── */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={String(tipoFiltro)}
              onValueChange={v => setTipoFiltro(Number(v) as TipoFiltro)}
            >
              <SelectTrigger className="h-8 w-44 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex gap-0.5">
                      <Zap className="h-3 w-3 text-orange-500" />
                      <Droplet className="h-3 w-3 text-blue-500" />
                    </span>
                    Ambos servicios
                  </div>
                </SelectItem>
                <SelectItem value="1">
                  <div className="flex items-center gap-1.5">
                    <Zap className="h-3 w-3 text-orange-500" />
                    Solo Electricidad
                  </div>
                </SelectItem>
                <SelectItem value="2">
                  <div className="flex items-center gap-1.5">
                    <Droplet className="h-3 w-3 text-blue-500" />
                    Solo Agua
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="p-0 sm:p-6 w-full overflow-x-auto">
          <div className="min-w-[800px] p-4 sm:p-0">
            {isLoading ? (
              <div className="flex flex-col gap-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded-lg bg-muted/60"
                    style={{ opacity: 1 - i * 0.12 }} />
                ))}
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={registrosFiltrados}
                searchPlaceholder="Buscar por empresa, punto de medición..."
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Dialogs ─────────────────────────────────────────────────────────── */}
      <MedidorFormDialog
        open={formOpen}
        onOpenChange={handleOpenChangeForm}
        onSubmit={handleSave}
        isSubmitting={isSubmitting}
        submitError={submitError}
      />
      <MedidorViewDialog
        open={viewOpen}
        onOpenChange={setViewOpen}
        item={viewItem}
      />
    </div>
  )
}
