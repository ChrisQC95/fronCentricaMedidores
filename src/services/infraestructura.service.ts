import api from '@/lib/api'
import type { PageableResponse } from '@/types/pagination'

// ─── Enum — coincide con TipoNivel de PostgreSQL/Java ────────────────────────

export const TIPO_NIVEL_OPTIONS = [
  { value: 'UNIDAD',        label: 'Unidad'         },
  { value: 'BLOQUE',        label: 'Bloque'         },
  { value: 'PISO',          label: 'Piso'           },
  { value: 'ENST',          label: 'ENST'           },
  { value: 'ESPACIO_COMUN', label: 'Espacio Común'  },
] as const

export type TipoNivel = typeof TIPO_NIVEL_OPTIONS[number]['value']

// ─── Tipos (coinciden con InfraestructuraResponseDTO / RequestDTO del backend) ─

export interface InfraestructuraResponse {
  id: number
  empresaRuc: string
  empresaRazonSocial: string
  parentId: number | null
  parentNombre: string | null
  tipo: TipoNivel
  nombre: string
  glosa: string | null
  /** 1 = Oficina, 2 = Almacén, 3 = Centro Comercial. null para nodos no-espacio (edificios, pisos) */
  espacioName: number | null
  /** Suma de consumo de electricidad (kWh) para esta infraestructura. 0 si sin datos. */
  totalConsumoElectricidad: number
  /** Suma de consumo de agua (m³) para esta infraestructura. 0 si sin datos. */
  totalConsumoAgua: number
  createdAt?: string
  updatedAt?: string
}

export interface InfraestructuraRequest {
  empresaRuc: string
  parentId?: number | null
  tipo: TipoNivel
  nombre: string
  glosa?: string | null
  /** 1 = Oficina, 2 = Almacén, 3 = Centro Comercial. Omitir o null para nodos no-espacio. */
  espacioName?: number | null
}

// ─── Servicio ─────────────────────────────────────────────────────────────────

export const infraestructuraService = {
  /**
   * GET /api/infraestructura — lista paginada (Server-Side Pagination).
   * @param page Número de página (0-indexed, default: 0)
   * @param size Registros por página (default: 20)
   */
  getAll: (page = 0, size = 20): Promise<PageableResponse<InfraestructuraResponse>> =>
    api.get<PageableResponse<InfraestructuraResponse>>('/api/infraestructura', { params: { page, size } }).then(r => r.data),

  /** GET /api/infraestructura/{id} */
  getById: (id: number): Promise<InfraestructuraResponse> =>
    api.get<InfraestructuraResponse>(`/api/infraestructura/${id}`).then(r => r.data),

  /** GET /api/infraestructura/empresa/{ruc} — lista plana para selectores */
  getByEmpresa: (ruc: string): Promise<InfraestructuraResponse[]> =>
    api.get<InfraestructuraResponse[]>(`/api/infraestructura/empresa/${ruc}`).then(r => r.data),

  /** POST /api/infraestructura */
  create: (data: InfraestructuraRequest): Promise<InfraestructuraResponse> =>
    api.post<InfraestructuraResponse>('/api/infraestructura', data).then(r => r.data),

  /** PUT /api/infraestructura/{id} */
  update: (id: number, data: InfraestructuraRequest): Promise<InfraestructuraResponse> =>
    api.put<InfraestructuraResponse>(`/api/infraestructura/${id}`, data).then(r => r.data),

  /** DELETE /api/infraestructura/{id} — 204 No Content */
  delete: (id: number): Promise<void> =>
    api.delete(`/api/infraestructura/${id}`).then(() => undefined),
}
