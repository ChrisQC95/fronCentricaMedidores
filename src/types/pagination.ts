/**
 * Representa la estructura de respuesta paginada de Spring Boot.
 * Mapea directamente los campos que Spring Data devuelve en el JSON.
 */
export interface PageableResponse<T> {
  /** Los registros de la página actual */
  content: T[]
  /** Número de página actual (0-indexed) */
  number: number
  /** Tamaño de la página solicitada */
  size: number
  /** Total de elementos en todas las páginas */
  totalElements: number
  /** Total de páginas disponibles */
  totalPages: number
  /** Si es la primera página */
  first: boolean
  /** Si es la última página */
  last: boolean
  /** Si el contenido está vacío */
  empty: boolean
}
