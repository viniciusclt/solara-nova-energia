"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, X } from "lucide-react"

interface FileUploadProps {
  onFileSelect: (files: FileList | null) => void
  accept?: string
  multiple?: boolean
  maxSize?: number
  className?: string
  disabled?: boolean
}

export function FileUpload({
  onFileSelect,
  accept,
  multiple = false,
  maxSize,
  className,
  disabled = false,
  ...props
}: FileUploadProps) {
  const [dragActive, setDragActive] = React.useState(false)
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([])
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleDrag = React.useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (disabled) return

      const files = e.dataTransfer.files
      if (files && files.length > 0) {
        const fileArray = Array.from(files)
        setSelectedFiles(fileArray)
        onFileSelect(files)
      }
    },
    [disabled, onFileSelect]
  )

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault()
      if (disabled) return

      const files = e.target.files
      if (files && files.length > 0) {
        const fileArray = Array.from(files)
        setSelectedFiles(fileArray)
        onFileSelect(files)
      }
    },
    [disabled, onFileSelect]
  )

  const removeFile = React.useCallback(
    (index: number) => {
      const newFiles = selectedFiles.filter((_, i) => i !== index)
      setSelectedFiles(newFiles)
      
      const dataTransfer = new DataTransfer()
      newFiles.forEach(file => dataTransfer.items.add(file))
      onFileSelect(dataTransfer.files)
    },
    [selectedFiles, onFileSelect]
  )

  const openFileDialog = () => {
    if (inputRef.current) {
      inputRef.current.click()
    }
  }

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 transition-colors",
          dragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          {...props}
        />
        
        <div className="flex flex-col items-center justify-center space-y-2 text-center">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-sm font-medium">
              Arraste arquivos aqui ou{" "}
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto font-medium"
                onClick={openFileDialog}
                disabled={disabled}
              >
                clique para selecionar
              </Button>
            </p>
            {accept && (
              <p className="text-xs text-muted-foreground">
                Formatos aceitos: {accept}
              </p>
            )}
            {maxSize && (
              <p className="text-xs text-muted-foreground">
                Tamanho máximo: {(maxSize / 1024 / 1024).toFixed(1)}MB
              </p>
            )}
          </div>
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <Label className="text-sm font-medium">Arquivos selecionados:</Label>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-muted rounded-md"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}