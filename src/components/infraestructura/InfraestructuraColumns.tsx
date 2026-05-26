import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2, GitBranch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { InfraestructuraResponse, TipoNivel } from '@/services/infraestructura.service'

// Colores por tipo de nivel
const TIPO_COLORS: Record<TipoNivel, string> = {
  UNIDAD:        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  BLOQUE:        'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  PISO:          'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  ENST:          'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  ESPACIO_COMUN: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
}

const TIPO_LABELS: Record<TipoNivel, string> = {
  UNIDAD:        'Unidad',
  BLOQUE:        'Bloque',
  PISO:          'Piso',
  ENST:          'ENST',
  ESPACIO_COMUN: 'Espacio Común',
}

interface ColumnActions {
  onEdit:   (item: InfraestructuraResponse) => void
  onDelete: (item: InfraestructuraResponse) => void
}

export function getInfraestructuraColumns({ onEdit, onDelete }: ColumnActions): ColumnDef<InfraestructuraResponse>[] {
  return [
    {
      accessorKey: 'id',
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="-ml-3 h-8 text-xs font-semibold uppercase tracking-wider"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          ID <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">#{row.getValue('id')}</span>
      ),
      size: 60,
    },
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
          <p className="text-sm font-medium text-foreground truncate max-w-[180px]">
            {row.getValue('empresaRazonSocial')}
          </p>
          <p className="font-mono text-[11px] text-muted-foreground">{row.original.empresaRuc}</p>
        </div>
      ),
    },
    {
      accessorKey: 'tipo',
      header: () => (
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipo</span>
      ),
      cell: ({ row }) => {
        const tipo = row.getValue<TipoNivel>('tipo')
        return (
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TIPO_COLORS[tipo]}`}>
            {TIPO_LABELS[tipo]}
          </span>
        )
      },
    },
    {
      accessorKey: 'nombre',
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="-ml-3 h-8 text-xs font-semibold uppercase tracking-wider"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Nombre <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-medium text-foreground">{row.getValue('nombre')}</span>
      ),
    },
    {
      accessorKey: 'parentNombre',
      header: () => (
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Nodo Padre
        </span>
      ),
      cell: ({ row }) => {
        const parent = row.getValue<string | null>('parentNombre')
        const parentId = row.original.parentId
        if (!parent) return <Badge variant="outline" className="text-xs text-muted-foreground">Raíz</Badge>
        return (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <GitBranch className="h-3 w-3 shrink-0" />
            <span className="truncate max-w-[120px]">{parent}</span>
            <span className="font-mono text-[10px]">#{parentId}</span>
          </div>
        )
      },
    },
    {
      id: 'actions',
      header: () => (
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Acciones</span>
      ),
      cell: ({ row }) => {
        const item = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Acciones</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => onEdit(item)}>
                <Pencil className="h-4 w-4 text-primary" /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                onClick={() => onDelete(item)}
              >
                <Trash2 className="h-4 w-4" /> Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
