import { NextRequest } from "next/server"

// Server-side proxy to Photoroom's background-removal API. The API key is read
// from the PHOTOROOM_API_KEY environment variable and never reaches the client.
export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(req: NextRequest) {
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
    return Response.json(
      { error: "upstream_unreachable", message: "Tjänsten är inte tillgänglig just nu." },
      { status: 502 }
    )
  }

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => "")
    return Response.json(
      {
        error: "photoroom_failed",
        status: upstream.status,
        message:
          upstream.status === 402 || upstream.status === 403
            ? "Begäran nekades (kontrollera kvot/konfiguration)."
            : "Kunde inte bearbeta bilden.",
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
