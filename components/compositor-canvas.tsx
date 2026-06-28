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
  /** True while we wait for friläggning to come back (indeterminate sweep). */
  scanning: boolean
  /** Bumped by the parent the moment friläggning succeeds; triggers the dissolve. */
  revealKey: number
  plusFrac: number
  offsetL: number
  offsetR: number
  gridLines: number[]
  outputW: number
  outputH: number
  onCanvasReady: (canvas: HTMLCanvasElement) => void
}

// Friläggning animation (an "x-ray scanning pass", per the source design).
// A radiograph band sweeps the product; while we wait for the API it loops as a
// scout pass, and once the cutout lands it does one extraction pass where the
// original (with background) dissolves away behind the band.
const FEATHER = 9 // soft % feather on either side of the dissolve edge
const SCOUT_MS = 1500 // one loop of the indeterminate scout pass
const EXTRACT_MS = 1700 // the final extraction pass (band + dissolve)
// X-ray "lens" band: solid for ±BAND_SOLID px, feathering out to ±BAND_FEATHER.
const BAND_SOLID = 16
const BAND_FEATHER = 46
// Radiograph look applied to the product inside the band.
const XRAY_FILTER = "invert(1) contrast(1.45) brightness(1.05) hue-rotate(160deg) saturate(1.7)"
const XRAY_TINT = "linear-gradient(135deg, #0a3a4a, #0d7a8f)"

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
  revealKey,
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

  // X-ray scan: a snapshot of the "before" (original, with background) composite
  // is used both for the radiograph band and as the layer that dissolves away to
  // uncover the freshly drawn cutout underneath.
  const [active, setActive] = useState(false)
  const [snapSrc, setSnapSrc] = useState<string | null>(null)
  const origRef = useRef<HTMLImageElement>(null) // dissolving original
  const xrayRef = useRef<HTMLImageElement>(null) // radiograph copy (banded)
  const tintRef = useRef<HTMLDivElement>(null) // cyan tint (banded)
  // 'scout' = looping pre-scan while we wait; 'extract' = final dissolving pass.
  const phaseRef = useRef<"scout" | "extract">("scout")
  const scoutStartRef = useRef<number | null>(null)
  const extractStartRef = useRef<number | null>(null)
  const prevScanningRef = useRef(false)
  const prevRevealRef = useRef(0)

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

  // Phase machine: snapshot on scan start (scout), switch to the extraction pass
  // when the parent signals success, and stop if scanning ends without a result.
  useEffect(() => {
    const startedScanning = scanning && !prevScanningRef.current
    const finished = revealKey > 0 && revealKey !== prevRevealRef.current

    if (startedScanning && hasContent && canvasRef.current) {
      try {
        setSnapSrc(canvasRef.current.toDataURL("image/png"))
        phaseRef.current = "scout"
        scoutStartRef.current = null
        setActive(true)
      } catch {
        setSnapSrc(null)
      }
    }

    if (finished) {
      // Hand off from the looping scout to the one-shot extraction pass.
      phaseRef.current = "extract"
      extractStartRef.current = null
      setActive(true)
    } else if (!scanning && prevScanningRef.current && phaseRef.current === "scout") {
      // Scanning stopped without success (error/cancel) — drop the overlay.
      setActive(false)
    }

    prevScanningRef.current = scanning
    prevRevealRef.current = revealKey
  }, [scanning, revealKey, hasContent])

  // Drive the scan with requestAnimationFrame, mutating mask styles directly so
  // we don't re-render every frame. `phaseRef` is read live, so the scout→extract
  // hand-off is picked up mid-flight without restarting the loop.
  useEffect(() => {
    if (!active) return

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    if (reduce) {
      // No motion: just let the cutout stand once we reach the extract phase.
      if (phaseRef.current === "extract") setActive(false)
      return
    }

    let raf = 0

    const apply = (bandPct: number, dissolvePct: number) => {
      const bandMask = `linear-gradient(to bottom, transparent calc(${bandPct}% - ${BAND_FEATHER}px), #000 calc(${bandPct}% - ${BAND_SOLID}px), #000 calc(${bandPct}% + ${BAND_SOLID}px), transparent calc(${bandPct}% + ${BAND_FEATHER}px))`
      for (const el of [xrayRef.current, tintRef.current]) {
        if (el) {
          el.style.webkitMaskImage = bandMask
          el.style.maskImage = bandMask
        }
      }
      const a = Math.max(0, dissolvePct - FEATHER)
      const b = Math.min(100, dissolvePct + FEATHER)
      const dMask = `linear-gradient(to bottom, transparent ${a}%, #000 ${b}%)`
      if (origRef.current) {
        const m = dissolvePct <= 0 ? "none" : dMask
        origRef.current.style.webkitMaskImage = m
        origRef.current.style.maskImage = m
      }
    }

    const step = (t: number) => {
      if (phaseRef.current === "extract") {
        if (extractStartRef.current === null) extractStartRef.current = t
        const pos = Math.min(1, (t - extractStartRef.current) / EXTRACT_MS)
        apply(pos * 100, pos * 100)
        if (pos >= 1) {
          setActive(false)
          return
        }
      } else {
        if (scoutStartRef.current === null) scoutStartRef.current = t
        const p = ((t - scoutStartRef.current) % SCOUT_MS) / SCOUT_MS
        apply(p * 100, 0)
      }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [active])

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

        {/* X-ray scan: radiograph band over the original; during the extraction
            pass the original layer dissolves to uncover the cutout underneath. */}
        {active && snapSrc && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            {/* The original (with background), dissolving away during extraction. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={origRef}
              src={snapSrc}
              alt=""
              className="absolute inset-0 h-full w-full"
              style={{ objectFit: "fill" }}
            />
            {/* Radiograph copy, visible only inside the moving band. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={xrayRef}
              src={snapSrc}
              alt=""
              className="absolute inset-0 h-full w-full"
              style={{ objectFit: "fill", filter: XRAY_FILTER }}
            />
            {/* Cyan tint to push the x-ray feel, also banded. */}
            <div
              ref={tintRef}
              className="absolute inset-0"
              style={{ background: XRAY_TINT, mixBlendMode: "color", opacity: 0.55 }}
            />
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
