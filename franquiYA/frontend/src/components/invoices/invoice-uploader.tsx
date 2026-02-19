'use client'

import { useState, useCallback } from 'react'
import { Upload, FileText, Check, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface InvoiceUploaderProps {
  onUpload: (file: File) => Promise<void>
  loading: boolean
}

export function InvoiceUploader({ onUpload, loading }: InvoiceUploaderProps) {
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile)
      }
    }
  }, [])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }, [])

  const handleUpload = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (file) {
      await onUpload(file)
      setFile(null)
    }
  }

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setFile(null)
  }

  return (
    <Card className="border-border bg-secondary">
      <CardContent className="p-6">
        <div
          className={cn(
            'relative rounded-xl border-2 border-dashed p-8 transition-colors',
            dragActive ? 'border-[#E31D2B] bg-[#E31D2B]/10' : 'border-border',
            file && 'border-emerald-500 bg-emerald-500/10'
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {!file && (
            <input
              type="file"
              accept=".pdf"
              onChange={handleChange}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          )}

          <div className="flex flex-col items-center justify-center text-center pointer-events-none">
            {file ? (
              <>
                <div className="mb-4 rounded-full bg-emerald-500/20 p-3">
                  <FileText className="h-8 w-8 text-emerald-500" />
                </div>
                <p className="mb-2 font-medium text-white">{file.name}</p>
                <p className="mb-4 text-sm text-gray-400">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
                <div className="flex gap-3 pointer-events-auto">
                  <Button
                    onClick={handleUpload}
                    disabled={loading}
                    className="bg-[#E31D2B] hover:bg-[#C41925]"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Procesando...
                      </span>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Procesar Factura
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={loading}
                    className="border-border text-gray-400 hover:text-white"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancelar
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-4 rounded-full bg-muted p-3">
                  <Upload className="h-8 w-8 text-gray-400" />
                </div>
                <p className="mb-1 font-medium text-white">
                  Arrastra tu factura PDF aquí
                </p>
                <p className="text-sm text-gray-400">
                  o haz click para seleccionar el archivo
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  Facturas de Helacor S.A. • Formato PDF
                </p>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
