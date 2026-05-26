import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Plus, Building2, RefreshCw } from 'lucide-react'
import { isAxiosError } from 'axios'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/empresas/EmpresaDataTable'
import { EmpresaDialog, type EmpresaFormValues } from '@/components/empresas/EmpresaDialog'
import { DeleteEmpresaDialog } from '@/components/empresas/DeleteEmpresaDialog'
import { getEmpresaColumns } from '@/components/empresas/EmpresaColumns'
import { empresaService, type Empresa } from '@/services/empresa.service'

export function ClientesPage() {
  // ─── Estado ────────────────────────────────────────────────────────────────
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Dialog crear/editar
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Dialog eliminar
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [empresaToDelete, setEmpresaToDelete] = useState<Empresa | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // ─── Carga de datos ────────────────────────────────────────────────────────
  const fetchEmpresas = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await empresaService.getAll()
      setEmpresas(data)
    } catch (err) {
      const msg = isAxiosError(err)
        ? `Error ${err.response?.status ?? ''}: ${err.response?.data?.error ?? 'No se pudieron cargar las empresas.'}`
        : 'Error inesperado al cargar las empresas.'
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEmpresas()
  }, [fetchEmpresas])

  // ─── Handlers: Abrir dialogs ───────────────────────────────────────────────
  const handleOpenCreate = () => {
    setSelectedEmpresa(null)
    setDialogOpen(true)
  }

  const handleOpenEdit = (empresa: Empresa) => {
    setSelectedEmpresa(empresa)
    setDialogOpen(true)
  }

  const handleOpenDelete = (empresa: Empresa) => {
    setEmpresaToDelete(empresa)
    setDeleteDialogOpen(true)
  }

  // ─── Handler: Guardar (crear o editar) ─────────────────────────────────────
  const handleSave = async (values: EmpresaFormValues) => {
    setIsSubmitting(true)
    try {
      if (selectedEmpresa) {
        // EDITAR
        const updated = await empresaService.update(selectedEmpresa.ruc, {
          razonSocial: values.razonSocial,
        })
        setEmpresas(prev =>
          prev.map(e => (e.ruc === updated.ruc ? updated : e))
        )
        toast.success('Empresa actualizada', {
          description: `${updated.razonSocial} fue actualizada correctamente.`,
        })
      } else {
        // CREAR
        const created = await empresaService.create({
          ruc: values.ruc,
          razonSocial: values.razonSocial,
        })
        setEmpresas(prev => [created, ...prev])
        toast.success('Empresa registrada', {
          description: `${created.razonSocial} fue agregada correctamente.`,
        })
      }
      setDialogOpen(false)
    } catch (err) {
      if (isAxiosError(err)) {
        const status = err.response?.status
        const msg = err.response?.data?.error ?? 'No se pudo guardar la empresa.'
        if (status === 400) {
          toast.error('Datos inválidos', { description: msg })
        } else if (status === 409 || msg.includes('ya existe')) {
          toast.error('RUC duplicado', { description: `El RUC ${values.ruc} ya está registrado.` })
        } else {
          toast.error('Error al guardar', { description: msg })
        }
      } else {
        toast.error('Error inesperado al guardar la empresa.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // ─── Handler: Eliminar ─────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!empresaToDelete) return
    setIsDeleting(true)
    try {
      await empresaService.delete(empresaToDelete.ruc)
      setEmpresas(prev => prev.filter(e => e.ruc !== empresaToDelete.ruc))
      toast.success('Empresa eliminada', {
        description: `${empresaToDelete.razonSocial} fue eliminada del sistema.`,
      })
      setDeleteDialogOpen(false)
    } catch (err) {
      const msg = isAxiosError(err)
        ? (err.response?.data?.error ?? 'No se pudo eliminar la empresa.')
        : 'Error inesperado.'
      toast.error('Error al eliminar', { description: msg })
    } finally {
      setIsDeleting(false)
    }
  }

  // ─── Columnas ──────────────────────────────────────────────────────────────
  const columns = getEmpresaColumns({
    onEdit: handleOpenEdit,
    onDelete: handleOpenDelete,
  })

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Clientes (Empresas)</h1>
            <p className="text-sm text-muted-foreground">
              Gestiona el registro de empresas clientes del sistema.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchEmpresas}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Nueva Empresa
          </Button>
        </div>
      </div>

      {/* Stats Badge */}
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-xs">
          <span className="font-bold text-primary">{empresas.length}</span>
          empresa{empresas.length !== 1 ? 's' : ''} registrada{empresas.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Table Card */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-sm font-semibold text-foreground">Listado de Empresas</h2>
          <p className="text-xs text-muted-foreground">
            Usa la barra de búsqueda para filtrar por razón social o RUC.
          </p>
        </div>

        <div className="p-6">
          {isLoading ? (
            /* Skeleton loading */
            <div className="flex flex-col gap-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 animate-pulse rounded-lg bg-muted/60"
                  style={{ opacity: 1 - i * 0.15 }}
                />
              ))}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={empresas}
              searchPlaceholder="Buscar por razón social o RUC..."
            />
          )}
        </div>
      </div>

      {/* Dialogs */}
      <EmpresaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        empresa={selectedEmpresa}
        onSubmit={handleSave}
        isSubmitting={isSubmitting}
      />

      <DeleteEmpresaDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        empresa={empresaToDelete}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
  )
}
