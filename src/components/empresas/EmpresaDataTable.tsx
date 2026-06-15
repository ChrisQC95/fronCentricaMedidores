import { useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

// ─── Props para paginación local (client-side) ────────────────────────────────
interface ClientPaginationProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchPlaceholder?: string
  /** Cuando se omite serverPagination, la tabla maneja su propia paginación */
  serverPagination?: never
  onPageChange?: never
  pageIndex?: never
  pageCount?: never
  totalElements?: never
  isLoading?: boolean
}

// ─── Props para paginación del servidor (server-side) ────────────────────────
interface ServerPaginationProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchPlaceholder?: string
  /** Activar Server-Side Pagination */
  serverPagination: true
  /** Callback que el padre llama cuando el usuario cambia de página */
  onPageChange: (page: number) => void
  /** Página actual (0-indexed) */
  pageIndex: number
  /** Total de páginas devueltas por el backend */
  pageCount: number
  /** Total de elementos (para mostrar en el footer) */
  totalElements: number
  isLoading?: boolean
}

type DataTableProps<TData, TValue> =
  | ClientPaginationProps<TData, TValue>
  | ServerPaginationProps<TData, TValue>

// ─── Componente ───────────────────────────────────────────────────────────────

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = 'Buscar...',
  serverPagination,
  onPageChange,
  pageIndex = 0,
  pageCount = 1,
  totalElements,
  isLoading = false,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      // En server-side, desactivamos el globalFilter local (busca el padre)
      globalFilter: serverPagination ? undefined : globalFilter,
      ...(serverPagination && {
        pagination: { pageIndex, pageSize: data.length || 10 },
      }),
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: serverPagination ? undefined : setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    // En client-side activamos filtros y paginación propios de tanstack
    ...(serverPagination
      ? {
          manualPagination: true,
          pageCount,
        }
      : {
          getFilteredRowModel: getFilteredRowModel(),
          initialState: { pagination: { pageSize: 10 } },
        }),
  })

  const isServerSide = Boolean(serverPagination)
  const currentPage  = isServerSide ? pageIndex : table.getState().pagination.pageIndex
  const totalPages   = isServerSide ? pageCount  : table.getPageCount()
  const canPrev      = currentPage > 0
  const canNext      = currentPage < totalPages - 1

  const handlePrev = () => {
    if (!canPrev) return
    isServerSide ? onPageChange?.(currentPage - 1) : table.previousPage()
  }

  const handleNext = () => {
    if (!canNext) return
    isServerSide ? onPageChange?.(currentPage + 1) : table.nextPage()
  }

  const displayCount = isServerSide
    ? (totalElements ?? data.length)
    : table.getFilteredRowModel().rows.length

  return (
    <div className="flex flex-col gap-4">
      {/* Barra de búsqueda — solo visible en client-side */}
      {!isServerSide && (
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id} className="bg-muted/40 hover:bg-muted/40">
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id} className="h-10">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                    Cargando...
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow
                  key={row.id}
                  className="hover:bg-primary/5 transition-colors"
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No se encontraron resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer de paginación */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {displayCount} registro(s) en total
        </span>
        <div className="flex items-center gap-2">
          <span>
            Página {currentPage + 1} de {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={handlePrev}
            disabled={!canPrev || isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={handleNext}
            disabled={!canNext || isLoading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
