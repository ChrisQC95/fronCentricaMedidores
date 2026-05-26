// Reutilizamos el mismo DataTable genérico que usa la vista de Empresas.
// Lo re-exportamos desde aquí para que las importaciones de este módulo
// sean autocontenidas y no dependan de rutas cruzadas entre features.
export { DataTable } from '@/components/empresas/EmpresaDataTable'
