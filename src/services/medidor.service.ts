import api from '@/lib/api'
import type { PageableResponse } from '@/types/pagination'

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
  /** 1=Luz, 2=Agua */
  tipoServicio: number
  /** Calculado por trigger en BD — null si es el primer registro del medidor */
  consumo: number | null
  fechaRegistro: string           // ISO "YYYY-MM-DD"
  observacion: string | null
  createdAt?: string
}

export interface CreateRegistroPayload {
  infraestructuraId: number
  voltaje: number
  tipoServicio: number
  fotoUrl?: string | null
  observacion?: string | null
  fechaRegistro?: string | null   // ISO "YYYY-MM-DD" — opcional (backend usa hoy)
}

// ─── Servicio ─────────────────────────────────────────────────────────────────

export const medidorService = {
  /**
   * GET /api/medidores — lista paginada (Server-Side Pagination).
   * @param page         Número de página (0-indexed, default: 0)
   * @param size         Registros por página (default: 15)
   * @param tipoServicio Filtro opcional: 1=Luz, 2=Agua
   */
  getAll: (
    page = 0,
    size = 15,
    tipoServicio?: number
  ): Promise<PageableResponse<RegistroMedidor>> => {
    const params: Record<string, unknown> = { page, size }
    if (tipoServicio) params.tipoServicio = tipoServicio
    return api.get<PageableResponse<RegistroMedidor>>('/api/medidores', { params }).then(r => r.data)
  },

  /** POST /api/medidores — campo consumo lo calcula el trigger, NO se envía */
  create: (data: CreateRegistroPayload): Promise<RegistroMedidor> =>
    api.post<RegistroMedidor>('/api/medidores', data).then(r => r.data),

  /** GET /api/medidores/reporte?mes=5&anio=2025 — lista plana para Excel */
  getReporte: (mes: number, anio: number, tipoServicio: number): Promise<RegistroMedidor[]> =>
    api.get<RegistroMedidor[]>(`/api/medidores/reporte?mes=${mes}&anio=${anio}&tipoServicio=${tipoServicio}`).then(r => r.data),
}
