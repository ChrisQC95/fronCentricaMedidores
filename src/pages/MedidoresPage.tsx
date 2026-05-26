import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Gauge, Plus, RefreshCw, Zap, TrendingUp, FileSpreadsheet, CalendarRange } from 'lucide-react'
import { isAxiosError } from 'axios'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { DataTable } from '@/components/empresas/EmpresaDataTable'
import { getMedidorColumns } from '@/components/medidores/MedidorColumns'
import { MedidorFormDialog, type MedidorFormValues } from '@/components/medidores/MedidorFormDialog'
import { MedidorViewDialog } from '@/components/medidores/MedidorViewDialog'
import { medidorService, type RegistroMedidor } from '@/services/medidor.service'
import { infraestructuraService } from '@/services/infraestructura.service'
import { buildPivot, generateMedidoresExcel } from '@/utils/excelExport'
import { useAuth } from '@/context/AuthContext'

// ─── Helpers de fechas ─────────────────────────────────────────────────────────
function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}
function firstDayOfMonthIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

// ══════════════════════════════════════════════════════════════════════════════
export function MedidoresPage() {
  const { userRole } = useAuth()
  
  // ─── Estado principal ──────────────────────────────────────────────────────
  const [registros,    setRegistros]    = useState<RegistroMedidor[]>([])
  const [isLoading,    setIsLoading]    = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isExporting,  setIsExporting]  = useState(false)

  // Rango de fechas para el export (por defecto: mes actual)
  const [dateFrom, setDateFrom] = useState<string>(firstDayOfMonthIso)
  const [dateTo,   setDateTo]   = useState<string>(todayIso)

  // Dialogs
  const [formOpen, setFormOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [viewItem, setViewItem] = useState<RegistroMedidor | null>(null)

  // ─── Carga de datos ────────────────────────────────────────────────────────
  const fetchRegistros = useCallback(async () => {
    setIsLoading(true)
    try {
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

  // ─── Handler: Guardar nuevo registro ──────────────────────────────────────
  const handleSave = async (values: MedidorFormValues) => {
    setIsSubmitting(true)
    try {
      const created = await medidorService.create({
        infraestructuraId: values.infraestructuraId,
        voltaje:           values.voltaje,
        fotoUrl:           values.fotoUrl ?? null,
        observacion:       values.observacion ?? null,
      })
      setRegistros(prev => [created, ...prev])
      setFormOpen(false)
      toast.success('Lectura registrada', {
        description: `Voltaje ${Number(created.voltaje).toFixed(2)} V en "${created.infraestructuraNombre}".`,
      })
      if (created.consumo != null) {
        toast.info(`Consumo: ${Number(created.consumo).toFixed(2)} V`, {
          description: 'Calculado automáticamente por el trigger de la BD.',
        })
      }
    } catch (err) {
      if (isAxiosError(err)) {
        const status = err.response?.status
        const msg    = err.response?.data?.error ?? 'No se pudo guardar el registro.'
        if (status === 404)      toast.error('Punto no encontrado',  { description: msg })
        else if (status === 400) toast.error('Datos inválidos',       { description: msg })
        else                     toast.error('Error al registrar',    { description: msg })
      } else {
        toast.error('Error inesperado al guardar.')
      }
    } finally {
      setIsSubmitting(false)
    }
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

    // Filtrar registros por el rango de fechas
    const filtered = registros.filter(
      r => r.fechaRegistro >= dateFrom && r.fechaRegistro <= dateTo,
    )

    if (filtered.length === 0) {
      toast.info('Sin datos', {
        description: `No hay registros entre ${dateFrom} y ${dateTo}.`,
      })
      return
    }

    setIsExporting(true)
    const toastId = toast.loading('Generando Excel...', {
      description: `Procesando ${filtered.length} registros...`,
    })

    try {
      // Cargar infraestructura para construir la jerarquía
      const infraList = await infraestructuraService.getAll()
      const infraMap  = new Map(infraList.map(n => [n.id, n]))

      const { pivot, months } = buildPivot(filtered, infraMap)

      await generateMedidoresExcel(pivot, months, dateFrom, dateTo)

      toast.dismiss(toastId)
      toast.success('Excel descargado', {
        description: `${filtered.length} registros — ${months.length} mes(es) incluidos.`,
      })
    } catch (err) {
      toast.dismiss(toastId)
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      toast.error('Error al generar Excel', { description: msg })
    } finally {
      setIsExporting(false)
    }
  }

  // ─── Columnas + Stats ──────────────────────────────────────────────────────
  const handleView   = (item: RegistroMedidor) => { setViewItem(item); setViewOpen(true) }
  const columns      = getMedidorColumns({ onView: handleView })
  const conConsumo   = registros.filter(r => r.consumo != null).length
  const voltajeProm  = registros.length
    ? (registros.reduce((s, r) => s + Number(r.voltaje), 0) / registros.length).toFixed(2)
    : '—'

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
              Historial de lecturas de voltaje y consumo por punto de medición.
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

      {/* ── Stats ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-xs">
          <span className="font-bold text-orange-500">{registros.length}</span>
          registro{registros.length !== 1 ? 's' : ''} totales
        </Badge>
        <Badge variant="outline" className="gap-1.5 px-3 py-1 text-xs">
          <Zap className="h-3 w-3 text-emerald-500" />
          <span className="font-bold text-emerald-600">{conConsumo}</span>
          con consumo calculado
        </Badge>
        <Badge variant="outline" className="gap-1.5 px-3 py-1 text-xs">
          <TrendingUp className="h-3 w-3 text-primary" />
          Promedio: <span className="ml-1 font-bold tabular-nums text-primary">{voltajeProm} V</span>
        </Badge>
      </div>

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

            {/* Info del rango seleccionado */}
            {dateFrom && dateTo && (
              <p className="text-xs text-muted-foreground self-end pb-0.5">
                {registros.filter(r => r.fechaRegistro >= dateFrom && r.fechaRegistro <= dateTo).length} registros
                en el rango seleccionado
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Table card ─────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card shadow-sm w-full overflow-hidden">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-sm font-semibold text-foreground">Historial de Lecturas</h2>
          <p className="text-xs text-muted-foreground">
            La columna <span className="font-semibold text-emerald-600">Consumo</span> es calculada
            automáticamente por el trigger de la base de datos al insertar.
          </p>
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
                data={registros}
                searchPlaceholder="Buscar por empresa, punto de medición..."
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Dialogs ─────────────────────────────────────────────────────────── */}
      <MedidorFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSave}
        isSubmitting={isSubmitting}
      />
      <MedidorViewDialog
        open={viewOpen}
        onOpenChange={setViewOpen}
        item={viewItem}
      />
    </div>
  )
}
