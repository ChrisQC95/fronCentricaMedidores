import { Building2, Calendar, ImageOff, Layers, Zap, Droplet } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import type { RegistroMedidor } from '@/services/medidor.service'

interface MedidorViewDialogProps {
  open:         boolean
  onOpenChange: (open: boolean) => void
  item:         RegistroMedidor | null
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function formatDecimal(val: number | null | undefined): string {
  if (val == null) return '—'
  return Number(val).toFixed(2)
}

interface DataRowProps { label: string; value: React.ReactNode; icon?: React.ReactNode }
function DataRow({ label, value, icon }: DataRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-border last:border-0">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground shrink-0">
        {icon}
        {label}
      </div>
      <div className="text-sm font-medium text-foreground text-right">{value}</div>
    </div>
  )
}

export function MedidorViewDialog({ open, onOpenChange, item }: MedidorViewDialogProps) {
  if (!item) return null

  const isAgua = item.tipoServicio === 2
  const unidad = isAgua ? 'm³' : 'kWh'
  const ConsumoIcon = isAgua ? Droplet : Zap

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/*
        ── TAREA 4: Modal premium ─────────────────────────────────────────────
        max-w-3xl para dar espacio a la imagen completa.
        p-0 para que la foto llegue hasta los bordes del dialog.
        El overlay de shadcn aplica backdrop-blur automáticamente via CSS
        del DialogOverlay; si no, se puede añadir la clase backdrop-blur-sm
        al DialogContent para reforzarlo.
      */}
      <DialogContent className="p-0 overflow-hidden w-[95vw] sm:max-w-2xl md:max-w-3xl rounded-2xl border-0 shadow-2xl">

        {/* ── Zona de imagen: fondo oscuro elegante ──────────────────────── */}
        <div className="relative w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          {item.fotoUrl ? (
            /*
              object-contain → muestra la imagen COMPLETA sin recortar.
              max-h-[70vh]   → nunca excede el 70% del viewport para que
                               los datos queden visibles al hacer scroll.
              w-full         → ocupa todo el ancho disponible.
            */
            <img
              src={item.fotoUrl}
              alt={`Medidor #${item.id}`}
              className="w-full max-h-[70vh] object-contain"
              style={{ display: 'block' }}
            />
          ) : (
            <div className="flex h-44 flex-col items-center justify-center gap-3 text-slate-500">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800/80 backdrop-blur-sm">
                <ImageOff className="h-8 w-8 text-slate-600" />
              </div>
              <p className="text-sm text-slate-500">Sin fotografía registrada</p>
            </div>
          )}

          {/* Badge flotante sobre la foto con backdrop-blur premium */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white backdrop-blur-md border border-white/10">
              Registro #{item.id}
            </span>
            <span className="rounded-full bg-primary/80 px-3 py-1 text-xs font-bold text-white backdrop-blur-md border border-primary/20">
              {formatDate(item.fechaRegistro)}
            </span>
            {/* Badge de tipo de servicio */}
            {isAgua ? (
              <span className="rounded-full bg-blue-600/80 px-3 py-1 text-xs font-bold text-white backdrop-blur-md border border-blue-400/20 flex items-center gap-1">
                <Droplet className="h-3 w-3" /> Agua
              </span>
            ) : (
              <span className="rounded-full bg-orange-500/80 px-3 py-1 text-xs font-bold text-white backdrop-blur-md border border-orange-300/20 flex items-center gap-1">
                <Zap className="h-3 w-3" /> Electricidad
              </span>
            )}
          </div>
        </div>

        {/* ── Datos ────────────────────────────────────────────────────────── */}
        <div className="px-6 py-4">
          <DialogHeader className="mb-3">
            <DialogTitle className="text-base">Detalle del Registro de Medidor</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col">
            <DataRow
              label="Empresa"
              icon={<Building2 className="h-3.5 w-3.5" />}
              value={
                <span>
                  {item.empresaRazonSocial}
                  <span className="ml-2 font-mono text-xs text-muted-foreground">{item.empresaRuc}</span>
                </span>
              }
            />
            <DataRow
              label="Punto de Medición"
              icon={<Layers className="h-3.5 w-3.5" />}
              value={
                <span className="flex items-center gap-2 justify-end">
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                    {item.infraestructuraTipo}
                  </span>
                  {item.infraestructuraNombre}
                </span>
              }
            />
            <DataRow
              label="Fecha de registro"
              icon={<Calendar className="h-3.5 w-3.5" />}
              value={formatDate(item.fechaRegistro)}
            />
            <DataRow
              label={`Medida (${unidad})`}
              icon={<ConsumoIcon className={`h-3.5 w-3.5 ${isAgua ? 'text-blue-500' : ''}`} />}
              value={
                <span className="text-primary font-bold tabular-nums">
                  {formatDecimal(item.voltaje)} {unidad}
                </span>
              }
            />
            <DataRow
              label={`Consumo Δ (${unidad})`}
              icon={<ConsumoIcon className={`h-3.5 w-3.5 ${isAgua ? 'text-blue-500' : 'text-emerald-500'}`} />}
              value={
                item.consumo != null ? (
                  <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-sm font-bold tabular-nums
                    ${isAgua
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
                      : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                    }`}>
                    <ConsumoIcon className="h-3 w-3" />
                    {formatDecimal(item.consumo)} {unidad}
                  </span>
                ) : (
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    Sin referencia anterior
                  </Badge>
                )
              }
            />
            {item.observacion && (
              <DataRow
                label="Observación"
                icon={null}
                value={
                  <span className="text-right text-sm leading-relaxed text-muted-foreground">
                    {item.observacion}
                  </span>
                }
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
