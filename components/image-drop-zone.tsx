"use client"

import { useRef, useState, useCallback } from "react"
import { Upload, X, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface ImageDropZoneProps {
  label: string
  image: string | null
  onImageChange: (dataUrl: string, file: File) => void
  onRemove: () => void
  index: number
}

export function ImageDropZone({
  label,
  image,
  onImageChange,
  onRemove,
  index,
}: ImageDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const processFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        onImageChange(result, file)
      }
      reader.readAsDataURL(file)
    },
    [onImageChange]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ""
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          Produkt {index + 1}
        </span>
        {image && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-7 px-2 text-muted-foreground hover:text-destructive"
            aria-label={`Ta bort bild ${index + 1}`}
          >
            <X className="h-3.5 w-3.5" />
            <span className="ml-1 text-xs">Ta bort</span>
          </Button>
        )}
      </div>

      <div
        role="button"
        tabIndex={0}
        aria-label={`Ladda upp ${label}`}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "relative flex aspect-square w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed transition-all",
          isDragging
            ? "border-accent bg-accent/5 scale-[1.01]"
            : image
            ? "border-border bg-card"
            : "border-border bg-secondary/50 hover:border-accent/60 hover:bg-accent/5"
        )}
      >
        {image ? (
          <img
            src={image}
            alt={label}
            className="h-full w-full object-contain p-3"
          />
        ) : (
          <div className="flex flex-col items-center gap-3 p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
              {isDragging ? (
                <ImageIcon className="h-6 w-6 text-accent" />
              ) : (
                <Upload className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {isDragging ? "Släpp bilden här" : label}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                PNG, WebP, JPG upp till 20 MB
              </p>
            </div>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleFileChange}
        aria-hidden="true"
      />
    </div>
  )
}
