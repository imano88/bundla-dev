import type { Metadata } from "next"
import Link from "next/link"
import { SOLUTIONS } from "@/lib/landing-pages"
import { MarketingHeader, MarketingFooter } from "@/components/marketing-chrome"

export const metadata: Metadata = {
  title: "Lösningar",
  description:
    "Se hur Bundla hjälper e-handlare och byråer med friläggning, paketbilder och produktbilder utan Photoshop.",
  alternates: { canonical: "/losningar" },
}

export default function SolutionsIndex() {
  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-ink">
      <MarketingHeader />
      <section className="mx-auto max-w-[1200px] px-6 pt-10 pb-16 sm:px-10">
        <Link href="/" aria-label="Tillbaka till startsidan" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-body transition-colors hover:text-ink">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Tillbaka
        </Link>
        <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-ghost">Lösningar</div>
        <h1 className="max-w-[760px] font-display text-[38px] font-bold leading-[1.05] tracking-[-0.03em] sm:text-[52px]">
          Vad vill du lösa?
        </h1>
        <p className="mt-5 max-w-[560px] text-[19px] leading-relaxed text-ink-body">
          Bundla skapar frilagda produkt- och paketbilder för e-handel. Välj det som passar dig.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {SOLUTIONS.map((s) => (
            <Link
              key={s.slug}
              href={`/losningar/${s.slug}`}
              className="group rounded-[22px] border border-[var(--line-soft)] bg-white p-7 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-pop)]"
            >
              <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-ghost">{s.eyebrow}</div>
              <h2 className="mt-3 font-display text-[24px] font-semibold leading-tight tracking-[-0.02em]">{s.h1}</h2>
              <p className="mt-2 text-base leading-relaxed text-ink-body">{s.intro[0]}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--bundla-orange-deep)]">
                Läs mer
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
      <MarketingFooter />
    </div>
  )
}
