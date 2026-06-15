import { useState, useRef } from 'react'
import { UploadCloud, Download, FileSpreadsheet, X, CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { empresaService, type CargaMasivaResponse } from '@/services/empresa.service'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface CargaMasivaEmpresaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CargaMasivaEmpresaDialog({
  open,
  onOpenChange,
  onSuccess,
}: CargaMasivaEmpresaDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [response, setResponse] = useState<CargaMasivaResponse | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDownloadTemplate = async () => {
    setIsDownloading(true)
    try {
      const blob = await empresaService.downloadTemplate()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'plantilla_empresas.xlsx'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Plantilla descargada', { description: 'El archivo Excel se descargó correctamente.' })
    } catch (err) {
      toast.error('Error al descargar', { description: 'No se pudo descargar la plantilla de empresas.' })
    } finally {
      setIsDownloading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      if (!selectedFile.name.endsWith('.xlsx')) {
        toast.error('Archivo no válido', { description: 'Solo se permiten archivos .xlsx' })
        return
      }
      setFile(selectedFile)
      setResponse(null) // Reset earlier responses
    }
  }

  const clearFile = () => {
    setFile(null)
    setResponse(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    setResponse(null)
    
    try {
      const res = await empresaService.uploadMasivo(file)
      setResponse(res)
      if (res.exitosos > 0) {
        toast.success('Carga procesada', { description: `Se guardaron ${res.exitosos} empresas con éxito.` })
        onSuccess()
      } else if (res.errores > 0) {
        toast.warning('Carga con errores', { description: 'No se guardó ninguna empresa.' })
      }
    } catch (err) {
      const msg = isAxiosError(err)
        ? (err.response?.data?.error ?? err.response?.data?.message ?? 'Ocurrió un error al procesar el archivo.')
        : 'Error inesperado.'
      toast.error('Error al subir', { description: msg })
    } finally {
      setIsUploading(false)
    }
  }

  const resetAndClose = () => {
    clearFile()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) resetAndClose()
      else onOpenChange(val)
    }}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <UploadCloud className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base">Carga Masiva de Empresas</DialogTitle>
              <DialogDescription className="text-xs">
                Sube un archivo Excel (.xlsx) para registrar múltiples empresas a la vez.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-3">
          {/* Instrucciones y Plantilla */}
          <Alert className="bg-muted/50 border-border">
            <Info className="h-4 w-4" />
            <AlertTitle className="text-sm font-semibold">Instrucciones</AlertTitle>
            <AlertDescription className="text-xs text-muted-foreground mt-1 flex flex-col gap-2">
              <p>1. Descarga la plantilla oficial.</p>
              <p>2. Llena los datos obligatorios (RUC de 11 dígitos y Razón Social).</p>
              <p>3. Sube el archivo completado. Los registros duplicados se omitirán.</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-fit gap-2 mt-1 h-8"
                onClick={handleDownloadTemplate}
                disabled={isDownloading || isUploading}
              >
                {isDownloading ? (
                   <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-foreground/30 border-t-foreground" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                Descargar Plantilla
              </Button>
            </AlertDescription>
          </Alert>

          {/* Zona de Drag & Drop (Simulada) */}
          {!response && (
            <div className="flex flex-col gap-2">
              <div 
                className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/10 px-6 py-8 text-center hover:bg-muted/20 transition-colors ${file ? 'border-primary/50 bg-primary/5' : ''}`}
              >
                <input
                  type="file"
                  accept=".xlsx"
                  className="absolute inset-0 z-10 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  disabled={isUploading}
                />
                
                {file ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileSpreadsheet className="h-10 w-10 text-primary" />
                    <p className="text-sm font-medium text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <UploadCloud className="h-10 w-10 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">
                      Haz clic o arrastra un archivo aquí
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Solo archivos Excel (.xlsx)
                    </p>
                  </div>
                )}
              </div>

              {file && !isUploading && (
                <div className="flex justify-end">
                  <Button variant="ghost" size="sm" onClick={clearFile} className="h-8 gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10">
                    <X className="h-3.5 w-3.5" />
                    Quitar archivo
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Resultados de la carga */}
          {response && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center justify-center rounded-lg bg-muted/50 p-3 border border-border">
                  <span className="text-2xl font-bold text-foreground">{response.procesados}</span>
                  <span className="text-xs text-muted-foreground text-center">Procesados</span>
                </div>
                <div className="flex flex-col items-center justify-center rounded-lg bg-emerald-500/10 p-3 border border-emerald-500/20">
                  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{response.exitosos}</span>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 text-center">Exitosos</span>
                </div>
                <div className="flex flex-col items-center justify-center rounded-lg bg-destructive/10 p-3 border border-destructive/20">
                  <span className="text-2xl font-bold text-destructive">{response.errores}</span>
                  <span className="text-xs text-destructive text-center">Errores</span>
                </div>
              </div>

              {response.errores > 0 && response.detalleErrores && response.detalleErrores.length > 0 && (
                <Alert variant="destructive" className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="text-sm">Detalle de Errores</AlertTitle>
                  </div>
                  <AlertDescription>
                    <div className="h-28 overflow-y-auto rounded-md border border-destructive/20 bg-destructive/5 p-2">
                      <ul className="list-inside list-disc text-xs space-y-1">
                        {response.detalleErrores.map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              
              {response.exitosos > 0 && response.errores === 0 && (
                <Alert className="bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4 stroke-emerald-600 dark:stroke-emerald-400" />
                  <AlertTitle className="text-sm font-bold">¡Carga Completada!</AlertTitle>
                  <AlertDescription className="text-xs mt-1 text-emerald-600/90 dark:text-emerald-400/90">
                    Todos los registros fueron procesados e insertados correctamente.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={resetAndClose}
            disabled={isUploading}
          >
            {response ? 'Cerrar' : 'Cancelar'}
          </Button>
          {!response && (
            <Button
              type="button"
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="min-w-24 gap-2 bg-primary hover:bg-primary/90"
            >
              {isUploading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                  Subiendo...
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4" />
                  Procesar Archivo
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
