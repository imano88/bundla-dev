"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { removeBackground } from "@imgly/background-removal"
import { Download, Loader2, Settings2, Wand2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { ImageDropZone } from "@/components/image-drop-zone"
import { CompositorCanvas } from "@/components/compositor-canvas"
import { cn } from "@/lib/utils"

type ProcessingStatus = "idle" | "normalizing" | "segmenting" | "cleaning" | "done" | "error"

interface ImageState {
  original: string
  processed: string | null
  file: File | null
  element: HTMLImageElement | null
  status: ProcessingStatus
  error: string | null
}

const PRESET_COLORS = [
  { label: "Vit", value: "#ffffff" },
  { label: "Ljusgra", value: "#f5f5f5" },
  { label: "Ljusbla", value: "#e8f0fe" },
  { label: "Beige", value: "#fdf8f0" },
  { label: "Svart", value: "#1a1a1a" },
  { label: "Marinbla", value: "#0f2044" },
]

const TRANSPARENT_VALUE = "transparent"

function makeEmptyState(): ImageState {
  return {
    original: "",
    processed: null,
    file: null,
    element: null,
    status: "idle",
    error: null,
  }
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// Converts any browser-renderable image to PNG with green padding.
// The vivid green border gives the AI segmentation model clear context
// about where the background is, even for tightly-cropped images.
async function normalizeImageToPng(src: string, paddingFrac = 0.15): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth, h = img.naturalHeight
  const pw = Math.round(w * paddingFrac)
  const ph = Math.round(h * paddingFrac)
  const canvas = document.createElement("canvas")
  canvas.width = w + pw * 2
  canvas.height = h + ph * 2
  const ctx = canvas.getContext("2d")!
  // Vivid green padding is distinguishable from all appliance colors
  ctx.fillStyle = "#00B140"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, pw, ph, w, h)
  return canvas.toDataURL("image/png")
}

// After AI background removal, two types of fringe may remain:
// 1. Near-white residual fringe on white products
// 2. Green-tinted semi-transparent pixels from the green padding bleed
// This function erodes both by removing affected pixels touching the transparent boundary.
function erodeWhiteFringe(blob: Blob, passes = 3): Promise<Blob> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      const { naturalWidth: w, naturalHeight: h } = img
      const canvas = document.createElement("canvas")
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)
      const imageData = ctx.getImageData(0, 0, w, h)
      const data = imageData.data

      const isTransparent = (i: number) => data[i * 4 + 3] < 20

      const isFringe = (i: number) => {
        const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2], a = data[i * 4 + 3]
        if (a < 20) return false

        // Near-white fringe (residual white bg on white products)
        const max = Math.max(r, g, b), min = Math.min(r, g, b)
        const sat = max > 0 ? (max - min) / max : 0
        if (r >= 220 && g >= 220 && b >= 220 && sat < 0.12) return true

        // Green-tinted fringe from #00B140 padding bleed:
        // green channel dominates, red and blue are lower
        if (g > r + 30 && g > b + 20 && g > 100) return true

        return false
      }

      for (let pass = 0; pass < passes; pass++) {
        const toErase: number[] = []
        for (let i = 0; i < w * h; i++) {
          if (!isFringe(i)) continue
          const px = i % w, py = Math.floor(i / w)
          const neighbors = [
            py > 0 ? i - w : -1,
            py < h - 1 ? i + w : -1,
            px > 0 ? i - 1 : -1,
            px < w - 1 ? i + 1 : -1,
          ]
          if (neighbors.some(n => n >= 0 && isTransparent(n))) {
            toErase.push(i)
          }
        }
        for (const i of toErase) data[i * 4 + 3] = 0
        if (toErase.length === 0) break
      }

      ctx.putImageData(imageData, 0, 0)
      canvas.toBlob((b) => resolve(b ?? blob), "image/png")
    }
    img.onerror = () => resolve(blob)
    img.src = url
  })
}



// After background removal, award badges/logos may remain as disconnected
// islands or corner patches. This function removes both types.
function removeBadgesAndIslands(
  blob: Blob,
  islandFraction = 0.04,
  cornerFrac = 0.30
): Promise<Blob> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      const { naturalWidth: w, naturalHeight: h } = img
      const canvas = document.createElement("canvas")
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)

      const imageData = ctx.getImageData(0, 0, w, h)
      const data = imageData.data

      // ── Helpers ────────────────────────────────────────────────────────
      function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
        const rn = r / 255, gn = g / 255, bn = b / 255
        const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
        const l = (max + min) / 2
        if (max === min) return [0, 0, l]
        const d = max - min
        const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
        let hue = 0
        if (max === rn) hue = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6
        else if (max === gn) hue = ((bn - rn) / d + 2) / 6
        else hue = ((rn - gn) / d + 4) / 6
        return [hue, s, l]
      }

      function pixelSat(i: number): number {
        const [, s] = rgbToHsl(data[i * 4], data[i * 4 + 1], data[i * 4 + 2])
        return s
      }

      function pixelHue(i: number): number {
        const [h] = rgbToHsl(data[i * 4], data[i * 4 + 1], data[i * 4 + 2])
        return h
      }

      const alpha = (i: number) => data[i * 4 + 3]

      // ── 1. Compute overall product dominant hue (from all opaque pixels) ─
      let totalSat = 0, hueSum = 0, opaquePx = 0
      for (let i = 0; i < w * h; i++) {
        if (alpha(i) < 20) continue
        const sat = pixelSat(i)
        totalSat += sat
        hueSum += pixelHue(i) * sat // weighted by saturation
        opaquePx++
      }
      const productDominantHue = opaquePx > 0 ? hueSum / (totalSat || 1) : 0.6
      const productAvgSat = opaquePx > 0 ? totalSat / opaquePx : 0.1

      // ── 2. BFS connected-component labelling ───────────────────────────
      const mask = new Uint8Array(w * h)
      for (let i = 0; i < w * h; i++) {
        mask[i] = alpha(i) > 10 ? 1 : 0
      }

      const labels = new Int32Array(w * h).fill(-1)
      const compSizes: number[] = []
      const compBounds: Array<{ x0: number; y0: number; x1: number; y1: number }> = []
      let numLabels = 0
      const queue: number[] = []

      for (let start = 0; start < w * h; start++) {
        if (mask[start] === 0 || labels[start] !== -1) continue
        queue.length = 0
        queue.push(start)
        labels[start] = numLabels
        let size = 0, head = 0
        let bx0 = w, by0 = h, bx1 = 0, by1 = 0
        while (head < queue.length) {
          const idx = queue[head++]
          size++
          const px = idx % w, py = Math.floor(idx / w)
          if (px < bx0) bx0 = px
          if (px > bx1) bx1 = px
          if (py < by0) by0 = py
          if (py > by1) by1 = py
          const neighbors = [
            py > 0 ? idx - w : -1,
            py < h - 1 ? idx + w : -1,
            px > 0 ? idx - 1 : -1,
            px < w - 1 ? idx + 1 : -1,
          ]
          for (const n of neighbors) {
            if (n >= 0 && mask[n] === 1 && labels[n] === -1) {
              labels[n] = numLabels
              queue.push(n)
            }
          }
        }
        compSizes.push(size)
        compBounds.push({ x0: bx0, y0: by0, x1: bx1, y1: by1 })
        numLabels++
      }

      if (numLabels === 0) {
        canvas.toBlob((b) => resolve(b ?? blob), "image/png")
        return
      }

      const maxSize = Math.max(...compSizes)
      const erase = new Uint8Array(numLabels)

      // Strategy A: small disconnected islands
      for (let l = 0; l < numLabels; l++) {
        if (compSizes[l] < maxSize * islandFraction) erase[l] = 1
      }

      // ── 3. Corner-region badge detection ─────���────────────────────────
      // For each of the 4 corners: find ALL opaque pixels in that zone,
      // measure their average hue & saturation. If the corner zone has:
      //   - A notably different hue from the overall product
      //   - Higher saturation than the product average (badges are vivid)
      //   - A reasonable number of pixels (not just noise)
      // then erase those pixels.
      const cz = Math.round(Math.min(w, h) * cornerFrac)
      const corners = [
        { x0: 0,     y0: 0,     x1: cz,     y1: cz      }, // top-left
        { x0: w-cz,  y0: 0,     x1: w,       y1: cz      }, // top-right
        { x0: 0,     y0: h-cz,  x1: cz,      y1: h       }, // bottom-left
        { x0: w-cz,  y0: h-cz,  x1: w,       y1: h       }, // bottom-right
      ]

      for (const corner of corners) {
        // Collect opaque pixels in this corner zone
        let zoneOpaque = 0, zoneSatSum = 0, zoneHueSatSum = 0, zoneSatSum2 = 0
        // Find tight bounding box of opaque pixels in zone
        let bx0 = corner.x1, by0 = corner.y1, bx1 = corner.x0, by1 = corner.y0

        for (let cy = corner.y0; cy < corner.y1; cy++) {
          for (let cx = corner.x0; cx < corner.x1; cx++) {
            const i = cy * w + cx
            if (alpha(i) < 20) continue
            const sat = pixelSat(i)
            const hue = pixelHue(i)
            zoneSatSum += sat
            zoneHueSatSum += hue * sat
            zoneSatSum2 += sat
            zoneOpaque++
            if (cx < bx0) bx0 = cx
            if (cx > bx1) bx1 = cx
            if (cy < by0) by0 = cy
            if (cy > by1) by1 = cy
          }
        }

        if (zoneOpaque < 80) continue // too few pixels to be a badge

        const zoneAvgSat = zoneSatSum / zoneOpaque
        const zoneDomHue = zoneSatSum2 > 0 ? zoneHueSatSum / zoneSatSum2 : 0

        // Hue difference (circular, 0–1 range)
        const hueDiff = Math.min(Math.abs(zoneDomHue - productDominantHue), 1 - Math.abs(zoneDomHue - productDominantHue))

        // Badge zone conditions (strict — only vivid coloured award badges):
        //  - Highly saturated AND clearly different hue from the product
        //  - Small area (< 6% of image) to never erase the machine itself
        const zoneArea = (bx1 - bx0 + 1) * (by1 - by0 + 1)
        const isVivid = zoneAvgSat > Math.max(0.40, productAvgSat + 0.25)
        const isDifferentHue = hueDiff > 0.12 && zoneAvgSat > 0.35
        const isSmallEnough = zoneArea < w * h * 0.06

        if ((isVivid || isDifferentHue) && isSmallEnough) {
          // Erase all opaque pixels in the tight bounding box of this corner zone
          for (let cy = by0; cy <= by1; cy++) {
            for (let cx = bx0; cx <= bx1; cx++) {
              const i = cy * w + cx
              if (alpha(i) > 0) data[i * 4 + 3] = 0
            }
          }
        }
      }

      // ── 4. Apply BFS island erasure ────────────────────────────────────
      for (let i = 0; i < w * h; i++) {
        const l = labels[i]
        if (l !== -1 && erase[l]) data[i * 4 + 3] = 0
      }

      ctx.putImageData(imageData, 0, 0)
      canvas.toBlob((b) => resolve(b ?? blob), "image/png")
    }
    img.onerror = () => resolve(blob)
    img.src = url
  })
}

export function ProductCompositor() {
  const [images, setImages] = useState<[ImageState, ImageState]>([
    makeEmptyState(),
    makeEmptyState(),
  ])
  const [autoRemoveBg, setAutoRemoveBg] = useState(true)
  const [bgColor, setBgColor] = useState("#ffffff")
  const [customColor, setCustomColor] = useState("#ffffff")
  const [transparentBg, setTransparentBg] = useState(false)
  const [padding, setPadding] = useState(30)
  const [gap, setGap] = useState(20)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Configure onnxruntime-web to use a single thread.
  // Multi-threading requires crossOriginIsolated (COOP/COEP headers) which
  // are not set in this environment. Setting numThreads=1 before any
  // removeBackground() call prevents the warning and ensures correct behaviour.
  useEffect(() => {
    import("onnxruntime-web").then((ort) => {
      ort.env.wasm.numThreads = 1
    }).catch(() => {
      // onnxruntime-web may not be directly importable; the bg-removal
      // library bundles its own copy. The warning is benign — the library
      // falls back to single-threading automatically.
    })
  }, [])

  const handleCanvasReady = useCallback((canvas: HTMLCanvasElement) => {
    canvasRef.current = canvas
  }, [])

  const processImage = useCallback(
    async (dataUrl: string, file: File, index: 0 | 1) => {
      // Immediately load and show the original image — no lag on drop
      let originalElement: HTMLImageElement | null = null
      try {
        originalElement = await loadImage(dataUrl)
      } catch {
        // ignore — we'll catch it below
      }

      setImages((prev) => {
        const next = [...prev] as [ImageState, ImageState]
        next[index] = {
          original: dataUrl,
          processed: null,
          file,
          // Show original immediately so the drop zone feels instant
          element: autoRemoveBg ? null : (originalElement ?? null),
          status: autoRemoveBg ? "normalizing" : "done",
          error: null,
        }
        return next
      })

      if (!autoRemoveBg) return

      // Yield to the browser so the UI re-renders before heavy processing
      await new Promise<void>((r) => setTimeout(r, 0))

      try {
        // Step 1: normalise format + add padding
        const pngDataUrl = await normalizeImageToPng(dataUrl)

        setImages((prev) => {
          const next = [...prev] as [ImageState, ImageState]
          next[index] = { ...next[index], status: "segmenting" }
          return next
        })

        // Yield again before the heavy ONNX inference
        await new Promise<void>((r) => setTimeout(r, 0))

        // Step 2: AI background removal using full-precision ISNet model
        // (isnet_fp16 struggles with white-on-white; full isnet is more accurate)
        const rawBlob = await removeBackground(pngDataUrl, {
          model: "isnet",
          output: { format: "image/png", quality: 1 },
        })

        setImages((prev) => {
          const next = [...prev] as [ImageState, ImageState]
          next[index] = { ...next[index], status: "cleaning" }
          return next
        })

        // Remove residual white fringe (AI sometimes leaves white border on white products)
        const fringeBlob = await erodeWhiteFringe(rawBlob)
        // Remove leftover disconnected islands and corner badges
        const blob = await removeBadgesAndIslands(fringeBlob)
        const url = URL.createObjectURL(blob)
        const img = await loadImage(url)

        setImages((prev) => {
          const next = [...prev] as [ImageState, ImageState]
          next[index] = { ...next[index], processed: url, element: img, status: "done" }
          return next
        })
      } catch (err) {
        console.error("[v0] background removal error:", err)
        // Fallback: show original image without bg removal
        const fallbackEl = originalElement ?? await loadImage(dataUrl).catch(() => null)
        setImages((prev) => {
          const next = [...prev] as [ImageState, ImageState]
          next[index] = {
            ...next[index],
            element: fallbackEl,
            status: "error",
            error: "Bakgrundsborttagning misslyckades - anvander originalbild.",
          }
          return next
        })
      }
    },
    [autoRemoveBg]
  )

  const handleImageChange = (dataUrl: string, file: File, index: 0 | 1) => {
    processImage(dataUrl, file, index)
  }

  const handleRemove = (index: 0 | 1) => {
    setImages((prev) => {
      const next = [...prev] as [ImageState, ImageState]
      next[index] = makeEmptyState()
      return next
    })
  }

  const handleExport = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "bundling-produktbild.png"
        a.click()
        URL.revokeObjectURL(url)
      },
      "image/png",
      1
    )
  }, [])

  const handleColorChange = (value: string) => {
    setBgColor(value)
    setCustomColor(value)
    setTransparentBg(false)
  }

  const isProcessing = images.some((img) =>
    ["normalizing", "segmenting", "cleaning"].includes(img.status)
  )
  const hasAnyImage = images.some((img) => img.element !== null || img.original !== "")
  const leftElement = images[0].element
  const rightElement = images[1].element

  const displayLeft = images[0].processed || images[0].original || null
  const displayRight = images[1].processed || images[1].original || null

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Bildkompositor</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Kombinera tva produktbilder for bundlingens produktsida
            </p>
          </div>
          <Button
            onClick={handleExport}
            disabled={!hasAnyImage || isProcessing}
            className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {isProcessing ? "Bearbetar..." : "Exportera PNG"}
          </Button>
        </div>
      </header>

      <main className="flex-1 px-6 py-8">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_1fr_360px]">
          {/* Left image upload */}
          <div className="flex flex-col gap-4">
            <ImageDropZone
              label="Dra och slapp eller klicka for att valja"
              image={displayLeft}
              onImageChange={(url, file) => handleImageChange(url, file, 0)}
              onRemove={() => handleRemove(0)}
              index={0}
            />
            <ImageStatusBadge state={images[0]} />
          </div>

          {/* Right image upload */}
          <div className="flex flex-col gap-4">
            <ImageDropZone
              label="Dra och slapp eller klicka for att valja"
              image={displayRight}
              onImageChange={(url, file) => handleImageChange(url, file, 1)}
              onRemove={() => handleRemove(1)}
              index={1}
            />
            <ImageStatusBadge state={images[1]} />
          </div>

          {/* Settings panel */}
          <aside className="flex flex-col gap-6">
            {/* Preview */}
            <CompositorCanvas
              leftImage={leftElement}
              rightImage={rightElement}
              backgroundColor={bgColor}
              transparent={transparentBg}
              padding={padding}
              gap={gap}
              onCanvasReady={handleCanvasReady}
            />

            {/* Settings */}
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Installningar</h2>
              </div>

              <div className="flex flex-col gap-5">
                {/* Auto BG removal toggle */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Wand2 className="h-4 w-4 text-accent" />
                    <div>
                      <Label className="text-sm font-medium cursor-pointer">
                        Ta bort bakgrund automatiskt
                      </Label>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        AI klipper ut produkten
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={autoRemoveBg}
                    onCheckedChange={setAutoRemoveBg}
                    aria-label="Automatisk bakgrundsborttagning"
                  />
                </div>

                <div className="h-px bg-border" />

                {/* Background color */}
                <div className="flex flex-col gap-3">
                  <Label className="text-sm font-medium">Bakgrundsfarg</Label>

                  {/* Transparent option */}
                  <button
                    onClick={() => setTransparentBg(true)}
                    aria-label="Transparent bakgrund"
                    className={cn(
                      "flex items-center gap-2 rounded-md border-2 px-3 py-2 text-xs transition-all",
                      transparentBg
                        ? "border-accent bg-accent/5 text-foreground"
                        : "border-border text-muted-foreground hover:border-accent/50"
                    )}
                  >
                    <span
                      className="h-5 w-5 rounded shrink-0 border border-border bg-[repeating-conic-gradient(#d1d5db_0%_25%,#f9fafb_0%_50%)] bg-[length:8px_8px]"
                      aria-hidden="true"
                    />
                    <span>Transparent bakgrund (PNG)</span>
                  </button>

                  <div className="grid grid-cols-6 gap-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color.value}
                        title={color.label}
                        aria-label={`Bakgrundsfarg: ${color.label}`}
                        onClick={() => handleColorChange(color.value)}
                        className={cn(
                          "aspect-square rounded-md border-2 transition-all hover:scale-110",
                          !transparentBg && bgColor === color.value
                            ? "border-accent shadow-sm"
                            : "border-border"
                        )}
                        style={{ backgroundColor: color.value }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground shrink-0">Eget:</Label>
                    <div className="relative flex items-center">
                      <input
                        type="color"
                        value={customColor}
                        onChange={(e) => handleColorChange(e.target.value)}
                        className="h-8 w-8 cursor-pointer rounded border border-border p-0.5 bg-card"
                        aria-label="Valfri bakgrundsfarg"
                      />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">
                      {transparentBg ? "TRANSPARENT" : bgColor.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="h-px bg-border" />

                {/* Padding slider */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Inre marginal</Label>
                    <span className="text-xs font-mono text-muted-foreground">{padding}px</span>
                  </div>
                  <Slider
                    min={0}
                    max={200}
                    step={10}
                    value={[padding]}
                    onValueChange={([v]) => setPadding(v)}
                    aria-label="Inre marginal"
                  />
                </div>

                {/* Gap slider */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Mellanrum</Label>
                    <span className="text-xs font-mono text-muted-foreground">{gap}px</span>
                  </div>
                  <Slider
                    min={0}
                    max={200}
                    step={10}
                    value={[gap]}
                    onValueChange={([v]) => setGap(v)}
                    aria-label="Mellanrum mellan produkter"
                  />
                </div>
              </div>
            </div>

            {/* Export button mobile */}
            <Button
              onClick={handleExport}
              disabled={!hasAnyImage || isProcessing}
              className="lg:hidden gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {isProcessing ? "Bearbetar..." : "Exportera 1000x1000 PNG"}
            </Button>
          </aside>
        </div>
      </main>
    </div>
  )
}

function ImageStatusBadge({ state }: { state: ImageState }) {
  if (!state.original) return null

  const isProcessing = ["normalizing", "segmenting", "cleaning"].includes(state.status)

  const stepLabel: Record<string, string> = {
    normalizing: "Forbereder bild...",
    segmenting: "AI klipper ut produkten...",
    cleaning: "Rensar kanter...",
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-xs transition-all duration-300",
        isProcessing && "bg-accent/10 text-accent",
        state.status === "done" && "bg-green-50 text-green-700",
        state.status === "error" && "bg-orange-50 text-orange-700",
        state.status === "idle" && "bg-secondary text-muted-foreground"
      )}
    >
      {isProcessing && (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
          <span>{stepLabel[state.status]}</span>
        </>
      )}
      {state.status === "done" && state.processed && (
        <>
          <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
          <span>Bakgrund borttagen</span>
        </>
      )}
      {state.status === "done" && !state.processed && (
        <>
          <span className="h-2 w-2 rounded-full bg-muted-foreground shrink-0" />
          <span>Bild inladdad</span>
        </>
      )}
      {state.status === "error" && (
        <>
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{state.error}</span>
        </>
      )}
    </div>
  )
}
