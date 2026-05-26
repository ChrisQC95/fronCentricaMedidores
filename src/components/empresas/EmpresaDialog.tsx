import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Building2, Hash, FileText } from 'lucide-react'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Empresa } from '@/services/empresa.service'

// ─── Schema Zod ──────────────────────────────────────────────────────────────

const empresaSchema = z.object({
  ruc: z
    .string()
    .min(1, 'El RUC es obligatorio')
    .length(11, 'El RUC debe tener exactamente 11 dígitos')
    .regex(/^\d+$/, 'El RUC solo debe contener números'),
  razonSocial: z
    .string()
    .min(1, 'La Razón Social es obligatoria')
    .max(255, 'Máximo 255 caracteres'),
})

export type EmpresaFormValues = z.infer<typeof empresaSchema>

// ─── Props ────────────────────────────────────────────────────────────────────

interface EmpresaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Si se pasa, es modo edición. Si no, es modo creación. */
  empresa?: Empresa | null
  onSubmit: (values: EmpresaFormValues) => Promise<void>
  isSubmitting: boolean
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function EmpresaDialog({
  open,
  onOpenChange,
  empresa,
  onSubmit,
  isSubmitting,
}: EmpresaDialogProps) {
  const isEdit = !!empresa

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmpresaFormValues>({
    resolver: zodResolver(empresaSchema),
    defaultValues: { ruc: '', razonSocial: '' },
  })

  // Cuando cambia la empresa seleccionada (o se abre el dialog), cargar los valores
  useEffect(() => {
    if (open) {
      reset(
        empresa
          ? { ruc: empresa.ruc, razonSocial: empresa.razonSocial }
          : { ruc: '', razonSocial: '' }
      )
    }
  }, [open, empresa, reset])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base">
                {isEdit ? 'Editar Empresa' : 'Nueva Empresa'}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {isEdit
                  ? `Actualizando datos de RUC ${empresa?.ruc}`
                  : 'Completa los campos para registrar una empresa cliente.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} id="empresa-form" className="flex flex-col gap-4 py-2">
          {/* RUC */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ruc" className="text-sm font-medium">
              RUC <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="ruc"
                placeholder="12345678901"
                maxLength={11}
                className="pl-9 font-mono"
                disabled={isEdit || isSubmitting}  // RUC no editable en modo edición
                aria-invalid={!!errors.ruc}
                {...register('ruc')}
              />
            </div>
            {errors.ruc && (
              <p className="text-xs text-destructive">{errors.ruc.message}</p>
            )}
            {isEdit && (
              <p className="text-[11px] text-muted-foreground">
                El RUC no puede modificarse una vez creado.
              </p>
            )}
          </div>

          {/* Razón Social */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="razonSocial" className="text-sm font-medium">
              Razón Social <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="razonSocial"
                placeholder="Empresa S.A.C."
                className="pl-9"
                disabled={isSubmitting}
                aria-invalid={!!errors.razonSocial}
                {...register('razonSocial')}
              />
            </div>
            {errors.razonSocial && (
              <p className="text-xs text-destructive">{errors.razonSocial.message}</p>
            )}
          </div>
        </form>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="empresa-form"
            disabled={isSubmitting}
            className="min-w-24"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                Guardando...
              </span>
            ) : (
              isEdit ? 'Actualizar' : 'Registrar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
