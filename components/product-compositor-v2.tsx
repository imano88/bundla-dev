"use client"

import { useState, useCallback, useRef } from "react"
import { Download, Loader2, Settings2, Wand2, AlertCircle, Plus } from "lucide-react"
import { removeProductBackground } from "@/lib/bg-remover"
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

// Normalises any browser-renderable image to a PNG data URL and downscales very
// large photos. Feeding a full-resolution 20 MP image straight into the
// in-browser AI model is the most common cause of the tab freezing or running
// out of memory, so we cap the longest edge before segmentation. We do NOT add
// any coloured padding: a coloured frame bleeds a tinted halo into the cut-out
// edges, and the ISNet model already handles tightly-cropped products well.
const MAX_SEGMENT_DIMENSION = 2048

async function normalizeImageToPng(src: string): Promise<string> {
  const img = await loadImage(src)
  const scale = Math.min(1, MAX_SEGMENT_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight))
  const w = Math.round(img.naturalWidth * scale)
  const h = Math.round(img.naturalHeight * scale)
  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d")!
  ctx.imageSmoothingQuality = "high"
  ctx.drawImage(img, 0, 0, w, h)
  return canvas.toDataURL("image/png")
}

// Trims a light residual halo that segmentation can leave around products that
// were photographed on a white background. Only thin, near-white fringe pixels
// sitting directly on the transparent boundary are removed (a single pass), so
// solid white products keep their real edges instead of being chewed away.
function trimWhiteFringe(blob: Blob, passes = 1): Promise<Blob> {
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

      const isWhiteFringe = (i: number) => {
        const a = data[i * 4 + 3]
        if (a < 20) return false
        const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2]
        const max = Math.max(r, g, b), min = Math.min(r, g, b)
        const sat = max > 0 ? (max - min) / max : 0
        return r >= 230 && g >= 230 && b >= 230 && sat < 0.1
      }

      for (let pass = 0; pass < passes; pass++) {
        const toErase: number[] = []
        for (let i = 0; i < w * h; i++) {
          if (!isWhiteFringe(i)) continue
          const px = i % w, py = Math.floor(i / w)
          const neighbors = [
            py > 0 ? i - w : -1,
            py < h - 1 ? i + w : -1,
            px > 0 ? i - 1 : -1,
            px < w - 1 ? i + 1 : -1,
          ]
          if (neighbors.some((n) => n >= 0 && isTransparent(n))) toErase.push(i)
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

// Removes small, disconnected specks the segmentation model sometimes leaves
// behind (stray shadow/reflection fragments). The largest connected component
// — the product itself — is always kept, and only islands smaller than
// `minFraction` of it are cleared, so genuine multi-part products survive.
function removeSmallIslands(blob: Blob, minFraction = 0.02): Promise<Blob> {
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
      const n = w * h

      const mask = new Uint8Array(n)
      for (let i = 0; i < n; i++) mask[i] = data[i * 4 + 3] > 10 ? 1 : 0

      const labels = new Int32Array(n).fill(-1)
      const sizes: number[] = []
      const queue = new Int32Array(n)
      let numLabels = 0

      for (let start = 0; start < n; start++) {
        if (mask[start] === 0 || labels[start] !== -1) continue
        let head = 0, tail = 0, size = 0
        queue[tail++] = start
        labels[start] = numLabels
        while (head < tail) {
          const idx = queue[head++]
          size++
          const px = idx % w, py = Math.floor(idx / w)
          if (py > 0 && mask[idx - w] && labels[idx - w] === -1) { labels[idx - w] = numLabels; queue[tail++] = idx - w }
          if (py < h - 1 && mask[idx + w] && labels[idx + w] === -1) { labels[idx + w] = numLabels; queue[tail++] = idx + w }
          if (px > 0 && mask[idx - 1] && labels[idx - 1] === -1) { labels[idx - 1] = numLabels; queue[tail++] = idx - 1 }
          if (px < w - 1 && mask[idx + 1] && labels[idx + 1] === -1) { labels[idx + 1] = numLabels; queue[tail++] = idx + 1 }
        }
        sizes.push(size)
        numLabels++
      }

      if (numLabels > 1) {
        const maxSize = Math.max(...sizes)
        const threshold = maxSize * minFraction
        for (let i = 0; i < n; i++) {
          const l = labels[i]
          if (l !== -1 && sizes[l] < threshold) data[i * 4 + 3] = 0
        }
        ctx.putImageData(imageData, 0, 0)
      }

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
  const [showPlus, setShowPlus] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

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
        // Step 1: normalise format + downscale very large images
        const pngDataUrl = await normalizeImageToPng(dataUrl)

        setImages((prev) => {
          const next = [...prev] as [ImageState, ImageState]
          next[index] = { ...next[index], status: "segmenting" }
          return next
        })

        // Yield again before the heavy ONNX inference
        await new Promise<void>((r) => setTimeout(r, 0))

        // Step 2: AI background removal in a Web Worker so the main thread stays
        // responsive — both product images can be dropped and processed at once.
        // (Full-precision ISNet model: isnet_fp16 struggles with white-on-white.)
        const rawBlob = await removeProductBackground(pngDataUrl)

        setImages((prev) => {
          const next = [...prev] as [ImageState, ImageState]
          next[index] = { ...next[index], status: "cleaning" }
          return next
        })

        // Step 3: gentle cleanup — trim any thin white halo, then drop stray specks
        const fringeBlob = await trimWhiteFringe(rawBlob)
        const blob = await removeSmallIslands(fringeBlob)
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
              showPlus={showPlus}
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

                {/* Plus separator toggle */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4 text-accent" />
                    <div>
                      <Label className="text-sm font-medium cursor-pointer">
                        Visa plustecken
                      </Label>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Lagger ett "+" mellan produkterna
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={showPlus}
                    onCheckedChange={setShowPlus}
                    aria-label="Visa plustecken mellan produkterna"
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
