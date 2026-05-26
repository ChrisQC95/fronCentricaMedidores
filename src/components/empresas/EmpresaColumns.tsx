import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Empresa } from '@/services/empresa.service'

interface ColumnActions {
  onEdit: (empresa: Empresa) => void
  onDelete: (empresa: Empresa) => void
}

export function getEmpresaColumns({ onEdit, onDelete }: ColumnActions): ColumnDef<Empresa>[] {
  return [
    {
      accessorKey: 'ruc',
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 font-semibold text-xs uppercase tracking-wider"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          RUC
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-mono text-sm font-medium text-foreground">
          {row.getValue('ruc')}
        </span>
      ),
    },
    {
      accessorKey: 'razonSocial',
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 font-semibold text-xs uppercase tracking-wider"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Razón Social
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-medium text-foreground">{row.getValue('razonSocial')}</span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: () => (
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Registrado
        </span>
      ),
      cell: ({ row }) => {
        const val = row.getValue<string | undefined>('createdAt')
        if (!val) return <Badge variant="secondary">—</Badge>
        return (
          <span className="text-sm text-muted-foreground">
            {new Date(val).toLocaleDateString('es-PE', {
              day: '2-digit', month: 'short', year: 'numeric',
            })}
          </span>
        )
      },
    },
    {
      id: 'actions',
      header: () => (
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Acciones
        </span>
      ),
      cell: ({ row }) => {
        const empresa = row.original
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
              <DropdownMenuItem
                className="cursor-pointer gap-2"
                onClick={() => onEdit(empresa)}
              >
                <Pencil className="h-4 w-4 text-primary" />
                Editar empresa
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                onClick={() => onDelete(empresa)}
              >
                <Trash2 className="h-4 w-4" />
                Eliminar empresa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
