"use client"

import { useEffect, useRef, useState } from "react"

interface CompositorCanvasProps {
  leftImage: HTMLImageElement | null
  rightImage: HTMLImageElement | null
  backgroundColor: string
  transparent: boolean
  padding: number
  gap: number
  showPlus: boolean
  showGrid: boolean
  scanning: boolean
  plusFrac: number
  offsetL: number
  offsetR: number
  gridLines: number[]
  outputW: number
  outputH: number
  onCanvasReady: (canvas: HTMLCanvasElement) => void
}

// Scanner laser colour (kept teal on purpose, like the source design).
const SCAN = "#14b8a6"
const scanRgba = (a: number) => `rgba(20, 184, 166, ${a})`

// Thickness of the "+" bars relative to its size, and its colour.
const PLUS_BAR_FRAC = 0.32
const PLUS_COLOR = "#9e9e9e"

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

  // No transparent pixels found, treat as full image (JPEG etc.)
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

/** Draws a sharp-cornered "+" separator centred at (cx, cy). */
function drawPlus(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  const bar = Math.round(size * PLUS_BAR_FRAC)
  const full = Math.round(size)
  const x = Math.round(cx - full / 2)
  const y = Math.round(cy - full / 2)
  const barOffset = Math.round(cy - bar / 2) // shared centre line for both bars
  ctx.save()
  ctx.fillStyle = PLUS_COLOR
  // Integer coords + square corners keep the cross crisp (no rounded edges).
  ctx.fillRect(x, barOffset, full, bar) // horizontal bar
  ctx.fillRect(Math.round(cx - bar / 2), y, bar, full) // vertical bar
  ctx.restore()
}

export function CompositorCanvas({
  leftImage,
  rightImage,
  backgroundColor,
  transparent,
  padding,
  gap,
  showPlus,
  showGrid,
  scanning,
  plusFrac,
  offsetL,
  offsetR,
  gridLines,
  outputW,
  outputH,
  onCanvasReady,
}: CompositorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hasContent, setHasContent] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = outputW
    canvas.height = outputH

    // Fill background
    ctx.clearRect(0, 0, outputW, outputH)
    if (!transparent) {
      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, outputW, outputH)
    }

    if (!leftImage && !rightImage) {
      setHasContent(false)
      onCanvasReady(canvas)
      return
    }

    setHasContent(true)

    const availableH = Math.max(1, outputH - padding * 2)
    const availableW = Math.max(1, outputW - padding * 2)
    // Vertical centre line of the content band (products and the "+" centre on it).
    const centerY = padding + availableH / 2

    if (leftImage && rightImage) {
      const boundsL = getContentBounds(leftImage)
      const boundsR = getContentBounds(rightImage)

      // `gap` is the actual distance between the two products' inner edges; the
      // "+" is drawn centred inside it (sized independently, never wider than gap).
      const sepW = gap
      const plusSize = showPlus ? Math.min(outputH * plusFrac, gap) : 0

      // Each product fits within its own half (width capped at halfW, height at
      // availableH), preserving aspect. This keeps real proportions: a flat hob
      // stays flat instead of being blown up to a tall oven's height.
      const halfW = Math.max(1, (availableW - sepW) / 2)
      const scaleL = Math.min(halfW / boundsL.w, availableH / boundsL.h)
      const scaleR = Math.min(halfW / boundsR.w, availableH / boundsR.h)
      const drawWL = boundsL.w * scaleL
      const drawHL = boundsL.h * scaleL
      const drawWR = boundsR.w * scaleR
      const drawHR = boundsR.h * scaleR

      // "+" fixed at the horizontal centre; products hug the centre gap and are
      // centred vertically in the band. Tall products that fill the band still
      // reach top and bottom; shorter products sit balanced (not bottom-heavy).
      const cx = outputW / 2
      const leftInnerEdge = cx - sepW / 2
      const rightInnerEdge = cx + sepW / 2

      // Per-product vertical nudge (positive = up) lets you lift one product
      // above the other (e.g. a wall oven over a hob), like Tretti's built-ins.
      ctx.drawImage(
        leftImage,
        boundsL.x,
        boundsL.y,
        boundsL.w,
        boundsL.h,
        leftInnerEdge - drawWL,
        centerY - drawHL / 2 - offsetL,
        drawWL,
        drawHL
      )
      ctx.drawImage(
        rightImage,
        boundsR.x,
        boundsR.y,
        boundsR.w,
        boundsR.h,
        rightInnerEdge,
        centerY - drawHR / 2 - offsetR,
        drawWR,
        drawHR
      )

      if (showPlus) {
        drawPlus(ctx, cx, centerY, plusSize)
      }
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
        centerY - drawH / 2,
        drawW,
        drawH
      )
    }

    onCanvasReady(canvas)
  }, [
    leftImage,
    rightImage,
    backgroundColor,
    transparent,
    padding,
    gap,
    showPlus,
    plusFrac,
    offsetL,
    offsetR,
    outputW,
    outputH,
    onCanvasReady,
  ])

  return (
    <div className="flex justify-center rounded-[22px] border border-[var(--line-warm)] bg-white p-4 shadow-[var(--shadow-pop)] sm:p-5">
      <div
        className="checker relative w-full max-w-[680px] overflow-hidden rounded-2xl"
        style={{ aspectRatio: `${outputW} / ${outputH}` }}
      >
        <canvas
          ref={canvasRef}
          aria-label="Sammansatt produktbild"
          className="h-full w-full"
          style={{ aspectRatio: `${outputW} / ${outputH}` }}
        />
        {scanning && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            {/* scan grid */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `repeating-linear-gradient(0deg, ${scanRgba(
                  0.1
                )} 0 1px, transparent 1px 26px), repeating-linear-gradient(90deg, ${scanRgba(
                  0.1
                )} 0 1px, transparent 1px 26px)`,
              }}
            />
            {/* focus reticle corners */}
            <div className="absolute inset-3">
              {[
                "left-0 top-0 rounded-tl-[4px] border-l-2 border-t-2",
                "right-0 top-0 rounded-tr-[4px] border-r-2 border-t-2",
                "bottom-0 left-0 rounded-bl-[4px] border-b-2 border-l-2",
                "bottom-0 right-0 rounded-br-[4px] border-b-2 border-r-2",
              ].map((c) => (
                <span key={c} className={`absolute h-5 w-5 ${c}`} style={{ borderColor: SCAN }} />
              ))}
            </div>
            {/* sweeping laser beam */}
            <div className="scan-beam absolute left-0 right-0">
              <div
                className="absolute bottom-0 left-0 right-0 h-[120px]"
                style={{ background: `linear-gradient(to bottom, ${scanRgba(0)}, ${scanRgba(0.22)})` }}
              />
              <div
                className="absolute left-0 right-0 top-0 h-[40px]"
                style={{ background: `linear-gradient(to top, ${scanRgba(0)}, ${scanRgba(0.18)})` }}
              />
              <div
                className="absolute left-0 right-0 top-0 h-[2px]"
                style={{ background: SCAN, boxShadow: `0 0 10px ${SCAN}, 0 0 22px ${SCAN}` }}
              />
            </div>
          </div>
        )}
        {showGrid && (
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            {/* The template's horizontal guide lines (e.g. Tretti's grid). */}
            {gridLines.map((fr, i) => (
              <div
                key={i}
                className="absolute left-0 right-0 border-t border-dashed border-[var(--bundla-orange)]/60"
                style={{ top: `${fr * 100}%` }}
              />
            ))}
            {/* Centre lines */}
            <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-[var(--bundla-orange)]/25" />
            <div className="absolute bottom-0 left-1/2 top-0 border-l border-dashed border-[var(--bundla-orange)]/25" />
          </div>
        )}
        {!hasContent && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="px-4 text-center text-sm text-ink-muted">Förhandsvisning av din bundle</p>
          </div>
        )}
      </div>
    </div>
  )
}
