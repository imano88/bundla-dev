import type { CSSProperties } from "react"

// aria-hidden="true" is intentional — this component must always be accompanied
// by visible text (e.g. "Bundla" next to it in the nav) to provide a text alternative.
export function AnimatedLogoMark({ size = 34 }: { size?: number }) {
  const box  = (size * 46) / 64
  const off  = (size * 18) / 64
  const move = (size * 9)  / 64
  const rad  = (size * 12) / 64
  const cx   = size / 2
  const cy   = size / 2
  const arm  = (size * 5)  / 64
  const pad  = arm * 1.25
  const sw   = Math.max(1, size * 0.047)

  return (
    <span
      className="logo-anim"
      aria-hidden="true"
      style={{ position: "relative", display: "inline-block", width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
        {/* Square A — top-left, lighter orange outline */}
        <rect
          x={sw / 2} y={sw / 2} width={box - sw} height={box - sw} rx={rad}
          fill="none" stroke="#FFB05C" strokeWidth={sw}
          className="logo-anim-a"
          style={{ ["--mv" as string]: `${move}px` } as CSSProperties}
        />

        {/* Square B — bottom-right, deeper orange outline */}
        <rect
          x={off + sw / 2} y={off + sw / 2} width={box - sw} height={box - sw} rx={rad}
          fill="none" stroke="#FF6A00" strokeWidth={sw}
          className="logo-anim-b"
          style={{ ["--mv" as string]: `${move}px` } as CSSProperties}
        />

        {/* White circle gives the plus breathing room against the orange borders */}
        <circle cx={cx} cy={cy} r={pad} fill="white" />

        {/* Plus — fades out on hover */}
        <line className="logo-plus" x1={cx} y1={cy - arm} x2={cx} y2={cy + arm}
          stroke="#FFB05C" strokeWidth={sw} strokeLinecap="round" />
        <line className="logo-plus" x1={cx - arm} y1={cy} x2={cx + arm} y2={cy}
          stroke="#FFB05C" strokeWidth={sw} strokeLinecap="round" />

        {/* Checkmark — fades in after hover animation completes */}
        <path className="logo-check"
          d={`M ${cx - arm} ${cy} L ${cx - arm * 0.15} ${cy + arm * 0.72} L ${cx + arm} ${cy - arm * 0.55}`}
          stroke="#FF6A00" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </span>
  )
}
