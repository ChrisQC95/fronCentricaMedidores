import { AlertTriangle } from 'lucide-react'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { Empresa } from '@/services/empresa.service'

interface DeleteEmpresaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  empresa: Empresa | null
  onConfirm: () => Promise<void>
  isDeleting: boolean
}

export function DeleteEmpresaDialog({
  open,
  onOpenChange,
  empresa,
  onConfirm,
  isDeleting,
}: DeleteEmpresaDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <DialogTitle className="text-base">Eliminar Empresa</DialogTitle>
              <DialogDescription className="text-xs">
                Esta acción no se puede deshacer.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
          <p className="text-sm text-foreground">
            ¿Estás seguro de que deseas eliminar la empresa{' '}
            <span className="font-semibold text-destructive">
              {empresa?.razonSocial}
            </span>
            ?
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            RUC: <span className="font-mono">{empresa?.ruc}</span>
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            className="min-w-24"
          >
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
