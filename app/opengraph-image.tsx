import { ImageResponse } from "next/og"

export const alt = "Bundla: Två bilder. En bundle."
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// All glyphs used in the image, so we only fetch a tiny subset of the font.
const FONT_TEXT = "Bundla Två bilder. En bundle. Automatisk friläggning för e-handel."

// Fetch a specific weight of a Google font as TTF (the format Satori needs).
async function loadFont(weight: number): Promise<ArrayBuffer> {
  const url = `https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@${weight}&text=${encodeURIComponent(
    FONT_TEXT
  )}`
  const css = await (await fetch(url)).text()
  const match = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)
  if (!match) throw new Error("font url not found")
  const res = await fetch(match[1])
  if (!res.ok) throw new Error("font fetch failed")
  return res.arrayBuffer()
}

// Branded share image, rendered with Bundla's warm paper + orange gradient.
export default async function OpengraphImage() {
  // Load the brand display font so the image matches the site. If it fails for
  // any reason, fall back to the system sans-serif rather than break the build.
  let fonts: { name: string; data: ArrayBuffer; weight: 400 | 700 | 800; style: "normal" }[] | undefined
  let fontFamily = "sans-serif"
  try {
    const [w400, w700, w800] = await Promise.all([loadFont(400), loadFont(700), loadFont(800)])
    fonts = [
      { name: "Bricolage", data: w400, weight: 400, style: "normal" },
      { name: "Bricolage", data: w700, weight: 700, style: "normal" },
      { name: "Bricolage", data: w800, weight: 800, style: "normal" },
    ]
    fontFamily = "Bricolage"
  } catch {
    fonts = undefined
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "84px",
          background: "#F4F0E9",
          fontFamily,
        }}
      >
        {/* Wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 22, marginBottom: 44 }}>
          <div style={{ position: "relative", width: 64, height: 64, display: "flex" }}>
            <div
              style={{
                position: "absolute",
                left: 6,
                top: 6,
                width: 36,
                height: 36,
                borderRadius: 12,
                background: "linear-gradient(135deg, #FF8A2B, #FFB05C)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 22,
                top: 22,
                width: 36,
                height: 36,
                borderRadius: 12,
                background: "#FF6A00",
              }}
            />
          </div>
          <div style={{ display: "flex", fontSize: 38, fontWeight: 700, color: "#1A1512" }}>
            Bundla
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            display: "flex",
            fontSize: 92,
            fontWeight: 800,
            color: "#1A1512",
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
            maxWidth: 900,
          }}
        >
          <span>Två bilder. En&nbsp;</span>
          <span style={{ color: "#FF6A00" }}>bundle.</span>
        </div>

        <div style={{ display: "flex", marginTop: 26, fontSize: 30, fontWeight: 400, color: "#5C554B" }}>
          Automatisk friläggning för e-handel.
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 46,
            width: 128,
            height: 8,
            borderRadius: 8,
            background: "linear-gradient(100deg, #FF6A00, #FFA24A)",
          }}
        />
      </div>
    ),
    { ...size, fonts }
  )
}
