"use client"

import { useRef, useState, useCallback } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

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
    <div className="relative">
      <div
        role="button"
        tabIndex={0}
        aria-label={`Ladda upp produkt ${index + 1}`}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "group flex h-[170px] w-full cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-[14px] border-[1.5px] bg-white transition-all duration-200",
          isDragging
            ? "border-dashed border-[var(--bundla-orange)] bg-[var(--tint-orange)]/40"
            : image
            ? "border-solid border-[var(--line-strong)]"
            : "border-dashed border-[#cfc6b5] hover:border-[var(--bundla-orange)]/60 hover:bg-[var(--surface)]"
        )}
      >
        {image ? (
          <img src={image} alt={label} className="h-full w-full object-contain p-3" />
        ) : (
          <>
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn(
                "transition-colors",
                isDragging ? "text-[var(--bundla-orange)]" : "text-[#bdb3a0] group-hover:text-[var(--bundla-orange)]"
              )}
              aria-hidden="true"
            >
              <path d="M12 16V4M7 9l5-5 5 5M4 20h16" />
            </svg>
            <span className="text-[13px] text-ink-muted">
              {isDragging ? "Släpp här" : "Dra in bild"}
            </span>
          </>
        )}
      </div>

      {image && (
        <button
          onClick={onRemove}
          aria-label={`Ta bort produkt ${index + 1}`}
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border border-[var(--line-warm)] bg-white/90 text-ink-muted shadow-sm backdrop-blur-sm transition-colors hover:text-[var(--bundla-orange-deep)]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

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
