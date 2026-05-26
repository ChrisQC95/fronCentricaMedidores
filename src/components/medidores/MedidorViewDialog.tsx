import { Building2, Calendar, ImageOff, Layers, Zap } from 'lucide-react'
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        {/* Foto */}
        <div className="relative w-full bg-slate-900">
          {item.fotoUrl ? (
            <img
              src={item.fotoUrl}
              alt={`Medidor #${item.id}`}
              className="w-full max-h-64 object-cover"
            />
          ) : (
            <div className="flex h-40 flex-col items-center justify-center gap-2 text-slate-500">
              <ImageOff className="h-10 w-10" />
              <p className="text-sm">Sin fotografía registrada</p>
            </div>
          )}

          {/* Badge flotante sobre la foto */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
              Registro #{item.id}
            </span>
            <span className="rounded-full bg-primary/80 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
              {formatDate(item.fechaRegistro)}
            </span>
          </div>
        </div>

        {/* Datos */}
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
              label="Voltaje medido"
              icon={<Zap className="h-3.5 w-3.5" />}
              value={
                <span className="text-primary font-bold tabular-nums">
                  {formatDecimal(item.voltaje)} V
                </span>
              }
            />
            <DataRow
              label="Consumo (Δ voltaje)"
              icon={<Zap className="h-3.5 w-3.5 text-emerald-500" />}
              value={
                item.consumo != null ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-sm font-bold tabular-nums text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                    <Zap className="h-3 w-3" />
                    {formatDecimal(item.consumo)} V
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
