import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Plus, Layers, RefreshCw, GitBranch } from 'lucide-react'
import { isAxiosError } from 'axios'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/infraestructura/InfraestructuraDataTable'
import { InfraestructuraDialog, type InfraestructuraFormValues } from '@/components/infraestructura/InfraestructuraDialog'
import { DeleteInfraestructuraDialog } from '@/components/infraestructura/DeleteInfraestructuraDialog'
import { getInfraestructuraColumns } from '@/components/infraestructura/InfraestructuraColumns'
import {
  infraestructuraService,
  type InfraestructuraResponse,
} from '@/services/infraestructura.service'

export function InfraestructuraPage() {
  // ─── Estado ────────────────────────────────────────────────────────────────
  const [items,     setItems]     = useState<InfraestructuraResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Dialog crear/editar
  const [dialogOpen,     setDialogOpen]     = useState(false)
  const [selectedItem,   setSelectedItem]   = useState<InfraestructuraResponse | null>(null)
  const [isSubmitting,   setIsSubmitting]   = useState(false)

  // Dialog eliminar
  const [deleteOpen,     setDeleteOpen]     = useState(false)
  const [itemToDelete,   setItemToDelete]   = useState<InfraestructuraResponse | null>(null)
  const [isDeleting,     setIsDeleting]     = useState(false)

  // ─── Carga ─────────────────────────────────────────────────────────────────
  const fetchItems = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await infraestructuraService.getAll()
      setItems(data)
    } catch (err) {
      const msg = isAxiosError(err)
        ? `Error ${err.response?.status ?? ''}: ${err.response?.data?.error ?? 'No se pudo cargar la infraestructura.'}`
        : 'Error inesperado al cargar los datos.'
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchItems() }, [fetchItems])

  // ─── Handlers: Abrir dialogs ───────────────────────────────────────────────
  const handleOpenCreate = () => { setSelectedItem(null); setDialogOpen(true) }
  const handleOpenEdit   = (item: InfraestructuraResponse) => { setSelectedItem(item); setDialogOpen(true) }
  const handleOpenDelete = (item: InfraestructuraResponse) => { setItemToDelete(item); setDeleteOpen(true) }

  // ─── Handler: Guardar ──────────────────────────────────────────────────────
  const handleSave = async (values: InfraestructuraFormValues) => {
    setIsSubmitting(true)
    try {
      const payload = {
        empresaRuc:  values.empresaRuc,
        tipo:        values.tipo,
        nombre:      values.nombre,
        parentId:    values.parentId ?? null,
        glosa:       values.glosa || null,
        espacioName: values.espacioName ?? null,
      }

      if (selectedItem) {
        // EDITAR
        const updated = await infraestructuraService.update(selectedItem.id, payload)
        setItems(prev => prev.map(i => i.id === updated.id ? updated : i))
        toast.success('Nodo actualizado', {
          description: `"${updated.nombre}" fue actualizado correctamente.`,
        })
      } else {
        // CREAR
        const created = await infraestructuraService.create(payload)
        setItems(prev => [created, ...prev])
        toast.success('Nodo registrado', {
          description: `"${created.nombre}" fue agregado a la infraestructura.`,
        })
      }
      setDialogOpen(false)
    } catch (err) {
      if (isAxiosError(err)) {
        const status = err.response?.status
        const msg = err.response?.data?.error ?? 'No se pudo guardar el nodo.'
        if (status === 404) {
          toast.error('Recurso no encontrado', { description: msg })
        } else if (status === 400) {
          toast.error('Datos inválidos', { description: msg })
        } else {
          toast.error('Error al guardar', { description: msg })
        }
      } else {
        toast.error('Error inesperado al guardar.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // ─── Handler: Eliminar ─────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!itemToDelete) return
    setIsDeleting(true)
    try {
      await infraestructuraService.delete(itemToDelete.id)
      setItems(prev => prev.filter(i => i.id !== itemToDelete.id))
      toast.success('Nodo eliminado', {
        description: `"${itemToDelete.nombre}" fue eliminado del sistema.`,
      })
      setDeleteOpen(false)
    } catch (err) {
      const msg = isAxiosError(err)
        ? (err.response?.data?.error ?? 'No se pudo eliminar el nodo.')
        : 'Error inesperado.'
      toast.error('Error al eliminar', { description: msg })
    } finally {
      setIsDeleting(false)
    }
  }

  // ─── Columnas ──────────────────────────────────────────────────────────────
  const columns = getInfraestructuraColumns({
    onEdit:   handleOpenEdit,
    onDelete: handleOpenDelete,
  })

  // ─── Stats ─────────────────────────────────────────────────────────────────
  const rootNodes = items.filter(i => i.parentId === null).length
  const childNodes = items.length - rootNodes

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Layers className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Infraestructura</h1>
            <p className="text-sm text-muted-foreground">
              Árbol jerárquico de unidades, bloques, pisos y espacios.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchItems} disabled={isLoading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button size="sm" onClick={handleOpenCreate} className="gap-2 bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            Nuevo Nodo
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 flex-wrap">
        <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-xs">
          <span className="font-bold text-primary">{items.length}</span>
          nodo{items.length !== 1 ? 's' : ''} en total
        </Badge>
        <Badge variant="outline" className="gap-1.5 px-3 py-1 text-xs">
          <Layers className="h-3 w-3 text-primary" />
          <span className="font-bold text-primary">{rootNodes}</span> raíces
        </Badge>
        <Badge variant="outline" className="gap-1.5 px-3 py-1 text-xs">
          <GitBranch className="h-3 w-3 text-muted-foreground" />
          <span className="font-bold">{childNodes}</span> subnodos
        </Badge>
      </div>

      {/* Table Card */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-sm font-semibold text-foreground">Listado de Nodos</h2>
          <p className="text-xs text-muted-foreground">
            Filtra por nombre, empresa o tipo de nivel.
          </p>
        </div>

        <div className="p-6">
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
              data={items}
              searchPlaceholder="Buscar por nombre, empresa o tipo..."
            />
          )}
        </div>
      </div>

      {/* Dialogs */}
      <InfraestructuraDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={selectedItem}
        onSubmit={handleSave}
        isSubmitting={isSubmitting}
      />
      <DeleteInfraestructuraDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        item={itemToDelete}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
  )
}
