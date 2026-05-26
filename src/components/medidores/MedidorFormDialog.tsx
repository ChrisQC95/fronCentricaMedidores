import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Gauge, Building2, Layers, Zap, AlignLeft } from 'lucide-react'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PhotoDropzone } from './PhotoDropzone'
import { empresaService, type Empresa } from '@/services/empresa.service'
import {
  infraestructuraService,
  type InfraestructuraResponse,
} from '@/services/infraestructura.service'

// ─── Schema Zod ──────────────────────────────────────────────────────────────

const medidorSchema = z.object({
  empresaRuc: z.string().min(1, 'Selecciona una empresa'),
  infraestructuraId: z
    .number({ message: 'Selecciona un punto de medición' })
    .int()
    .positive('Selecciona un punto de medición válido'),
  voltaje: z
    .number({ message: 'El voltaje es obligatorio' })
    .positive('El voltaje debe ser mayor a cero')
    .max(99999.99, 'Valor máximo: 99999.99'),
  fotoUrl: z.string().nullable().optional(),
  observacion: z.string().max(1000, 'Máximo 1000 caracteres').nullable().optional(),
})

export type MedidorFormValues = z.infer<typeof medidorSchema>

// ─── Props ────────────────────────────────────────────────────────────────────

interface MedidorFormDialogProps {
  open:         boolean
  onOpenChange: (open: boolean) => void
  onSubmit:     (values: MedidorFormValues) => Promise<void>
  isSubmitting: boolean
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function MedidorFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: MedidorFormDialogProps) {
  const [empresas,         setEmpresas]         = useState<Empresa[]>([])
  const [nodos,            setNodos]            = useState<InfraestructuraResponse[]>([])
  const [loadingEmpresas,  setLoadingEmpresas]  = useState(false)
  const [loadingNodos,     setLoadingNodos]     = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    setValue,
    formState: { errors },
  } = useForm<MedidorFormValues>({
    resolver: zodResolver(medidorSchema),
    defaultValues: {
      empresaRuc:       '',
      infraestructuraId: undefined,
      voltaje:           undefined,
      fotoUrl:           null,
      observacion:       '',
    },
  })

  const selectedEmpresaRuc = watch('empresaRuc')

  // ── Cargar empresas al abrir ───────────────────────────────────────────────
  useEffect(() => {
    if (!open) return
    reset()
    setNodos([])
    setLoadingEmpresas(true)
    empresaService.getAll()
      .then(setEmpresas)
      .catch(() => toast.error('No se pudieron cargar las empresas.'))
      .finally(() => setLoadingEmpresas(false))
  }, [open, reset])

  // ── Cargar nodos al cambiar empresa (selector en cascada) ──────────────────
  useEffect(() => {
    setValue('infraestructuraId', undefined as unknown as number)
    if (!selectedEmpresaRuc) { setNodos([]); return }

    setLoadingNodos(true)
    infraestructuraService.getByEmpresa(selectedEmpresaRuc)
      .then(setNodos)
      .catch((err) => {
        if (!isAxiosError(err) || err.response?.status !== 404) {
          toast.error('Error al cargar la infraestructura de la empresa.')
        }
        setNodos([])
      })
      .finally(() => setLoadingNodos(false))
  }, [selectedEmpresaRuc, setValue])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10">
              <Gauge className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <DialogTitle className="text-base">Nueva Lectura de Medidor</DialogTitle>
              <DialogDescription className="text-xs">
                Selecciona la empresa y el punto de medición para registrar.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form
          id="medidor-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 py-1"
        >
          {/* ── 1. Empresa ─────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-medium">
              <Building2 className="mr-1.5 inline h-3.5 w-3.5 text-muted-foreground" />
              Empresa <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="empresaRuc"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isSubmitting || loadingEmpresas}
                >
                  <SelectTrigger className={errors.empresaRuc ? 'border-destructive' : ''}>
                    <SelectValue placeholder={
                      loadingEmpresas ? 'Cargando empresas...' : 'Selecciona una empresa'
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {empresas.map(e => (
                      <SelectItem key={e.ruc} value={e.ruc}>
                        <span className="font-medium">{e.razonSocial}</span>
                        <span className="ml-2 font-mono text-xs text-muted-foreground">{e.ruc}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.empresaRuc && <p className="text-xs text-destructive">{errors.empresaRuc.message}</p>}
          </div>

          {/* ── 2. Punto de Infraestructura (cascada) ──────────────────────── */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-medium">
              <Layers className="mr-1.5 inline h-3.5 w-3.5 text-muted-foreground" />
              Punto de Medición <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="infraestructuraId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value != null ? String(field.value) : ''}
                  onValueChange={v => field.onChange(Number(v))}
                  disabled={isSubmitting || loadingNodos || !selectedEmpresaRuc}
                >
                  <SelectTrigger className={errors.infraestructuraId ? 'border-destructive' : ''}>
                    <SelectValue placeholder={
                      !selectedEmpresaRuc
                        ? '← Selecciona primero una empresa'
                        : loadingNodos
                          ? 'Cargando infraestructura...'
                          : nodos.length === 0
                            ? 'Sin nodos para esta empresa'
                            : 'Selecciona el punto de medición'
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {nodos.map(n => (
                      <SelectItem key={n.id} value={String(n.id)}>
                        <span className="font-mono text-[10px] font-bold text-primary mr-1.5">
                          [{n.tipo}]
                        </span>
                        <span>{n.nombre}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.infraestructuraId && (
              <p className="text-xs text-destructive">{errors.infraestructuraId.message}</p>
            )}
          </div>

          {/* ── 3. Voltaje ─────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="voltaje" className="text-sm font-medium">
              <Zap className="mr-1.5 inline h-3.5 w-3.5 text-muted-foreground" />
              Voltaje (V) <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="voltaje"
                type="number"
                step="0.01"
                min="0.01"
                max="99999.99"
                placeholder="220.50"
                disabled={isSubmitting}
                className={`pr-10 font-mono tabular-nums ${errors.voltaje ? 'border-destructive' : ''}`}
                {...register('voltaje', { valueAsNumber: true })}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">V</span>
            </div>
            {errors.voltaje && <p className="text-xs text-destructive">{errors.voltaje.message}</p>}
          </div>

          {/* ── 4. Foto (Dropzone con upload Supabase) ─────────────────────── */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-medium">
              Fotografía del Medidor
              <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">(opcional — se comprime automáticamente)</span>
            </Label>
            <Controller
              name="fotoUrl"
              control={control}
              render={({ field }) => (
                <PhotoDropzone
                  value={field.value ?? null}
                  onChange={field.onChange}
                  disabled={isSubmitting}
                />
              )}
            />
          </div>

          {/* ── 5. Observación ─────────────────────────────────────────────── */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="observacion" className="text-sm font-medium">
              <AlignLeft className="mr-1.5 inline h-3.5 w-3.5 text-muted-foreground" />
              Observaciones
              <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <Textarea
              id="observacion"
              placeholder="Estado del medidor, anomalías, condiciones del ambiente..."
              rows={3}
              disabled={isSubmitting}
              className="resize-none"
              {...register('observacion')}
            />
            {errors.observacion && <p className="text-xs text-destructive">{errors.observacion.message}</p>}
          </div>
        </form>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          {/* Botón acento naranja corporativo */}
          <Button
            type="submit"
            form="medidor-form"
            disabled={isSubmitting}
            className="min-w-32 bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-md shadow-orange-500/30"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Registrando...
              </span>
            ) : (
              <>
                <Gauge className="mr-1.5 h-4 w-4" />
                Registrar Medición
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
