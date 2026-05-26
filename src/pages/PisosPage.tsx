import { Layers } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function PisosPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Pisos</h2>
        <p className="text-sm text-muted-foreground">Administra los pisos asociados a cada edificio.</p>
      </div>
      <Card id="pisos-placeholder" className="flex flex-col items-center justify-center py-20">
        <CardHeader className="items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Layers className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Módulo de Pisos</CardTitle>
          <CardDescription>
            Aquí podrás gestionar los pisos de cada edificio registrado.<br />
            Este módulo está en desarrollo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground">Próximamente disponible</p>
        </CardContent>
      </Card>
    </div>
  )
}
