"use client"

import { useState, useCallback, useRef } from "react"
import { Download, Loader2, Settings2, Wand2, AlertCircle, Plus, Layers } from "lucide-react"
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
  { label: "Ljusgrå", value: "#f5f5f5" },
  { label: "Ljusblå", value: "#e8f0fe" },
  { label: "Beige", value: "#fdf8f0" },
  { label: "Svart", value: "#1a1a1a" },
  { label: "Marinblå", value: "#0f2044" },
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

// Loads an image source into a fresh RGBA pixel buffer at the given size.
function loadPixels(src: string, w: number, h: number): Promise<Uint8ClampedArray | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const c = document.createElement("canvas")
      c.width = w
      c.height = h
      const cx = c.getContext("2d", { willReadFrequently: true })!
      cx.drawImage(img, 0, 0, w, h)
      resolve(cx.getImageData(0, 0, w, h).data)
    }
    img.onerror = () => resolve(null)
    img.src = src
  })
}

// Refines the AI matte using border flood-fill, keyed primarily on the ORIGINAL
// background colour. The background is the region that connects to the image
// edge through pixels that look like the sampled background colour, so the fill
// stops at the product's (even very subtle) edge instead of leaking into a white
// body that the model left faint. Everything enclosed by that edge becomes the
// product:
//   - Background -> fully transparent.
//   - Product interior (incl. faint white body) -> opaque (also kills
//     "flammighet" on shiny surfaces).
//   - A thin edge band keeps the model's natural anti-aliased alpha (smooth).
// If the background is not reasonably uniform, it falls back to flooding through
// near-transparent matte pixels only.
async function refineMatte(blob: Blob, originalSrc: string, rim = 2): Promise<Blob> {
  const matteUrl = URL.createObjectURL(blob)
  try {
    const matteImg = await new Promise<HTMLImageElement | null>((res) => {
      const im = new Image()
      im.onload = () => res(im)
      im.onerror = () => res(null)
      im.src = matteUrl
    })
    if (!matteImg) return blob

    const w = matteImg.naturalWidth
    const h = matteImg.naturalHeight
    const n = w * h
    const canvas = document.createElement("canvas")
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!
    ctx.drawImage(matteImg, 0, 0)
    const imageData = ctx.getImageData(0, 0, w, h)
    const data = imageData.data

    const orig = await loadPixels(originalSrc, w, h)

    // --- Sample the background colour from the border frame of the original ---
    let useColor = false
    let bgR = 0, bgG = 0, bgB = 0
    if (orig) {
      const frame = Math.max(2, Math.round(Math.min(w, h) * 0.02))
      let cnt = 0, sum = 0, sumSq = 0
      const sample = (i: number) => {
        const r = orig[i * 4], g = orig[i * 4 + 1], b = orig[i * 4 + 2]
        bgR += r; bgG += g; bgB += b; cnt++
        const lum = (r + g + b) / 3
        sum += lum; sumSq += lum * lum
      }
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (x < frame || x >= w - frame || y < frame || y >= h - frame) {
            sample(y * w + x)
          }
        }
      }
      if (cnt > 0) {
        bgR /= cnt; bgG /= cnt; bgB /= cnt
        const std = Math.sqrt(Math.max(0, sumSq / cnt - (sum / cnt) ** 2))
        // Uniform border => trust colour keying.
        useColor = std < 26
      }
    }

    const COLOR_TOL2 = 44 * 44
    const ALPHA_BG = 12 // matte alpha that is unambiguously background

    const floodable = (i: number): boolean => {
      if (data[i * 4 + 3] < ALPHA_BG) return true
      if (useColor && orig) {
        const dr = orig[i * 4] - bgR
        const dg = orig[i * 4 + 1] - bgG
        const db = orig[i * 4 + 2] - bgB
        if (dr * dr + dg * dg + db * db < COLOR_TOL2) return true
      }
      return false
    }

    // 1. Flood-fill the background inward from the border.
    const outside = new Uint8Array(n)
    const stack: number[] = []
    const trySeed = (i: number) => {
      if (!outside[i] && floodable(i)) {
        outside[i] = 1
        stack.push(i)
      }
    }
    for (let x = 0; x < w; x++) {
      trySeed(x)
      trySeed((h - 1) * w + x)
    }
    for (let y = 0; y < h; y++) {
      trySeed(y * w)
      trySeed(y * w + w - 1)
    }
    while (stack.length) {
      const i = stack.pop()!
      const px = i % w, py = (i / w) | 0
      if (py > 0) trySeed(i - w)
      if (py < h - 1) trySeed(i + w)
      if (px > 0) trySeed(i - 1)
      if (px < w - 1) trySeed(i + 1)
    }

    // 2. Dilate the background region by `rim` px -> thin edge band that keeps
    //    the model's natural (smooth) alpha.
    let near = outside.slice()
    for (let pass = 0; pass < rim; pass++) {
      const next = near.slice()
      for (let i = 0; i < n; i++) {
        if (near[i]) continue
        const px = i % w, py = (i / w) | 0
        if (
          (py > 0 && near[i - w]) ||
          (py < h - 1 && near[i + w]) ||
          (px > 0 && near[i - 1]) ||
          (px < w - 1 && near[i + 1])
        ) {
          next[i] = 1
        }
      }
      near = next
    }

    // 3. Compose: background -> 0, edge band -> natural alpha, interior -> opaque.
    for (let i = 0; i < n; i++) {
      if (outside[i]) data[i * 4 + 3] = 0
      else if (!near[i]) data[i * 4 + 3] = 255
    }

    ctx.putImageData(imageData, 0, 0)
    return await new Promise<Blob>((res) => canvas.toBlob((b) => res(b ?? blob), "image/png"))
  } finally {
    URL.revokeObjectURL(matteUrl)
  }
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

// Sends an image to our Photoroom proxy route and returns the cut-out PNG blob.
async function photoroomRemove(dataUrl: string): Promise<Blob> {
  const inputBlob = await (await fetch(dataUrl)).blob()
  const resp = await fetch("/api/remove-bg", {
    method: "POST",
    headers: { "content-type": "image/png" },
    body: inputBlob,
  })
  if (!resp.ok) {
    let message = "Photoroom misslyckades"
    try {
      const j = await resp.json()
      if (j?.message) message = j.message
    } catch {
      // non-JSON error — keep generic message
    }
    throw new Error(message)
  }
  return resp.blob()
}

// Lays the two original product images side by side on a white canvas so a
// SINGLE background-removal call covers both (one Photoroom credit per bundle).
// Returns the combined data URL plus the horizontal fraction to split it back.
async function combineSideBySide(
  srcA: string,
  srcB: string,
  targetH = 1200,
  gap = 100
): Promise<{ dataUrl: string; splitFraction: number }> {
  const [a, b] = await Promise.all([loadImage(srcA), loadImage(srcB)])
  const wA = Math.max(1, Math.round((a.naturalWidth / a.naturalHeight) * targetH))
  const wB = Math.max(1, Math.round((b.naturalWidth / b.naturalHeight) * targetH))
  const totalW = wA + gap + wB
  const canvas = document.createElement("canvas")
  canvas.width = totalW
  canvas.height = targetH
  const ctx = canvas.getContext("2d")!
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, totalW, targetH)
  ctx.imageSmoothingQuality = "high"
  ctx.drawImage(a, 0, 0, wA, targetH)
  ctx.drawImage(b, wA + gap, 0, wB, targetH)
  return { dataUrl: canvas.toDataURL("image/png"), splitFraction: (wA + gap / 2) / totalW }
}

// Splits a combined cut-out into left/right halves at the given fraction.
async function splitByFraction(blob: Blob, splitFraction: number): Promise<[string, string]> {
  const url = URL.createObjectURL(blob)
  const img = await loadImage(url)
  URL.revokeObjectURL(url)
  const W = img.naturalWidth, H = img.naturalHeight
  const splitX = Math.min(W - 1, Math.max(1, Math.round(W * splitFraction)))
  const crop = (sx: number, sw: number) => {
    const c = document.createElement("canvas")
    c.width = sw
    c.height = H
    c.getContext("2d")!.drawImage(img, sx, 0, sw, H, 0, 0, sw, H)
    return c.toDataURL("image/png")
  }
  return [crop(0, splitX), crop(splitX, W - splitX)]
}

export function ProductCompositor() {
  const [images, setImages] = useState<[ImageState, ImageState]>([
    makeEmptyState(),
    makeEmptyState(),
  ])
  const [autoRemoveBg, setAutoRemoveBg] = useState(true)
  const [bgColor, setBgColor] = useState("#ffffff")
  const [customColor, setCustomColor] = useState("#ffffff")
  const [transparentBg, setTransparentBg] = useState(true)
  const [padding, setPadding] = useState(30)
  const [gap, setGap] = useState(20)
  const [showPlus, setShowPlus] = useState(true)
  const [engine, setEngine] = useState<"builtin" | "photoroom">("builtin")
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

      if (engine === "photoroom") {
        // Paid API: don't auto-process on drop. Show the original and wait for
        // the explicit "Frilägg med Photoroom" action (one combined call).
        setImages((prev) => {
          const next = [...prev] as [ImageState, ImageState]
          next[index] = { ...next[index], element: originalElement ?? null, status: "done" }
          return next
        })
        return
      }

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

        // Yield again before the heavy processing
        await new Promise<void>((r) => setTimeout(r, 0))

        // Built-in AI background removal in a Web Worker so the main thread
        // stays responsive — both images can be dropped and processed at once.
        const rawBlob = await removeProductBackground(pngDataUrl)

        setImages((prev) => {
          const next = [...prev] as [ImageState, ImageState]
          next[index] = { ...next[index], status: "cleaning" }
          return next
        })

        // Cleanup: border flood-fill refine (recovers faint white bodies,
        // kills ghosts, solidifies interior, smooth edges) then drop specks.
        const refinedBlob = await refineMatte(rawBlob, pngDataUrl)
        const blob = await removeSmallIslands(refinedBlob)
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
            error:
              err instanceof Error && /Photoroom/i.test(err.message)
                ? err.message
                : "Bakgrundsborttagning misslyckades – använder originalbild.",
          }
          return next
        })
      }
    },
    [autoRemoveBg, engine]
  )

  // Photoroom: combine both originals -> ONE removal call -> split back, so a
  // bundle costs a single credit instead of two.
  const runPhotoroom = useCallback(async () => {
    const a = images[0].original
    const b = images[1].original
    const haveA = !!a
    const haveB = !!b
    if (!haveA && !haveB) return

    setImages((prev) => {
      const next = [...prev] as [ImageState, ImageState]
      if (haveA) next[0] = { ...next[0], status: "segmenting", error: null }
      if (haveB) next[1] = { ...next[1], status: "segmenting", error: null }
      return next
    })

    try {
      if (haveA && haveB) {
        const { dataUrl, splitFraction } = await combineSideBySide(a, b)
        const cutout = await photoroomRemove(dataUrl)
        const [leftUrl, rightUrl] = await splitByFraction(cutout, splitFraction)
        const [leftImg, rightImg] = await Promise.all([loadImage(leftUrl), loadImage(rightUrl)])
        setImages((prev) => {
          const next = [...prev] as [ImageState, ImageState]
          next[0] = { ...next[0], processed: leftUrl, element: leftImg, status: "done" }
          next[1] = { ...next[1], processed: rightUrl, element: rightImg, status: "done" }
          return next
        })
      } else {
        const idx = (haveA ? 0 : 1) as 0 | 1
        const src = (haveA ? a : b) as string
        const norm = await normalizeImageToPng(src)
        const cutout = await photoroomRemove(norm)
        const url = URL.createObjectURL(cutout)
        const img = await loadImage(url)
        setImages((prev) => {
          const next = [...prev] as [ImageState, ImageState]
          next[idx] = { ...next[idx], processed: url, element: img, status: "done" }
          return next
        })
      }
    } catch (err) {
      console.error("[photoroom] error:", err)
      const message = err instanceof Error ? err.message : "Photoroom misslyckades"
      setImages((prev) => {
        const next = [...prev] as [ImageState, ImageState]
        if (haveA) next[0] = { ...next[0], status: "error", error: message }
        if (haveB) next[1] = { ...next[1], status: "error", error: message }
        return next
      })
    }
  }, [images])

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
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background to-secondary/40">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border/60 bg-card/70 px-6 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground shadow-sm shadow-accent/25">
              <Layers className="h-[18px] w-[18px]" />
            </div>
            <div>
              <h1 className="text-[15px] font-semibold leading-none tracking-tight text-foreground">
                Bundla
              </h1>
              <p className="mt-1 text-[11px] leading-none text-muted-foreground">
                Bundling-bilder för e-handel
              </p>
            </div>
          </div>
          <Button
            onClick={handleExport}
            disabled={!hasAnyImage || isProcessing}
            className="gap-2 bg-accent text-accent-foreground shadow-sm shadow-accent/25 transition-all hover:bg-accent/90 hover:shadow-md hover:shadow-accent/25 active:scale-[0.98]"
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
          <div className="flex flex-col gap-4 animate-rise">
            <ImageDropZone
              label="Dra och släpp eller klicka för att välja"
              image={displayLeft}
              onImageChange={(url, file) => handleImageChange(url, file, 0)}
              onRemove={() => handleRemove(0)}
              index={0}
            />
            <ImageStatusBadge state={images[0]} />
          </div>

          {/* Right image upload */}
          <div className="flex flex-col gap-4 animate-rise [animation-delay:80ms]">
            <ImageDropZone
              label="Dra och släpp eller klicka för att välja"
              image={displayRight}
              onImageChange={(url, file) => handleImageChange(url, file, 1)}
              onRemove={() => handleRemove(1)}
              index={1}
            />
            <ImageStatusBadge state={images[1]} />
          </div>

          {/* Settings panel */}
          <aside className="flex flex-col gap-6 animate-rise [animation-delay:160ms]">
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
            <div className="rounded-xl border border-border/70 bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold tracking-tight text-foreground">Inställningar</h2>
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

                {/* Friläggningsmetod */}
                {autoRemoveBg && (
                  <div className="flex flex-col gap-2">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Friläggningsmetod
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setEngine("builtin")}
                        aria-pressed={engine === "builtin"}
                        className={cn(
                          "rounded-md border-2 px-3 py-2 text-xs font-medium transition-all",
                          engine === "builtin"
                            ? "border-accent bg-accent/5 text-foreground"
                            : "border-border text-muted-foreground hover:border-accent/50"
                        )}
                      >
                        Inbyggd AI
                      </button>
                      <button
                        type="button"
                        onClick={() => setEngine("photoroom")}
                        aria-pressed={engine === "photoroom"}
                        className={cn(
                          "rounded-md border-2 px-3 py-2 text-xs font-medium transition-all",
                          engine === "photoroom"
                            ? "border-accent bg-accent/5 text-foreground"
                            : "border-border text-muted-foreground hover:border-accent/50"
                        )}
                      >
                        Photoroom
                      </button>
                    </div>

                    {engine === "photoroom" && (
                      <>
                        <Button
                          onClick={runPhotoroom}
                          disabled={!hasAnyImage || isProcessing}
                          className="mt-1 w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
                        >
                          {isProcessing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Wand2 className="h-4 w-4" />
                          )}
                          Frilägg med Photoroom
                        </Button>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Slår ihop båda bilderna till ett anrop – 1 kredit per bundle.
                        </p>
                      </>
                    )}
                  </div>
                )}

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
                        Lägger ett "+" mellan produkterna
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
                  <Label className="text-sm font-medium">Bakgrundsfärg</Label>

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
                        aria-label={`Bakgrundsfärg: ${color.label}`}
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
                        aria-label="Valfri bakgrundsfärg"
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
              className="lg:hidden gap-2 bg-accent text-accent-foreground shadow-sm shadow-accent/25 transition-all hover:bg-accent/90 active:scale-[0.98]"
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
    normalizing: "Förbereder bild...",
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
