import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Server-side background-removal proxy. The API key is read from the environment
// and never reaches the client. Requires a logged-in user and consumes one
// monthly credit from the user's organisation (refunded if the call fails).
export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(req: NextRequest) {
  // Only allow same-origin calls (our own app).
  const origin = req.headers.get("origin")
  const host = req.headers.get("host")
  if (!origin || !host) {
    return Response.json({ error: "forbidden" }, { status: 403 })
  }
  try {
    if (new URL(origin).host !== host) {
      return Response.json({ error: "forbidden" }, { status: 403 })
    }
  } catch {
    return Response.json({ error: "forbidden" }, { status: 403 })
  }

  const apiKey = process.env.API_PHOTOROOM
  if (!apiKey) {
    return Response.json(
      { error: "not_configured", message: "Tjänsten är inte konfigurerad." },
      { status: 500 }
    )
  }

  let input: Blob
  try {
    input = await req.blob()
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 })
  }
  if (!input || input.size === 0) {
    return Response.json({ error: "empty_image" }, { status: 400 })
  }

  // Auth + quota: reserve one credit before doing the paid work.
  const skipAuth = process.env.SKIP_AUTH === "true"
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user && !skipAuth) {
    return Response.json({ error: "unauthorized" }, { status: 401 })
  }

  // Skip quota check in dev mode
  if (!skipAuth) {
    const { data: consumeData, error: consumeError } = await supabase.rpc("consume_credit")
    const quota = Array.isArray(consumeData) ? consumeData[0] : consumeData
    if (consumeError || !quota?.allowed) {
      console.error(
        "[remove-bg] consume_credit blocked",
        JSON.stringify({
          userId: user?.id,
          consumeError: consumeError
            ? {
                message: consumeError.message,
                code: (consumeError as { code?: string }).code,
                details: (consumeError as { details?: string }).details,
                hint: (consumeError as { hint?: string }).hint,
              }
            : null,
          quota,
        })
      )
      return Response.json(
        {
          error: "quota",
          message: quota
            ? "Månadskvoten är slut. Hör av dig för att utöka."
            : "Du har inte åtkomst till friläggning.",
        },
        { status: 429 }
      )
    }
  }

  const refund = async () => {
    try {
      await supabase.rpc("refund_credit")
    } catch {
      // best-effort refund
    }
  }

  const form = new FormData()
  form.append("image_file", input, "image.png")
  form.append("format", "png")

  let upstream: Response
  try {
    upstream = await fetch("https://sdk.photoroom.com/v1/segment", {
      method: "POST",
      headers: { "x-api-key": apiKey },
      body: form,
    })
  } catch {
    await refund()
    return Response.json(
      { error: "upstream_unreachable", message: "Tjänsten är inte tillgänglig just nu." },
      { status: 502 }
    )
  }

  if (!upstream.ok) {
    await refund()
    const detail = await upstream.text().catch(() => "")
    return Response.json(
      {
        error: "upstream_failed",
        status: upstream.status,
        message: "Kunde inte bearbeta bilden.",
        detail: detail.slice(0, 500),
      },
      { status: 502 }
    )
  }

  const png = await upstream.arrayBuffer()
  return new Response(png, {
    status: 200,
    headers: {
      "content-type": "image/png",
      "cache-control": "no-store",
    },
  })
}
