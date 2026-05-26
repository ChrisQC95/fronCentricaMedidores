import { Building2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function EdificiosPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Edificios</h2>
        <p className="text-sm text-muted-foreground">Gestiona el registro de edificios y sus propiedades.</p>
      </div>
      <Card id="edificios-placeholder" className="flex flex-col items-center justify-center py-20">
        <CardHeader className="items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Módulo de Edificios</CardTitle>
          <CardDescription>
            Aquí podrás gestionar todos los edificios registrados en la plataforma.<br />
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
