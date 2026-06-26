"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Download, Loader2, Info, AlertCircle, Wand2 } from "lucide-react"
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
// behind (stray shadow/reflection fragments). The largest connected component,
// the product itself, is always kept, and only islands smaller than
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

// Sends an image to our background-removal route and returns the cut-out PNG.
async function photoroomRemove(dataUrl: string): Promise<Blob> {
  const inputBlob = await (await fetch(dataUrl)).blob()
  const resp = await fetch("/api/remove-bg", {
    method: "POST",
    headers: { "content-type": "image/png" },
    body: inputBlob,
  })
  if (!resp.ok) {
    console.error("[frilaggning] route error", resp.status, await resp.text().catch(() => ""))
    throw new Error("Friläggningen misslyckades. Försök igen.")
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

type OutputFormat = { key: string; label: string; w: number; h: number; padding: number; gap: number }

// Output presets. The default "Standard" (2000×1700) matches the catalogue grid
// measured from Tretti's template: product band between 7.7% and 92.3% of height
// (top/bottom margin ~130px), and a gap between the products ≈ 17% of the width.
const FORMATS: OutputFormat[] = [
  { key: "standard", label: "Standard", w: 2000, h: 1700, padding: 130, gap: 340 },
  { key: "square", label: "Kvadrat", w: 1000, h: 1000, padding: 30, gap: 170 },
]

// "+" size as a fraction of canvas height. Tretti's measured ≈ 0.10.
const DEFAULT_PLUS_FRAC = 0.1

export function ProductCompositor() {
  const [images, setImages] = useState<[ImageState, ImageState]>([
    makeEmptyState(),
    makeEmptyState(),
  ])
  const [bgColor, setBgColor] = useState("#ffffff")
  const [customColor, setCustomColor] = useState("#ffffff")
  const [transparentBg, setTransparentBg] = useState(true)
  const [format, setFormat] = useState<OutputFormat>(FORMATS[0])
  const [padding, setPadding] = useState(FORMATS[0].padding)
  const [gap, setGap] = useState(FORMATS[0].gap)
  const [showPlus, setShowPlus] = useState(true)
  const [showGrid, setShowGrid] = useState(false)
  const [plusFrac, setPlusFrac] = useState(DEFAULT_PLUS_FRAC)

  // Switching format resets the inner margin and gap to that format's defaults.
  const selectFormat = (f: OutputFormat) => {
    setFormat(f)
    setPadding(f.padding)
    setGap(f.gap)
  }
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [usage, setUsage] = useState<{ used: number; quota: number; isAdmin?: boolean } | null>(null)

  const refreshUsage = useCallback(() => {
    fetch("/api/usage")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.hasOrg) setUsage({ used: d.used, quota: d.quota, isAdmin: d.isAdmin })
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    refreshUsage()
  }, [refreshUsage])

  const handleCanvasReady = useCallback((canvas: HTMLCanvasElement) => {
    canvasRef.current = canvas
  }, [])

  const processImage = useCallback(async (dataUrl: string, file: File, index: 0 | 1) => {
    // Show the original immediately; friläggning runs later via the action button.
    let element: HTMLImageElement | null = null
    try {
      element = await loadImage(dataUrl)
    } catch {
      // ignore; the slot just stays empty
    }
    setImages((prev) => {
      const next = [...prev] as [ImageState, ImageState]
      next[index] = {
        original: dataUrl,
        processed: null,
        file,
        element,
        status: "done",
        error: null,
      }
      return next
    })
  }, [])

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
      console.error("[frilaggning] error:", err)
      const message = err instanceof Error ? err.message : "Friläggningen misslyckades. Försök igen."
      setImages((prev) => {
        const next = [...prev] as [ImageState, ImageState]
        if (haveA) next[0] = { ...next[0], status: "error", error: message }
        if (haveB) next[1] = { ...next[1], status: "error", error: message }
        return next
      })
    } finally {
      refreshUsage()
    }
  }, [images, refreshUsage])

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
        a.download = "bundla-paketbild.png"
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
  const anyProcessed = images.some((img) => img.processed)

  return (
    <div className="flex min-h-screen flex-col bg-[var(--app-bg)] text-ink">
      {/* Top bar */}
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[var(--line-warm)] bg-[var(--surface)] px-5 sm:px-6">
        <div className="flex items-center gap-2.5">
          <svg width="30" height="30" viewBox="0 0 60 60" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id="bundlaMark" x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#FF8A2B" />
                <stop offset="1" stopColor="#FFB05C" />
              </linearGradient>
            </defs>
            <rect x="6" y="6" width="33" height="33" rx="10" fill="url(#bundlaMark)" />
            <rect x="21" y="21" width="33" height="33" rx="10" fill="#FF6A00" />
          </svg>
          <div className="leading-none">
            <div className="font-display text-[19px] font-bold tracking-[-0.02em]">Bundla</div>
            <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-ink-ghost">
              Studio
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {usage?.isAdmin && (
            <a
              href="/studio/team"
              className="hidden text-sm font-semibold text-ink-body transition-colors hover:text-ink sm:inline"
            >
              Team
            </a>
          )}
          {usage && usage.quota > 0 && (
            <span
              className="hidden font-mono text-[11px] text-ink-muted sm:inline"
              title="Förbrukade bundles denna månad"
            >
              {usage.used} / {usage.quota}
            </span>
          )}
          <a
            href="/docs"
            className="hidden items-center gap-2 rounded-[11px] border border-[var(--line-strong)] bg-white px-4 py-2.5 text-sm font-semibold text-ink-body transition-colors hover:bg-[var(--surface)] sm:inline-flex"
          >
            <Info className="h-4 w-4" />
            Hjälp
          </a>
          <button
            onClick={handleExport}
            disabled={!hasAnyImage || isProcessing}
            className="btn-brand inline-flex items-center gap-2 rounded-[11px] px-5 py-2.5 text-sm font-semibold disabled:pointer-events-none disabled:opacity-50"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {isProcessing ? "Bearbetar…" : "Exportera PNG"}
          </button>
        </div>
      </header>

      {/* Workspace */}
      <div className="grid flex-1 grid-cols-1 lg:h-[calc(100dvh-65px)] lg:grid-cols-[300px_1fr_340px]">
        {/* Källbilder */}
        <aside className="animate-rise border-b border-[var(--line-warm)] bg-[var(--paper)] p-6 lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-ghost">
            Källbilder
          </div>

          <div className="mb-2.5 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[var(--tint-orange)] font-display text-[11px] font-bold text-[var(--bundla-orange-deep)]">
              1
            </span>
            <span className="text-sm font-semibold">Produkt 1</span>
          </div>
          <ImageDropZone
            label="Dra in bild"
            image={displayLeft}
            onImageChange={(url, file) => handleImageChange(url, file, 0)}
            onRemove={() => handleRemove(0)}
            index={0}
          />
          <ImageStatusBadge state={images[0]} />

          <div className="my-3 flex justify-center">
            <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full border border-[var(--line-warm)] bg-white font-display text-[17px] font-semibold text-[var(--bundla-orange)]">
              +
            </div>
          </div>

          <div className="mb-2.5 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[var(--tint-orange)] font-display text-[11px] font-bold text-[var(--bundla-orange-deep)]">
              2
            </span>
            <span className="text-sm font-semibold">Produkt 2</span>
          </div>
          <ImageDropZone
            label="Dra in bild"
            image={displayRight}
            onImageChange={(url, file) => handleImageChange(url, file, 1)}
            onRemove={() => handleRemove(1)}
            index={1}
          />
          <ImageStatusBadge state={images[1]} />

          <div className="mt-5 border-t border-[var(--line-warm)] pt-3.5 font-mono text-[10px] uppercase leading-relaxed tracking-[0.08em] text-[#b3a995]">
            PNG · WebP · JPG
            <br />
            upp till 20 MB per bild
          </div>
        </aside>

        {/* Förhandsvisning */}
        <main className="animate-rise flex min-w-0 flex-col p-6 [animation-delay:80ms] sm:p-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-ghost">
              Förhandsvisning
            </div>
            {(isProcessing || hasAnyImage) && (
              <div className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-[var(--line-warm)] bg-white px-3 py-1.5 text-xs text-ink-body">
                <span
                  className={cn(
                    "h-[7px] w-[7px] rounded-full",
                    isProcessing
                      ? "animate-pulse bg-[var(--bundla-orange)]"
                      : anyProcessed
                      ? "bg-[var(--success)]"
                      : "bg-ink-ghost"
                  )}
                />
                {isProcessing ? "Bearbetar…" : anyProcessed ? "Frilagd" : "Original"}
              </div>
            )}
          </div>

          <CompositorCanvas
            leftImage={leftElement}
            rightImage={rightElement}
            backgroundColor={bgColor}
            transparent={transparentBg}
            padding={padding}
            gap={gap}
            showPlus={showPlus}
            showGrid={showGrid}
            plusFrac={plusFrac}
            outputW={format.w}
            outputH={format.h}
            onCanvasReady={handleCanvasReady}
          />

          <p className="mt-4 text-center text-xs text-ink-ghost">
            {hasAnyImage
              ? `Färdig bundle · ${format.w} × ${format.h} px`
              : "Dra in två bilder till vänster för att börja"}
          </p>
        </main>

        {/* Inställningar */}
        <aside className="animate-rise border-t border-[var(--line-warm)] bg-[var(--surface)] p-6 [animation-delay:160ms] lg:overflow-y-auto lg:border-t-0 lg:border-l">
          <h2 className="mb-5 font-display text-[17px] font-bold tracking-[-0.02em]">Inställningar</h2>

          <div className="flex flex-col">
            {/* Friläggning */}
            <div className="border-b border-[var(--line-soft)] pb-5">
              <button
                onClick={runPhotoroom}
                disabled={!hasAnyImage || isProcessing}
                className="btn-brand inline-flex w-full items-center justify-center gap-2 rounded-[11px] px-4 py-3 text-sm font-semibold disabled:pointer-events-none disabled:opacity-50"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
                {isProcessing ? "Frilägger…" : "Frilägg & skapa bundle"}
              </button>
              <p className="mt-2 text-xs text-ink-muted">
                Klipper ut båda produkterna och slår ihop dem till en bundle.
              </p>
            </div>

            {/* Plustecken */}
            <div className="flex items-start justify-between gap-3 border-b border-[var(--line-soft)] py-5">
              <div>
                <div className="text-sm font-semibold">Visa plustecken</div>
                <p className="mt-0.5 text-xs text-ink-muted">Lägger ett "+" mellan produkterna</p>
              </div>
              <Switch
                checked={showPlus}
                onCheckedChange={setShowPlus}
                aria-label="Visa plustecken mellan produkterna"
              />
            </div>

            {/* Rutnät */}
            <div className="flex items-start justify-between gap-3 border-b border-[var(--line-soft)] py-5">
              <div>
                <div className="text-sm font-semibold">Visa rutnät</div>
                <p className="mt-0.5 text-xs text-ink-muted">
                  Hjälplinjer i förhandsvisningen (syns inte i exporten)
                </p>
              </div>
              <Switch
                checked={showGrid}
                onCheckedChange={setShowGrid}
                aria-label="Visa rutnät i förhandsvisningen"
              />
            </div>

            {/* Format */}
            <div className="border-b border-[var(--line-soft)] py-5">
              <div className="mb-3 text-[13px] font-semibold">Format</div>
              <div className="grid grid-cols-2 gap-2">
                {FORMATS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => selectFormat(f)}
                    aria-label={`Format: ${f.label} ${f.w}×${f.h}`}
                    className={cn(
                      "rounded-lg px-3 py-2.5 text-left transition-all",
                      format.key === f.key
                        ? "border-[1.5px] border-[var(--bundla-orange)] bg-white"
                        : "border border-[var(--line-warm)] bg-white hover:border-[var(--bundla-orange)]/50"
                    )}
                  >
                    <div className="text-[13px] font-medium text-ink-body">{f.label}</div>
                    <div className="font-mono text-[11px] text-ink-ghost">
                      {f.w}×{f.h}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Bakgrundsfärg */}
            <div className="border-b border-[var(--line-soft)] py-5">
              <div className="mb-3 text-[13px] font-semibold">Bakgrundsfärg</div>
              <button
                onClick={() => setTransparentBg(true)}
                aria-label="Transparent bakgrund"
                className={cn(
                  "mb-3 flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all",
                  transparentBg
                    ? "border-[1.5px] border-[var(--bundla-orange)] bg-white text-ink-body"
                    : "border border-[var(--line-warm)] bg-white text-ink-muted hover:border-[var(--bundla-orange)]/50"
                )}
              >
                <span
                  className="checker h-[22px] w-[22px] shrink-0 rounded-md border border-[#e3e6e8]"
                  aria-hidden="true"
                />
                Transparent bakgrund (PNG)
              </button>
              <div className="mb-3 grid grid-cols-6 gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color.value}
                    title={color.label}
                    aria-label={`Bakgrundsfärg: ${color.label}`}
                    onClick={() => handleColorChange(color.value)}
                    className={cn(
                      "aspect-square rounded-[9px] border-2 transition-all hover:scale-105",
                      !transparentBg && bgColor === color.value
                        ? "border-[var(--bundla-orange)]"
                        : "border-black/10"
                    )}
                    style={{ backgroundColor: color.value }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-xs text-ink-muted">Eget:</span>
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="h-8 w-8 cursor-pointer rounded-md border border-[var(--line-warm)] bg-white p-0.5"
                  aria-label="Valfri bakgrundsfärg"
                />
                <span className="font-mono text-xs text-ink-muted">
                  {transparentBg ? "TRANSPARENT" : bgColor.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Inre marginal */}
            <div className="border-b border-[var(--line-soft)] py-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[13px] font-semibold">Inre marginal</span>
                <span className="font-mono text-xs text-[var(--bundla-orange)]">{padding}px</span>
              </div>
              <Slider
                min={0}
                max={400}
                step={10}
                value={[padding]}
                onValueChange={([v]) => setPadding(v)}
                aria-label="Inre marginal"
              />
            </div>

            {/* Mellanrum */}
            <div className="border-b border-[var(--line-soft)] py-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[13px] font-semibold">Mellanrum</span>
                <span className="font-mono text-xs text-[var(--bundla-orange)]">{gap}px</span>
              </div>
              <Slider
                min={0}
                max={600}
                step={10}
                value={[gap]}
                onValueChange={([v]) => setGap(v)}
                aria-label="Mellanrum mellan produkter"
              />
            </div>

            {/* Plusstorlek */}
            <div className="py-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[13px] font-semibold">Plusstorlek</span>
                <span className="font-mono text-xs text-[var(--bundla-orange)]">
                  {Math.round(plusFrac * 100)}%
                </span>
              </div>
              <Slider
                min={4}
                max={16}
                step={1}
                value={[Math.round(plusFrac * 100)]}
                onValueChange={([v]) => setPlusFrac(v / 100)}
                aria-label="Plusstorlek"
              />
            </div>

            {/* Mobile export */}
            <button
              onClick={handleExport}
              disabled={!hasAnyImage || isProcessing}
              className="btn-brand mt-2 inline-flex w-full items-center justify-center gap-2 rounded-[11px] px-5 py-3 text-sm font-semibold disabled:pointer-events-none disabled:opacity-50 lg:hidden"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {isProcessing ? "Bearbetar…" : "Exportera PNG"}
            </button>
          </div>
        </aside>
      </div>
    </div>
  )
}

function ImageStatusBadge({ state }: { state: ImageState }) {
  if (!state.original) return null

  const isProcessing = ["normalizing", "segmenting", "cleaning"].includes(state.status)

  const stepLabel: Record<string, string> = {
    normalizing: "Förbereder…",
    segmenting: "Klipper ut…",
    cleaning: "Rensar kanter…",
  }

  return (
    <div
      className={cn(
        "mt-2 flex items-center gap-2 text-xs",
        isProcessing && "text-[var(--bundla-orange-deep)]",
        state.status === "done" && state.processed && "text-[var(--success)]",
        state.status === "done" && !state.processed && "text-ink-muted",
        state.status === "error" && "text-[var(--bundla-orange-deep)]"
      )}
    >
      {isProcessing && (
        <>
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
          <span>{stepLabel[state.status]}</span>
        </>
      )}
      {state.status === "done" && state.processed && (
        <>
          <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--success)]" />
          <span>Frilagd</span>
        </>
      )}
      {state.status === "done" && !state.processed && (
        <>
          <span className="h-2 w-2 shrink-0 rounded-full bg-ink-ghost" />
          <span>Inladdad</span>
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
