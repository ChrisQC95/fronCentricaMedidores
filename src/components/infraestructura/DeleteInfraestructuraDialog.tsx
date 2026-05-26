import { AlertTriangle } from 'lucide-react'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { InfraestructuraResponse } from '@/services/infraestructura.service'

interface DeleteInfraestructuraDialogProps {
  open:         boolean
  onOpenChange: (open: boolean) => void
  item:         InfraestructuraResponse | null
  onConfirm:    () => Promise<void>
  isDeleting:   boolean
}

export function DeleteInfraestructuraDialog({
  open,
  onOpenChange,
  item,
  onConfirm,
  isDeleting,
}: DeleteInfraestructuraDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <DialogTitle className="text-base">Eliminar Nodo</DialogTitle>
              <DialogDescription className="text-xs">
                Esta acción eliminará el nodo y podría afectar a sus hijos.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
          <p className="text-sm text-foreground">
            ¿Estás seguro de que deseas eliminar el nodo{' '}
            <span className="font-semibold text-destructive">"{item?.nombre}"</span>?
          </p>
          <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
            <span>ID: <span className="font-mono">#{item?.id}</span></span>
            <span>Tipo: <span className="font-medium">{item?.tipo}</span></span>
            <span>Empresa: <span className="font-mono">{item?.empresaRuc}</span></span>
          </div>
          {item?.parentId == null && (
            <p className="mt-2 text-xs text-orange-600 dark:text-orange-400">
              ⚠ Este es un nodo raíz. Eliminar puede afectar a todos sus nodos hijos.
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting} className="min-w-24">
            {isDeleting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-destructive-foreground/30 border-t-destructive-foreground" />
                Eliminando...
              </span>
            ) : (
              'Eliminar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
