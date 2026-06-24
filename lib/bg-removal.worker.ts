// Web Worker that runs the heavy AI background removal off the main thread.
// Keeping the ONNX/WASM inference here means the UI never freezes, so the user
// can drop both product images at once and they are processed concurrently
// with a fully responsive interface.
import { removeBackground } from "@imgly/background-removal"

interface RemoveRequest {
  id: number
  dataUrl: string
}

// `self` is the DedicatedWorkerGlobalScope here; cast to keep TS happy without
// pulling the "webworker" lib into the project-wide tsconfig.
const ctx = self as unknown as {
  postMessage: (message: unknown) => void
  addEventListener: (type: "message", listener: (e: MessageEvent<RemoveRequest>) => void) => void
}

ctx.addEventListener("message", async (e) => {
  const { id, dataUrl } = e.data
  try {
    const blob = await removeBackground(dataUrl, {
      model: "isnet",
      output: { format: "image/png", quality: 1 },
    })
    ctx.postMessage({ id, blob })
  } catch (err) {
    ctx.postMessage({ id, error: err instanceof Error ? err.message : "unknown error" })
  }
})
