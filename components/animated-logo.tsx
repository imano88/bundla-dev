import type { CSSProperties } from "react"

// Bundla logomark with the hover animation from the design handoff: on hover of
// the parent `.group`, the two rounded squares slide together and the mark
// scales up slightly, with a springy ease. Pure CSS (see globals.css .logo-anim*).
export function AnimatedLogoMark({ size = 34 }: { size?: number }) {
  const box = (size * 40) / 64
  const off = (size * 24) / 64
  const move = (size * 12) / 64
  const rad = (size * 12) / 64
  const boxBase: CSSProperties = {
    position: "absolute",
    width: box,
    height: box,
    borderRadius: rad,
    opacity: 0.92,
  }
  return (
    <span
      className="logo-anim"
      aria-hidden="true"
      style={{ position: "relative", display: "inline-block", width: size, height: size }}
    >
      <span
        className="logo-anim-a"
        style={{
          ...boxBase,
          left: 0,
          top: 0,
          background: "linear-gradient(135deg,#FF8A2B,#FFB05C)",
          ["--mv" as string]: `${move}px`,
        }}
      />
      <span
        className="logo-anim-b"
        style={{
          ...boxBase,
          left: off,
          top: off,
          background: "#FF6A00",
          ["--mv" as string]: `${move}px`,
        }}
      />
    </span>
  )
}
