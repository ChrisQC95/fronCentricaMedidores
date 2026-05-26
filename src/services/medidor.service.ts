import api from '@/lib/api'

// ─── Tipos (coinciden con RegistroMedidorResponseDTO / RequestDTO del backend) ─

export interface RegistroMedidor {
  id: number
  infraestructuraId: number
  infraestructuraNombre: string
  infraestructuraTipo: string
  empresaRuc: string
  empresaRazonSocial: string
  fotoUrl: string | null
  voltaje: number
  /** Calculado por trigger en BD — null si es el primer registro del medidor */
  consumo: number | null
  fechaRegistro: string           // ISO "YYYY-MM-DD"
  observacion: string | null
  createdAt?: string
}

export interface CreateRegistroPayload {
  infraestructuraId: number
  voltaje: number
  fotoUrl?: string | null
  observacion?: string | null
  fechaRegistro?: string | null   // ISO "YYYY-MM-DD" — opcional (backend usa hoy)
}

// ─── Servicio ─────────────────────────────────────────────────────────────────

export const medidorService = {
  /** GET /api/medidores — lista completa */
  getAll: (): Promise<RegistroMedidor[]> =>
    api.get<RegistroMedidor[]>('/api/medidores').then(r => r.data),

  /** POST /api/medidores — campo consumo lo calcula el trigger, NO se envía */
  create: (data: CreateRegistroPayload): Promise<RegistroMedidor> =>
    api.post<RegistroMedidor>('/api/medidores', data).then(r => r.data),

  /** GET /api/medidores/reporte?mes=5&anio=2025 */
  getReporte: (mes: number, anio: number): Promise<RegistroMedidor[]> =>
    api.get<RegistroMedidor[]>(`/api/medidores/reporte?mes=${mes}&anio=${anio}`).then(r => r.data),
}
