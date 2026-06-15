import api from '@/lib/api'
import type { PageableResponse } from '@/types/pagination'

// ─── Tipos (coinciden con EmpresaDTO del backend) ─────────────────────────────

export interface Empresa {
  ruc: string
  razonSocial: string
  createdAt?: string
  updatedAt?: string
}

export interface CreateEmpresaPayload {
  ruc: string
  razonSocial: string
}

export interface UpdateEmpresaPayload {
  ruc: string
  razonSocial: string
}

export interface CargaMasivaResponse {
  procesados: number
  exitosos: number
  errores: number
  detalleErrores: string[]
}

// ─── Servicio ─────────────────────────────────────────────────────────────────

export const empresaService = {
  /**
   * GET /api/empresas — lista paginada (Server-Side Pagination).
   * @param page Número de página (0-indexed, default: 0)
   * @param size Registros por página (default: 10)
   */
  getAll: (page = 0, size = 10): Promise<PageableResponse<Empresa>> =>
    api.get<PageableResponse<Empresa>>('/api/empresas', { params: { page, size } }).then(r => r.data),

  /** GET /api/empresas/{ruc} */
  getById: (ruc: string): Promise<Empresa> =>
    api.get<Empresa>(`/api/empresas/${ruc}`).then(r => r.data),

  /** POST /api/empresas */
  create: (data: CreateEmpresaPayload): Promise<Empresa> =>
    api.post<Empresa>('/api/empresas', data).then(r => r.data),

  /** PUT /api/empresas/{ruc} */
  update: (ruc: string, data: UpdateEmpresaPayload): Promise<Empresa> =>
    api.put<Empresa>(`/api/empresas/${ruc}`, data).then(r => r.data),

  /** DELETE /api/empresas/{ruc} — retorna 204 No Content */
  delete: (ruc: string): Promise<void> =>
    api.delete(`/api/empresas/${ruc}`).then(() => undefined),

  /** GET /api/empresas/plantilla — descarga archivo Excel */
  downloadTemplate: (): Promise<Blob> =>
    api.get<Blob>('/api/empresas/plantilla', { responseType: 'blob' }).then(r => r.data),

  /** POST /api/empresas/upload — sube archivo Excel */
  uploadMasivo: (file: File): Promise<CargaMasivaResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post<CargaMasivaResponse>('/api/empresas/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(r => r.data)
  }
}
