import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Layers, Hash, FileText, Building2, GitBranch, AlignLeft, Warehouse } from 'lucide-react'
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
import {
  infraestructuraService,
  TIPO_NIVEL_OPTIONS,
  type InfraestructuraResponse,
  type TipoNivel,
} from '@/services/infraestructura.service'
import { empresaService, type Empresa } from '@/services/empresa.service'

// ─── Schema Zod ──────────────────────────────────────────────────────────────

const infraestructuraSchema = z.object({
  empresaRuc: z.string().min(1, 'Selecciona una empresa'),
  tipo: z.enum(['UNIDAD', 'BLOQUE', 'PISO', 'ENST', 'ESPACIO_COMUN'], {
    message: 'Selecciona un tipo válido',
  }),
  nombre: z.string().min(1, 'El nombre es obligatorio').max(150, 'Máximo 150 caracteres'),
  parentId: z.number().nullable().optional(),
  glosa: z.string().max(1000, 'Máximo 1000 caracteres').nullable().optional(),
  /** 1 = Oficina, 2 = Almacén, 3 = Centro Comercial — null para nodos no-espacio */
  espacioName: z.number().int().min(1).max(3).nullable().optional(),
})

export type InfraestructuraFormValues = z.infer<typeof infraestructuraSchema>

// ─── Props ────────────────────────────────────────────────────────────────────

interface InfraestructuraDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: InfraestructuraResponse | null
  onSubmit: (values: InfraestructuraFormValues) => Promise<void>
  isSubmitting: boolean
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function InfraestructuraDialog({
  open,
  onOpenChange,
  item,
  onSubmit,
  isSubmitting,
}: InfraestructuraDialogProps) {
  const isEdit = !!item

  // Datos para los selects dinámicos
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [nodosPadre, setNodosPadre] = useState<InfraestructuraResponse[]>([])
  const [loadingEmpresas, setLoadingEmpresas] = useState(false)
  const [loadingNodos, setLoadingNodos] = useState(false)
  const [empresaSearch, setEmpresaSearch] = useState('')
  const [nodoSearch, setNodoSearch] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    formState: { errors },
  } = useForm<InfraestructuraFormValues>({
    resolver: zodResolver(infraestructuraSchema),
    defaultValues: {
      empresaRuc: '',
      tipo: undefined,
      nombre: '',
      parentId: null,
      glosa: '',
      espacioName: null,
    },
  })

  // Observar empresa y tipo para lógica reactiva
  const selectedEmpresaRuc = watch('empresaRuc')
  const selectedTipo = watch('tipo')
  // Mostrar selector de espacio solo para nodos que son espacios concretos
  const showEspacioName = selectedTipo === 'ENST' || selectedTipo === 'ESPACIO_COMUN' || selectedTipo === 'PISO' || selectedTipo === 'UNIDAD' || selectedTipo === 'BLOQUE'

  // ── Cargar empresas al abrir el dialog ─────────────────────────────────────
  useEffect(() => {
    if (!open) return
    setLoadingEmpresas(true)
    empresaService.search(empresaSearch, 0, 20)
      .then(response => setEmpresas(response.content))
      .catch(() => toast.error('No se pudieron cargar las empresas.'))
      .finally(() => setLoadingEmpresas(false))
  }, [open, empresaSearch])

  // ── Cargar nodos padre cuando cambia la empresa seleccionada ───────────────
  useEffect(() => {
    if (!selectedEmpresaRuc) {
      setNodosPadre([])
      return
    }
    setLoadingNodos(true)
    infraestructuraService.search(selectedEmpresaRuc, nodoSearch, 0, 20)
      .then(response => {
        const nodos = response.content
        // En modo edición excluir el nodo actual para evitar auto-referencias directas
        const filtrados = isEdit ? nodos.filter(n => n.id !== item?.id) : nodos
        setNodosPadre(filtrados)
      })
      .catch((err) => {
        if (!isAxiosError(err) || err.response?.status !== 404) {
          toast.error('No se pudieron cargar los nodos de infraestructura.')
        }
        setNodosPadre([])
      })
      .finally(() => setLoadingNodos(false))
  }, [selectedEmpresaRuc, nodoSearch, isEdit, item?.id])

  // ── Inicializar formulario cuando cambia el item o se abre ─────────────────
  useEffect(() => {
    if (open) {
      reset(
        item
          ? {
            empresaRuc: item.empresaRuc,
            tipo: item.tipo,
            nombre: item.nombre,
            parentId: item.parentId ?? null,
            glosa: item.glosa ?? '',
            espacioName: item.espacioName ?? null,
          }
          : { empresaRuc: '', tipo: undefined, nombre: '', parentId: null, glosa: '', espacioName: null }
      )
    }
  }, [open, item, reset])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Layers className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base">
                {isEdit ? 'Editar Nodo de Infraestructura' : 'Nuevo Nodo de Infraestructura'}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {isEdit
                  ? `Editando: ${item?.nombre} (ID #${item?.id})`
                  : 'Agrega un nodo al árbol jerárquico de infraestructura.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form
          id="infraestructura-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 py-2"
        >
          {/* Empresa */}
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
                    <div className="p-2">
                      <Input
                        value={empresaSearch}
                        onChange={e => setEmpresaSearch(e.target.value)}
                        placeholder="Buscar empresa o RUC..."
                        className="h-8"
                      />
                    </div>
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
            {errors.empresaRuc && (
              <p className="text-xs text-destructive">{errors.empresaRuc.message}</p>
            )}
          </div>

          {/* Tipo */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-medium">
              <Hash className="mr-1.5 inline h-3.5 w-3.5 text-muted-foreground" />
              Tipo de Nivel <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="tipo"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange as (v: TipoNivel) => void}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className={errors.tipo ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Selecciona el tipo de nivel" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPO_NIVEL_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.tipo && (
              <p className="text-xs text-destructive">{errors.tipo.message}</p>
            )}
          </div>

          {/* Nombre */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nombre" className="text-sm font-medium">
              <FileText className="mr-1.5 inline h-3.5 w-3.5 text-muted-foreground" />
              Nombre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nombre"
              placeholder="Ej: Torre A, Piso 3, Oficina 301"
              disabled={isSubmitting}
              aria-invalid={!!errors.nombre}
              className={errors.nombre ? 'border-destructive' : ''}
              {...register('nombre')}
            />
            {errors.nombre && (
              <p className="text-xs text-destructive">{errors.nombre.message}</p>
            )}
          </div>

          {/* Tipo de Espacio — solo visible para ENST / ESPACIO_COMUN */}
          {showEspacioName && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-medium">
                <Warehouse className="mr-1.5 inline h-3.5 w-3.5 text-muted-foreground" />
                Tipo de Espacio
                <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">(opcional)</span>
              </Label>
              <Controller
                name="espacioName"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value != null ? String(field.value) : 'none'}
                    onValueChange={v => field.onChange(v === 'none' ? null : Number(v))}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el tipo de espacio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <span className="text-muted-foreground italic">— Sin clasificar</span>
                      </SelectItem>
                      <SelectItem value="1">Oficina</SelectItem>
                      <SelectItem value="2">Almacén</SelectItem>
                      <SelectItem value="3">Centro Comercial</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}
          {/* Elemento Padre (opcional) */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-medium">
              <GitBranch className="mr-1.5 inline h-3.5 w-3.5 text-muted-foreground" />
              Nodo Padre
              <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">(opcional — dejar vacío para nodo raíz)</span>
            </Label>
            <Controller
              name="parentId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value != null ? String(field.value) : 'none'}
                  onValueChange={v => field.onChange(v === 'none' ? null : Number(v))}
                  disabled={isSubmitting || loadingNodos || !selectedEmpresaRuc}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      !selectedEmpresaRuc
                        ? 'Selecciona primero una empresa'
                        : loadingNodos
                          ? 'Cargando nodos...'
                          : 'Sin padre (nodo raíz)'
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="text-muted-foreground italic">— Sin padre (nodo raíz)</span>
                    </SelectItem>
                    <div className="p-2">
                      <Input
                        value={nodoSearch}
                        onChange={e => setNodoSearch(e.target.value)}
                        placeholder="Buscar nodo..."
                        className="h-8"
                      />
                    </div>
                    {nodosPadre.map(n => (
                      <SelectItem key={n.id} value={String(n.id)}>
                        <span className="font-medium">{n.nombre}</span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          [{n.tipo}] #{n.id}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Glosa (opcional) */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="glosa" className="text-sm font-medium">
              <AlignLeft className="mr-1.5 inline h-3.5 w-3.5 text-muted-foreground" />
              Glosa / Descripción
              <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <Textarea
              id="glosa"
              placeholder="Descripción adicional del nodo..."
              rows={3}
              disabled={isSubmitting}
              className="resize-none"
              {...register('glosa')}
            />
            {errors.glosa && (
              <p className="text-xs text-destructive">{errors.glosa.message}</p>
            )}
          </div>

        </form>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" form="infraestructura-form" disabled={isSubmitting} className="min-w-24">
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
