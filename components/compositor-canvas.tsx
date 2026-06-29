"use client"

import { useCallback, useEffect, useRef, useState } from "react"

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
  offsetXL: number
  offsetXR: number
  gridLines: number[]
  outputW: number
  outputH: number
  onCanvasReady: (canvas: HTMLCanvasElement) => void
  onDragOffsetChange: (side: "left" | "right", offsetX: number, offsetY: number) => void
  onCanvasResize: (w: number, h: number) => void
}

// Friläggning animation (an "x-ray scanning pass", per the source design).
// While we wait for the API a radiograph band loops over the product (scout).
// When the cutout lands we cross-dissolve the original to the finished bundle
// with a blur + micro-zoom — the blur hides the fact that the cutout is laid
// out at a different size, so it reads as "resolving into focus" rather than a
// product growing/rolling in.
const SCOUT_MS = 1500 // one loop of the indeterminate scout pass
const EXTRACT_MS = 650 // the focus-dissolve once the result lands
const BLUR_MAX = 10 // px of blur at the midpoint of the dissolve
const ZOOM_MAX = 0.04 // extra scale the finished bundle settles in from
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
  offsetXL,
  offsetXR,
  gridLines,
  outputW,
  outputH,
  onCanvasReady,
  onDragOffsetChange,
  onCanvasResize,
}: CompositorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hasContent, setHasContent] = useState(false)

  // Track rendered product bounding boxes (canvas pixel coords) for hit testing.
  const renderedBoundsRef = useRef<{
    left: { x: number; y: number; w: number; h: number } | null
    right: { x: number; y: number; w: number; h: number } | null
  }>({ left: null, right: null })

  // Stable refs for props used in stable callbacks.
  const offsetXLRef = useRef(offsetXL)
  const offsetXRRef = useRef(offsetXR)
  const offsetLRef = useRef(offsetL)
  const offsetRRef = useRef(offsetR)
  const outputWRef = useRef(outputW)
  const outputHRef = useRef(outputH)
  const activeRef = useRef(false)
  const onDragOffsetChangeRef = useRef(onDragOffsetChange)
  const onCanvasResizeRef = useRef(onCanvasResize)
  useEffect(() => { offsetXLRef.current = offsetXL }, [offsetXL])
  useEffect(() => { offsetXRRef.current = offsetXR }, [offsetXR])
  useEffect(() => { offsetLRef.current = offsetL }, [offsetL])
  useEffect(() => { offsetRRef.current = offsetR }, [offsetR])
  useEffect(() => { outputWRef.current = outputW }, [outputW])
  useEffect(() => { outputHRef.current = outputH }, [outputH])
  useEffect(() => { onDragOffsetChangeRef.current = onDragOffsetChange }, [onDragOffsetChange])
  useEffect(() => { onCanvasResizeRef.current = onCanvasResize }, [onCanvasResize])

  // Drag state for product repositioning.
  const dragRef = useRef<{
    side: "left" | "right"
    startClientX: number
    startClientY: number
    startOffsetX: number
    startOffsetY: number
  } | null>(null)
  const [dragDisplay, setDragDisplay] = useState<{ side: "left" | "right"; x: number; y: number } | null>(null)

  // Drag state for canvas resize.
  const resizeDragRef = useRef<{
    type: "right" | "bottom" | "corner"
    startClientX: number
    startClientY: number
    startOutputW: number
    startOutputH: number
    displayW: number
    displayH: number
  } | null>(null)

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeRef.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const cx = (e.clientX - rect.left) * scaleX
    const cy = (e.clientY - rect.top) * scaleY

    const bl = renderedBoundsRef.current.left
    const br = renderedBoundsRef.current.right
    let side: "left" | "right" | null = null
    let startOffsetX = 0, startOffsetY = 0

    if (bl && cx >= bl.x && cx <= bl.x + bl.w && cy >= bl.y && cy <= bl.y + bl.h) {
      side = "left"; startOffsetX = offsetXLRef.current; startOffsetY = offsetLRef.current
    } else if (br && cx >= br.x && cx <= br.x + br.w && cy >= br.y && cy <= br.y + br.h) {
      side = "right"; startOffsetX = offsetXRRef.current; startOffsetY = offsetRRef.current
    }
    if (!side) return
    e.preventDefault()
    dragRef.current = { side, startClientX: e.clientX, startClientY: e.clientY, startOffsetX, startOffsetY }
    setDragDisplay({ side, x: startOffsetX, y: startOffsetY })
  }, [])

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (dragRef.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const cx = (e.clientX - rect.left) * scaleX
    const cy = (e.clientY - rect.top) * scaleY
    const bl = renderedBoundsRef.current.left
    const br = renderedBoundsRef.current.right
    const over =
      (bl && cx >= bl.x && cx <= bl.x + bl.w && cy >= bl.y && cy <= bl.y + bl.h) ||
      (br && cx >= br.x && cx <= br.x + br.w && cy >= br.y && cy <= br.y + br.h)
    canvas.style.cursor = over ? "grab" : "default"
  }, [])

  const handleResizeMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>, type: "right" | "bottom" | "corner") => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    resizeDragRef.current = {
      type,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startOutputW: outputWRef.current,
      startOutputH: outputHRef.current,
      displayW: canvas.clientWidth,
      displayH: canvas.clientHeight,
    }
  }, [])

  // Global mouse handlers active throughout the component lifetime.
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (dragRef.current) {
        const canvas = canvasRef.current
        if (!canvas) return
        const rect = canvas.getBoundingClientRect()
        const scaleX = canvas.width / rect.width
        const scaleY = canvas.height / rect.height
        const { side, startClientX, startClientY, startOffsetX, startOffsetY } = dragRef.current
        const dx = (e.clientX - startClientX) * scaleX
        const dy = (e.clientY - startClientY) * scaleY
        const newOffsetX = Math.round(startOffsetX + dx)
        const newOffsetY = Math.round(startOffsetY - dy)
        onDragOffsetChangeRef.current(side, newOffsetX, newOffsetY)
        setDragDisplay({ side, x: newOffsetX, y: newOffsetY })
      }

      if (resizeDragRef.current) {
        const { type, startClientX, startClientY, startOutputW, startOutputH, displayW, displayH } = resizeDragRef.current
        const dx = e.clientX - startClientX
        const dy = e.clientY - startClientY
        let newW = startOutputW
        let newH = startOutputH
        if (type === "right" || type === "corner") {
          newW = Math.round(Math.max(200, Math.min(5000, startOutputW + dx * (startOutputW / displayW))))
        }
        if (type === "bottom" || type === "corner") {
          newH = Math.round(Math.max(200, Math.min(5000, startOutputH + dy * (startOutputH / displayH))))
        }
        onCanvasResizeRef.current(newW, newH)
      }
    }

    const onUp = () => {
      if (dragRef.current) { dragRef.current = null; setDragDisplay(null) }
      resizeDragRef.current = null
      const canvas = canvasRef.current
      if (canvas) canvas.style.cursor = "default"
    }

    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
  }, [])

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
      renderedBoundsRef.current = { left: null, right: null }
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

      const sepW = gap
      const plusSize = showPlus ? Math.min(outputH * plusFrac, gap) : 0

      const halfW = Math.max(1, (availableW - sepW) / 2)
      const scaleL = Math.min(halfW / boundsL.w, availableH / boundsL.h)
      const scaleR = Math.min(halfW / boundsR.w, availableH / boundsR.h)
      const drawWL = boundsL.w * scaleL
      const drawHL = boundsL.h * scaleL
      const drawWR = boundsR.w * scaleR
      const drawHR = boundsR.h * scaleR

      const cx = outputW / 2
      const leftInnerEdge = cx - sepW / 2
      const rightInnerEdge = cx + sepW / 2

      const drawLX = leftInnerEdge - drawWL + offsetXL
      const drawLY = centerY - drawHL / 2 - offsetL
      const drawRX = rightInnerEdge + offsetXR
      const drawRY = centerY - drawHR / 2 - offsetR

      ctx.drawImage(leftImage, boundsL.x, boundsL.y, boundsL.w, boundsL.h, drawLX, drawLY, drawWL, drawHL)
      ctx.drawImage(rightImage, boundsR.x, boundsR.y, boundsR.w, boundsR.h, drawRX, drawRY, drawWR, drawHR)

      renderedBoundsRef.current = {
        left: { x: drawLX, y: drawLY, w: drawWL, h: drawHL },
        right: { x: drawRX, y: drawRY, w: drawWR, h: drawHR },
      }

      if (showPlus) {
        drawPlus(ctx, cx, centerY, plusSize)
      }
    } else {
      const isLeft = !!leftImage
      const img = (leftImage || rightImage)!
      const bounds = getContentBounds(img)
      const scale = Math.min(availableW / bounds.w, availableH / bounds.h)
      const drawW = bounds.w * scale
      const drawH = bounds.h * scale
      const drawX = padding + (availableW - drawW) / 2 + (isLeft ? offsetXL : offsetXR)
      const drawY = centerY - drawH / 2 - (isLeft ? offsetL : offsetR)
      ctx.drawImage(img, bounds.x, bounds.y, bounds.w, bounds.h, drawX, drawY, drawW, drawH)
      renderedBoundsRef.current = isLeft
        ? { left: { x: drawX, y: drawY, w: drawW, h: drawH }, right: null }
        : { left: null, right: { x: drawX, y: drawY, w: drawW, h: drawH } }
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
    offsetXL,
    offsetXR,
    outputW,
    outputH,
    onCanvasReady,
  ])

  // Phase machine: snapshot on scan start (scout), switch to the extraction pass
  // when the parent signals success, and stop if scanning ends without a result.
  useEffect(() => {
    const startedScanning = scanning && !prevScanningRef.current
    const finished = revealKey > 0 && revealKey !== prevRevealRef.current

    activeRef.current = scanning || (revealKey > 0 && revealKey !== prevRevealRef.current)

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

  // Drive the scan with requestAnimationFrame, mutating styles directly so we
  // don't re-render every frame. `phaseRef` is read live, so the scout→extract
  // hand-off is picked up mid-flight without restarting the loop.
  useEffect(() => {
    if (!active) return

    const canvas = canvasRef.current
    const easeInOut = (p: number) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2)

    // Restore the finished bundle to its clean, sharp state.
    const settleCanvas = () => {
      if (!canvas) return
      canvas.style.transition = "none"
      canvas.style.opacity = "1"
      canvas.style.filter = "none"
      canvas.style.transform = "none"
    }

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    if (reduce) {
      if (phaseRef.current === "extract") {
        settleCanvas()
        setActive(false)
      }
      return
    }

    let raf = 0

    // Scout band: reveal a radiograph copy of the product inside a moving window.
    const applyScout = (bandPct: number) => {
      const bandMask = `linear-gradient(to bottom, transparent calc(${bandPct}% - ${BAND_FEATHER}px), #000 calc(${bandPct}% - ${BAND_SOLID}px), #000 calc(${bandPct}% + ${BAND_SOLID}px), transparent calc(${bandPct}% + ${BAND_FEATHER}px))`
      for (const el of [xrayRef.current, tintRef.current]) {
        if (el) {
          el.style.webkitMaskImage = bandMask
          el.style.maskImage = bandMask
        }
      }
    }

    const step = (t: number) => {
      if (phaseRef.current === "extract") {
        if (extractStartRef.current === null) extractStartRef.current = t
        const pos = Math.min(1, (t - extractStartRef.current) / EXTRACT_MS)
        const e = easeInOut(pos)

        // Original (with background) blurs out as the finished bundle blurs in.
        // Both are soft through the middle, so the size difference between the
        // two layouts never reads as a hard edge or a product "growing".
        if (origRef.current) {
          origRef.current.style.opacity = String(1 - e)
          origRef.current.style.filter = `blur(${e * BLUR_MAX}px)`
        }
        for (const el of [xrayRef.current, tintRef.current]) {
          if (el) el.style.opacity = String(1 - e)
        }
        if (canvas) {
          canvas.style.transition = "none"
          canvas.style.opacity = String(e)
          canvas.style.filter = `blur(${(1 - e) * BLUR_MAX}px)`
          canvas.style.transform = `scale(${1 + (1 - e) * ZOOM_MAX})`
          canvas.style.transformOrigin = "center"
        }

        if (pos >= 1) {
          settleCanvas()
          setActive(false)
          return
        }
      } else {
        // Scout pass: keep the original (canvas) fully visible and sharp.
        if (canvas && (canvas.style.opacity !== "1" || canvas.style.filter !== "none")) {
          settleCanvas()
        }
        if (scoutStartRef.current === null) scoutStartRef.current = t
        const p = ((t - scoutStartRef.current) % SCOUT_MS) / SCOUT_MS
        applyScout(p * 100)
      }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => {
      cancelAnimationFrame(raf)
      // Never leave the canvas stuck mid-transition if we unmount.
      settleCanvas()
    }
  }, [active])

  return (
    <div className="flex justify-center rounded-[22px] border border-[var(--line-warm)] bg-white p-4 shadow-[var(--shadow-pop)] sm:p-5">
      <div
        className="checker relative w-full max-w-[680px] rounded-2xl"
        style={{ aspectRatio: `${outputW} / ${outputH}` }}
      >
        <canvas
          ref={canvasRef}
          aria-label="Sammansatt produktbild"
          className="h-full w-full"
          style={{ aspectRatio: `${outputW} / ${outputH}` }}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
        />

        {/* Invisible resize handles on edges */}
        <div
          className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize z-10"
          onMouseDown={(e) => handleResizeMouseDown(e, "right")}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize z-10"
          onMouseDown={(e) => handleResizeMouseDown(e, "bottom")}
        />
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-10"
          onMouseDown={(e) => handleResizeMouseDown(e, "corner")}
        />

        {/* Coordinate badge while dragging */}
        {dragDisplay && (
          <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-lg bg-ink/80 px-3 py-1.5 font-mono text-xs text-white">
            {dragDisplay.side === "left" ? "Vänster" : "Höger"} &nbsp;
            X: {dragDisplay.x > 0 ? "+" : ""}{Math.round(dragDisplay.x)}px &nbsp;
            Y: {dragDisplay.y > 0 ? "+" : ""}{Math.round(dragDisplay.y)}px
          </div>
        )}

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
