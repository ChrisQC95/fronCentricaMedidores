import { useCallback, useRef, useState } from 'react'
import { ImagePlus, X, Upload, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { uploadMedidorFoto } from '@/lib/supabase'

// ─── Props ────────────────────────────────────────────────────────────────────

interface PhotoDropzoneProps {
  value:      string | null           // URL actual guardada en el form
  onChange:   (url: string | null) => void
  disabled?:  boolean
}

type UploadState = 'idle' | 'compressing' | 'uploading' | 'done' | 'error'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024)       return `${bytes} B`
  if (bytes < 1048576)    return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function PhotoDropzone({ value, onChange, disabled = false }: PhotoDropzoneProps) {
  const inputRef        = useRef<HTMLInputElement>(null)
  const [isDragging,    setIsDragging]    = useState(false)
  const [uploadState,   setUploadState]   = useState<UploadState>('idle')
  const [errorMsg,      setErrorMsg]      = useState<string | null>(null)
  const [previewUrl,    setPreviewUrl]    = useState<string | null>(value)
  const [fileInfo,      setFileInfo]      = useState<{ name: string; origSize: number } | null>(null)

  const stateLabel: Record<UploadState, string> = {
    idle:        'Arrastra una imagen aquí o haz clic para seleccionar',
    compressing: 'Comprimiendo imagen...',
    uploading:   'Subiendo a Supabase Storage...',
    done:        'Foto subida correctamente',
    error:       errorMsg ?? 'Error al subir la imagen',
  }

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Solo se permiten imágenes (JPEG, PNG, WebP).')
      setUploadState('error')
      return
    }
    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('La imagen supera el límite de 15 MB.')
      setUploadState('error')
      return
    }

    // Preview local inmediato (sin esperar upload)
    const localUrl = URL.createObjectURL(file)
    setPreviewUrl(localUrl)
    setFileInfo({ name: file.name, origSize: file.size })
    setErrorMsg(null)

    try {
      setUploadState('compressing')
      // Un tick para que React renderice el estado "compressing"
      await new Promise(r => setTimeout(r, 50))

      setUploadState('uploading')
      const { publicUrl } = await uploadMedidorFoto(file)

      URL.revokeObjectURL(localUrl)
      setPreviewUrl(publicUrl)
      onChange(publicUrl)
      setUploadState('done')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      setErrorMsg(msg)
      setUploadState('error')
      setPreviewUrl(null)
      onChange(null)
    }
  }, [onChange])

  // ── Handlers drag & drop ───────────────────────────────────────────────────
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true)  }
  const handleDragLeave = ()                    => setIsDragging(false)
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  const handleRemove = () => {
    setPreviewUrl(null)
    setUploadState('idle')
    setErrorMsg(null)
    setFileInfo(null)
    onChange(null)
  }

  const isLoading = uploadState === 'compressing' || uploadState === 'uploading'

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleFileChange}
        disabled={disabled || isLoading}
      />

      {previewUrl ? (
        /* ── Vista previa + controles ── */
        <div className="relative overflow-hidden rounded-xl border border-border bg-muted/20">
          <img
            src={previewUrl}
            alt="Vista previa"
            className="w-full max-h-52 object-cover"
          />

          {/* Overlay de estado */}
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 backdrop-blur-sm">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/30 border-t-white" />
              <p className="text-xs font-medium text-white">
                {uploadState === 'compressing' ? 'Comprimiendo...' : 'Subiendo...'}
              </p>
            </div>
          )}

          {/* Botón de eliminar */}
          {!isLoading && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled}
              className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition hover:bg-black/80"
              aria-label="Eliminar foto"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Info de archivo + estado */}
          <div className={cn(
            'flex items-center gap-2 border-t border-border px-3 py-2 text-xs',
            uploadState === 'done'  ? 'bg-green-50 dark:bg-green-950/20'  : '',
            uploadState === 'error' ? 'bg-red-50 dark:bg-red-950/20'     : 'bg-background',
          )}>
            {uploadState === 'done' && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-600" />}
            {uploadState === 'error' && <AlertCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />}
            <span className="truncate text-muted-foreground">
              {fileInfo?.name ?? 'foto'}
              {fileInfo?.origSize ? ` (original ${formatBytes(fileInfo.origSize)})` : ''}
            </span>
            {uploadState === 'done' && (
              <span className="ml-auto shrink-0 text-green-600 font-medium">Subida ✓</span>
            )}
          </div>
        </div>
      ) : (
        /* ── Zona de drop ── */
        <div
          onClick={() => !disabled && !isLoading && inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 transition-all',
            isDragging
              ? 'border-primary bg-primary/5 scale-[1.01]'
              : 'border-border bg-muted/20 hover:border-primary/50 hover:bg-primary/5',
            (disabled || isLoading) && 'cursor-not-allowed opacity-60',
          )}
        >
          <div className={cn(
            'flex h-12 w-12 items-center justify-center rounded-xl transition-colors',
            isDragging ? 'bg-primary/20' : 'bg-muted group-hover:bg-primary/10',
          )}>
            {isLoading
              ? <Upload className="h-6 w-6 animate-bounce text-primary" />
              : <ImagePlus className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
            }
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              {isDragging ? '¡Suelta la imagen!' : 'Arrastra o haz clic para subir'}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              JPEG, PNG, WebP — máx. 15 MB · Se comprime automáticamente
            </p>
          </div>
        </div>
      )}

      {/* Error sin preview */}
      {uploadState === 'error' && !previewUrl && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
          <p className="text-xs text-destructive">{errorMsg}</p>
        </div>
      )}
    </div>
  )
}
