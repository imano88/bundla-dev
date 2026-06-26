import Link from "next/link"
import { AnimatedLogoMark } from "@/components/animated-logo"
import {
  CONTACT_EMAIL,
  LINKEDIN_URL,
  COMPANY_NAME,
  COMPANY_ORG_NR,
  COMPANY_VAT,
} from "@/lib/site"

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
      <Link href="/" className="group flex items-center gap-2.5">
        <AnimatedLogoMark size={30} />
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

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-ghost">{title}</span>
      <div className="flex flex-col gap-2.5 text-sm font-medium text-ink-body">{children}</div>
    </div>
  )
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-[var(--line-warm)]">
      <div className="mx-auto max-w-[1200px] px-6 py-12 sm:px-10">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
          {/* Brand + company */}
          <div className="flex max-w-[300px] flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <Mark size={26} />
              <span className="font-display text-[18px] font-bold tracking-[-0.02em]">Bundla</span>
            </div>
            <p className="text-sm text-ink-muted">En tjänst av {COMPANY_NAME}.</p>
            <p className="text-[13px] leading-relaxed text-ink-ghost">
              {COMPANY_NAME} · Org.nr {COMPANY_ORG_NR}
              <br />
              VAT {COMPANY_VAT}
            </p>
          </div>

          {/* Link columns */}
          <div className="flex flex-wrap gap-x-14 gap-y-8">
            <FooterColumn title="Produkt">
              <Link href="/losningar" className="transition-colors hover:text-ink">Lösningar</Link>
              <Link href="/docs" className="transition-colors hover:text-ink">Hjälp</Link>
            </FooterColumn>
            <FooterColumn title="Juridik">
              <Link href="/integritetspolicy" className="transition-colors hover:text-ink">Integritetspolicy</Link>
              <Link href="/villkor" className="transition-colors hover:text-ink">Användarvillkor</Link>
            </FooterColumn>
            <FooterColumn title="Kontakt">
              <a href={`mailto:${CONTACT_EMAIL}`} className="transition-colors hover:text-ink">Kontakt</a>
              <a href={LINKEDIN_URL} target="_blank" rel="noreferrer" className="transition-colors hover:text-ink">LinkedIn</a>
            </FooterColumn>
          </div>
        </div>

        <div className="mt-10 border-t border-[var(--line-warm)] pt-6 text-sm text-ink-muted">
          © 2026 · En tjänst av {COMPANY_NAME}
        </div>
      </div>
    </footer>
  )
}
