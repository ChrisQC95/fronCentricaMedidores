import api from '@/lib/api'

export interface MedidoresPorMesDTO {
  mes:         string
  registrados: number
}

export interface ConsumoMensualDTO {
  mes:     string
  consumo: number
}

export interface ActividadRecienteDTO {
  id:            number
  puntoMedicion: string
  tipo:          string
  empresaNombre: string
  voltaje:       number
  consumo:       number | null
  fechaRegistro: string
  createdAt:     string | null
}

export interface DashboardStats {
  totalEmpresas:     number
  totalEdificios:    number
  totalPisos:        number
  totalEnst:         number
  medidoresPorMes:   MedidoresPorMesDTO[]
  consumoMensual:    ConsumoMensualDTO[]
  actividadReciente: ActividadRecienteDTO[]
}

class DashboardService {
  async getStats(): Promise<DashboardStats> {
    const { data } = await api.get<DashboardStats>('/api/dashboard/stats')
    return data
  }
}

export const dashboardService = new DashboardService()
