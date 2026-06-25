import Link from "next/link"

function Mark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="mc-mark" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#FF8A2B" />
          <stop offset="1" stopColor="#FFB05C" />
        </linearGradient>
      </defs>
      <rect x="6" y="6" width="33" height="33" rx="10" fill="url(#mc-mark)" />
      <rect x="21" y="21" width="33" height="33" rx="10" fill="#FF6A00" />
    </svg>
  )
}

export function MarketingHeader() {
  return (
    <header className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-6 sm:px-10">
      <Link href="/" className="flex items-center gap-2.5">
        <Mark />
        <span className="font-display text-[23px] font-bold tracking-[-0.02em]">Bundla</span>
      </Link>
      <div className="flex items-center gap-4">
        <Link href="/login" className="text-[15px] font-semibold text-ink-body transition-colors hover:text-ink">
          Logga in
        </Link>
        <Link
          href="/studio"
          className="btn-brand inline-flex items-center gap-2 rounded-[11px] px-5 py-2.5 text-[15px] font-semibold"
        >
          Öppna Studio →
        </Link>
      </div>
    </header>
  )
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-[var(--line-warm)]">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-6 py-9 sm:px-10">
        <div className="flex items-center gap-2.5">
          <Mark size={26} />
          <span className="font-display text-[18px] font-bold tracking-[-0.02em]">Bundla</span>
        </div>
        <div className="text-sm text-ink-muted">© 2026 Bundla · Bundling-bilder för e-handel</div>
        <div className="flex flex-wrap gap-6 text-sm font-medium text-ink-body">
          <Link href="/losningar" className="transition-colors hover:text-ink">Lösningar</Link>
          <Link href="/docs" className="transition-colors hover:text-ink">Hjälp</Link>
          <Link href="/integritetspolicy" className="transition-colors hover:text-ink">Integritet</Link>
          <Link href="/villkor" className="transition-colors hover:text-ink">Villkor</Link>
          <a href="mailto:jakob.radback@markable.se" className="transition-colors hover:text-ink">Kontakt</a>
        </div>
      </div>
    </footer>
  )
}
