import api from '@/lib/api'

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
  razonSocial: string
}

// ─── Servicio ─────────────────────────────────────────────────────────────────

export const empresaService = {
  /** GET /api/empresas — lista completa */
  getAll: (): Promise<Empresa[]> =>
    api.get<Empresa[]>('/api/empresas').then(r => r.data),

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
}
