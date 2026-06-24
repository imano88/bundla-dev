// Manager around the background-removal Web Worker. The worker keeps the heavy
// AI inference off the main thread, so the UI stays responsive and the user can
// drop both product images at once. Falls back to running on the main thread if
// Web Workers are unavailable (very old browsers).

type Pending = { resolve: (b: Blob) => void; reject: (e: Error) => void }

let worker: Worker | null = null
let workerUnavailable = false
let seq = 0
const pending = new Map<number, Pending>()

function rejectAll(message: string) {
  for (const [id, p] of pending) {
    p.reject(new Error(message))
    pending.delete(id)
  }
}

function ensureWorker(): Worker | null {
  if (workerUnavailable) return null
  if (worker) return worker
  if (typeof Worker === "undefined") {
    workerUnavailable = true
    return null
  }
  try {
    worker = new Worker(new URL("./bg-removal.worker.ts", import.meta.url), { type: "module" })
    worker.onmessage = (e: MessageEvent<{ id: number; blob?: Blob; error?: string }>) => {
      const { id, blob, error } = e.data
      const p = pending.get(id)
      if (!p) return
      pending.delete(id)
      if (error || !blob) p.reject(new Error(error ?? "background removal failed"))
      else p.resolve(blob)
    }
    worker.onerror = () => {
      // The worker crashed (e.g. failed to load). Disable it and fail any
      // in-flight requests; future calls fall back to the main thread.
      workerUnavailable = true
      worker?.terminate()
      worker = null
      rejectAll("background removal worker crashed")
    }
    return worker
  } catch {
    workerUnavailable = true
    return null
  }
}

export async function removeProductBackground(dataUrl: string): Promise<Blob> {
  const w = ensureWorker()
  if (!w) {
    // Main-thread fallback (blocks the UI, but keeps the feature working).
    const { removeBackground } = await import("@imgly/background-removal")
    return removeBackground(dataUrl, {
      model: "isnet",
      output: { format: "image/png", quality: 1 },
    })
  }
  return new Promise<Blob>((resolve, reject) => {
    const id = ++seq
    pending.set(id, { resolve, reject })
    w.postMessage({ id, dataUrl })
  })
}
