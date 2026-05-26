import { createClient } from '@supabase/supabase-js'

// ─── Cliente Supabase ─────────────────────────────────────────────────────────

const SUPABASE_URL    = import.meta.env.VITE_SUPABASE_URL    as string
const SUPABASE_ANON   = import.meta.env.VITE_SUPABASE_ANON_KEY as string
const BUCKET          = (import.meta.env.VITE_SUPABASE_BUCKET as string) || 'medidores-fotos'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)

// ─── Compresión de imagen vía Canvas ─────────────────────────────────────────

/**
 * Comprime y redimensiona una imagen con el Canvas API del navegador.
 * - Recorta proporcionalmente si supera maxPx (ancho o alto)
 * - Convierte siempre a JPEG con calidad configurable
 * - Reduce el tamaño de subida hasta un 70-80%
 */
async function compressImage(
  file: File,
  maxPx = 1280,
  quality = 0.82,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img   = new Image()
    const objUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objUrl)

      const { width, height } = img
      const scale = Math.min(maxPx / width, maxPx / height, 1) // no ampliar

      const canvas = document.createElement('canvas')
      canvas.width  = Math.round(width  * scale)
      canvas.height = Math.round(height * scale)

      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('Canvas no disponible')); return }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      canvas.toBlob(
        blob => (blob ? resolve(blob) : reject(new Error('Error al comprimir imagen'))),
        'image/jpeg',
        quality,
      )
    }

    img.onerror = () => { URL.revokeObjectURL(objUrl); reject(new Error('Imagen inválida')) }
    img.src = objUrl
  })
}

// ─── Upload a Supabase Storage ────────────────────────────────────────────────

export interface UploadResult {
  path:      string
  publicUrl: string
}

/**
 * Sube una imagen al bucket de Supabase Storage.
 * Flujo optimizado:
 *   1. Compresión Canvas (max 1280px, JPEG 82%)
 *   2. Nombre único: timestamp + random hex
 *   3. Upload al bucket bajo carpeta /registros/
 *   4. Retorna path relativo + URL pública directa
 */
export async function uploadMedidorFoto(file: File): Promise<UploadResult> {
  // Validaciones previas a la compresión
  if (!file.type.startsWith('image/')) {
    throw new Error('Solo se permiten archivos de imagen.')
  }
  if (file.size > 15 * 1024 * 1024) {
    throw new Error('La imagen no debe superar 15 MB.')
  }

  const compressed = await compressImage(file)
  const filename   = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}.jpg`
  const path       = `registros/${filename}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, compressed, { contentType: 'image/jpeg', upsert: false })

  if (error) throw new Error(`Error al subir foto: ${error.message}`)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)

  return { path, publicUrl: data.publicUrl }
}
