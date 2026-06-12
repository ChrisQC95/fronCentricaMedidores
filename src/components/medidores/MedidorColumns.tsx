import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, Eye, Zap, Droplet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { RegistroMedidor } from '@/services/medidor.service'

// ─── Helpers de formato ───────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function formatDecimal(val: number | null | undefined, suffix = ''): string {
  if (val == null) return '—'
  return `${Number(val).toFixed(2)}${suffix}`
}

/**
 * Devuelve la unidad correcta según el tipo de servicio de la fila.
 * Se usa en el modo "Ambos" (tipoFiltro = 3) para concatenar al valor.
 */
function getUnidad(tipoServicio: number): string {
  return tipoServicio === 2 ? ' m³' : ' kWh'
}

// ─── Columnas dinámicas ────────────────────────────────────────────────────────

interface ColumnOptions {
  onView:     (item: RegistroMedidor) => void
  /**
   * tipoFiltro controla cabeceras y celdas:
   *   1 → Electricidad — cabecera fija "Medida (kWh)", valor sin unidad concatenada
   *   2 → Agua         — cabecera fija "Medida (m³)",  valor sin unidad concatenada
   *   3 → Ambos        — cabeceras genéricas, unidad (kWh / m³) concatenada en cada celda
   */
  tipoFiltro: 1 | 2 | 3
}

export function getMedidorColumns({ onView, tipoFiltro }: ColumnOptions): ColumnDef<RegistroMedidor>[] {
  // Cabeceras según el filtro activo
  const medidaHeader  = tipoFiltro === 1 ? 'Medida (kWh)' : tipoFiltro === 2 ? 'Medida (m³)' : 'Medida'
  const consumoHeader = tipoFiltro === 1 ? 'Consumo (kWh)': tipoFiltro === 2 ? 'Consumo (m³)': 'Consumo'
  const isAmbos       = tipoFiltro === 3

  return [
    // ── Fecha / ID ──────────────────────────────────────────────────────────
    {
      accessorKey: 'fechaRegistro',
      id: 'fechaRegistro',
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="-ml-3 h-8 text-xs font-semibold uppercase tracking-wider"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Fecha / ID <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-semibold text-foreground tabular-nums">
            {formatDate(row.getValue('fechaRegistro'))}
          </p>
          <p className="font-mono text-[11px] text-muted-foreground">#{row.original.id}</p>
        </div>
      ),
    },

    // ── Tipo de Servicio (solo visible en modo "Ambos") ──────────────────────
    ...(isAmbos ? [{
      id: 'tipoServicio',
      accessorKey: 'tipoServicio' as const,
      header: () => (
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Servicio
        </span>
      ),
      cell: ({ row }: { row: { original: RegistroMedidor } }) => {
        const tipo = row.original.tipoServicio
        return tipo === 2 ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            <Droplet className="h-2.5 w-2.5" /> Agua
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-bold text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
            <Zap className="h-2.5 w-2.5" /> Luz
          </span>
        )
      },
    } as ColumnDef<RegistroMedidor>] : []),

    // ── Empresa ─────────────────────────────────────────────────────────────
    {
      accessorKey: 'empresaRazonSocial',
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="-ml-3 h-8 text-xs font-semibold uppercase tracking-wider"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Empresa <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium text-foreground max-w-[180px] truncate">
            {row.getValue('empresaRazonSocial')}
          </p>
          <p className="font-mono text-[11px] text-muted-foreground">{row.original.empresaRuc}</p>
        </div>
      ),
    },

    // ── Punto de medición ───────────────────────────────────────────────────
    {
      accessorKey: 'infraestructuraNombre',
      header: () => (
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Punto de Medición
        </span>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
            {row.original.infraestructuraTipo}
          </span>
          <span className="text-sm font-medium text-foreground max-w-[140px] truncate">
            {row.getValue('infraestructuraNombre')}
          </span>
        </div>
      ),
    },

    // ── Medida (voltaje) — cabecera dinámica ────────────────────────────────
    {
      accessorKey: 'voltaje',
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="-ml-3 h-8 text-xs font-semibold uppercase tracking-wider"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          {medidaHeader} <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const valor  = row.getValue<number>('voltaje')
        // En modo Ambos: concatena la unidad correcta de cada fila
        const unidad = isAmbos ? getUnidad(row.original.tipoServicio) : ''
        return (
          <span className="text-sm font-semibold tabular-nums text-primary">
            {formatDecimal(valor)}{unidad}
          </span>
        )
      },
    },

    // ── Consumo — cabecera dinámica, calculado por DB trigger ───────────────
    {
      accessorKey: 'consumo',
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="-ml-3 h-8 text-xs font-semibold uppercase tracking-wider"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          {tipoFiltro === 2
            ? <Droplet className="mr-1 h-3 w-3 text-blue-500" />
            : <Zap className="mr-1 h-3 w-3 text-amber-500" />
          }
          {consumoHeader} <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const consumo = row.getValue<number | null>('consumo')
        if (consumo == null) {
          return (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              Sin referencia
            </Badge>
          )
        }
        const unidad = isAmbos ? getUnidad(row.original.tipoServicio) : ''
        const isAgua = row.original.tipoServicio === 2
        return (
          <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-sm font-bold tabular-nums
            ${isAgua
              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
              : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
            }`}>
            {isAgua ? <Droplet className="h-3 w-3" /> : <Zap className="h-3 w-3" />}
            {formatDecimal(consumo)}{unidad}
          </span>
        )
      },
    },

    // ── Observación ─────────────────────────────────────────────────────────
    {
      accessorKey: 'observacion',
      header: () => (
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Observación
        </span>
      ),
      cell: ({ row }) => {
        const obs = row.getValue<string | null>('observacion')
        if (!obs) return <span className="text-xs text-muted-foreground italic">—</span>
        return (
          <span className="text-sm text-muted-foreground max-w-[160px] truncate block" title={obs}>
            {obs}
          </span>
        )
      },
    },

    // ── Ver detalle ─────────────────────────────────────────────────────────
    {
      id: 'ver',
      header: () => null,
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs font-medium hover:bg-primary hover:text-white hover:border-primary transition-colors"
          onClick={() => onView(row.original)}
        >
          <Eye className="h-3.5 w-3.5" />
          Ver
        </Button>
      ),
    },
  ]
}
