"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface CompositorCanvasProps {
  leftImage: HTMLImageElement | null
  rightImage: HTMLImageElement | null
  backgroundColor: string
  transparent: boolean
  padding: number
  gap: number
  onCanvasReady: (canvas: HTMLCanvasElement) => void
}

const OUTPUT_SIZE = 1000

/**
 * Returns the tight bounding box of non-transparent pixels in an image.
 * If the image has no alpha channel (e.g. JPEG), returns the full image rect.
 */
function getContentBounds(
  img: HTMLImageElement
): { x: number; y: number; w: number; h: number } {
  const offscreen = document.createElement("canvas")
  offscreen.width = img.naturalWidth
  offscreen.height = img.naturalHeight
  const ctx = offscreen.getContext("2d", { willReadFrequently: true })!
  ctx.drawImage(img, 0, 0)

  const { data, width, height } = ctx.getImageData(0, 0, img.naturalWidth, img.naturalHeight)

  let minX = width
  let minY = height
  let maxX = 0
  let maxY = 0
  let hasAlpha = false

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3]
      if (alpha > 10) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
        hasAlpha = true
      }
    }
  }

  // No transparent pixels found — treat as full image (JPEG etc.)
  if (!hasAlpha) {
    return { x: 0, y: 0, w: width, h: height }
  }

  if (maxX < minX || maxY < minY) {
    // Fully transparent fallback
    return { x: 0, y: 0, w: width, h: height }
  }

  return {
    x: minX,
    y: minY,
    w: maxX - minX + 1,
    h: maxY - minY + 1,
  }
}

export function CompositorCanvas({
  leftImage,
  rightImage,
  backgroundColor,
  transparent,
  padding,
  gap,
  onCanvasReady,
}: CompositorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hasContent, setHasContent] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = OUTPUT_SIZE
    canvas.height = OUTPUT_SIZE

    // Fill background
    ctx.clearRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE)
    if (!transparent) {
      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE)
    }

    if (!leftImage && !rightImage) {
      setHasContent(false)
      onCanvasReady(canvas)
      return
    }

    setHasContent(true)

    const availableH = OUTPUT_SIZE - padding * 2
    const availableW = OUTPUT_SIZE - padding * 2

    if (leftImage && rightImage) {
      // Get tight content bounds for each image (removes transparent padding)
      const boundsL = getContentBounds(leftImage)
      const boundsR = getContentBounds(rightImage)

      // Scale each image so its content fills availableH
      const scaleL = availableH / boundsL.h
      const scaleR = availableH / boundsR.h

      let drawWL = boundsL.w * scaleL
      let drawHL = boundsL.h * scaleL
      let drawWR = boundsR.w * scaleR
      let drawHR = boundsR.h * scaleR

      // If the combined width exceeds available width, shrink both proportionally
      const totalW = drawWL + gap + drawWR
      if (totalW > availableW) {
        const shrink = availableW / totalW
        drawWL *= shrink
        drawHL *= shrink
        drawWR *= shrink
        drawHR *= shrink
      }

      // Center the pair horizontally; center each product vertically independently
      const pairW = drawWL + gap + drawWR
      const startX = padding + (availableW - pairW) / 2
      const centerY = padding + availableH / 2

      ctx.drawImage(
        leftImage,
        boundsL.x,
        boundsL.y,
        boundsL.w,
        boundsL.h,
        startX,
        centerY - drawHL / 2,
        drawWL,
        drawHL
      )
      ctx.drawImage(
        rightImage,
        boundsR.x,
        boundsR.y,
        boundsR.w,
        boundsR.h,
        startX + drawWL + gap,
        centerY - drawHR / 2,
        drawWR,
        drawHR
      )
    } else {
      const img = (leftImage || rightImage)!
      const bounds = getContentBounds(img)
      const scale = Math.min(availableW / bounds.w, availableH / bounds.h)
      const drawW = bounds.w * scale
      const drawH = bounds.h * scale
      ctx.drawImage(
        img,
        bounds.x,
        bounds.y,
        bounds.w,
        bounds.h,
        padding + (availableW - drawW) / 2,
        padding + (availableH - drawH) / 2,
        drawW,
        drawH
      )
    }

    onCanvasReady(canvas)
  }, [leftImage, rightImage, backgroundColor, transparent, padding, gap, onCanvasReady])

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Forhandsgranskning</span>
        {hasContent && (
          <span className="text-xs text-muted-foreground">1000 × 1000 px</span>
        )}
      </div>
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-lg border border-border",
          "bg-[repeating-conic-gradient(#d1d5db_0%_25%,#f9fafb_0%_50%)] bg-[length:12px_12px]"
        )}
        style={{ aspectRatio: "1 / 1" }}
      >
        <canvas
          ref={canvasRef}
          aria-label="Sammansatt produktbild"
          className="h-full w-full"
          style={{ aspectRatio: "1 / 1" }}
        />
        {!hasContent && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-muted-foreground px-4 text-center">
              Ladda upp bilder for att se forhandsgranskingen
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
