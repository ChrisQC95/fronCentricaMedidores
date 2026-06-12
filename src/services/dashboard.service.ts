import api from '@/lib/api'

export interface MedidoresPorMesDTO {
  mes:         string
  registrados: number
}

export interface ConsumoMensualDTO {
  mes:        string
  consumoLuz: number
  consumoAgua: number
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
  tipoServicio:  number | null
}

export interface DashboardStats {
  totalEmpresas:       number
  totalElectricidad:   number
  totalAgua:           number
  totalPuntosMedicion: number
  totalEdificios:      number
  totalPisos:          number
  totalEnst:           number
  pendingReadings:     number
  consumoTendenciaPct: number | null
  medidoresPorMes:     MedidoresPorMesDTO[]
  consumoMensualLuz:   ConsumoMensualDTO[]
  consumoMensualAgua:  ConsumoMensualDTO[]
  actividadReciente:   ActividadRecienteDTO[]
}

class DashboardService {
  async getStats(): Promise<DashboardStats> {
    const { data } = await api.get<DashboardStats>('/api/dashboard/stats')
    return data
  }
}

export const dashboardService = new DashboardService()
