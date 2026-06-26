import { ImageResponse } from "next/og"

export const alt = "Bundla: Två bilder. En bundle."
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// Branded share image, rendered with Bundla's warm paper + orange gradient.
export default function OpengraphImage() {
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
          fontFamily: "sans-serif",
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

        <div style={{ display: "flex", marginTop: 26, fontSize: 30, color: "#5C554B" }}>
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
    { ...size }
  )
}
