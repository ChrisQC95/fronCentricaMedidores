import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, Eye, Zap } from 'lucide-react'
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

// ─── Columnas ─────────────────────────────────────────────────────────────────

interface ColumnActions {
  onView: (item: RegistroMedidor) => void
}

export function getMedidorColumns({ onView }: ColumnActions): ColumnDef<RegistroMedidor>[] {
  return [
    // ID / Fecha
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

    // Empresa
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

    // Punto de medición
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

    // Voltaje
    {
      accessorKey: 'voltaje',
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="-ml-3 h-8 text-xs font-semibold uppercase tracking-wider"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Voltaje <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-sm font-semibold tabular-nums text-primary">
          {formatDecimal(row.getValue('voltaje'))} V
        </span>
      ),
    },

    // Consumo (destacado — calculado por DB trigger)
    {
      accessorKey: 'consumo',
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="-ml-3 h-8 text-xs font-semibold uppercase tracking-wider"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          <Zap className="mr-1 h-3 w-3 text-amber-500" />
          Consumo <ArrowUpDown className="ml-1 h-3 w-3" />
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
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-sm font-bold tabular-nums text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
            <Zap className="h-3 w-3" />
            {formatDecimal(consumo)} V
          </span>
        )
      },
    },

    // Observación
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

    // Ver detalle
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
