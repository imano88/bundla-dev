import { ImageResponse } from "next/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

// Bundla logomark (overlapping rounded squares) on warm paper.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F4F0E9",
        }}
      >
        <div style={{ position: "relative", width: 104, height: 104, display: "flex" }}>
          <div
            style={{
              position: "absolute",
              left: 10,
              top: 10,
              width: 58,
              height: 58,
              borderRadius: 18,
              background: "linear-gradient(135deg, #FF8A2B, #FFB05C)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 36,
              top: 36,
              width: 58,
              height: 58,
              borderRadius: 18,
              background: "#FF6A00",
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  )
}
