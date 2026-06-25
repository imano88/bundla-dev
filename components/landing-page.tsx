import Link from "next/link"
import Image from "next/image"
import { FAQ } from "@/lib/faq"
import { SOLUTIONS } from "@/lib/landing-pages"
import { MobileMenu } from "@/components/mobile-menu"

function Mark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="lmark" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#FF8A2B" />
          <stop offset="1" stopColor="#FFB05C" />
        </linearGradient>
      </defs>
      <rect x="6" y="6" width="33" height="33" rx="10" fill="url(#lmark)" />
      <rect x="21" y="21" width="33" height="33" rx="10" fill="#FF6A00" />
    </svg>
  )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 inline-flex items-center gap-3">
      <span className="h-0.5 w-[30px] bg-[var(--bundla-orange)]" />
      <span className="font-mono text-[12px] uppercase tracking-[0.14em] text-[var(--bundla-orange-deep)]">
        {children}
      </span>
    </div>
  )
}

const STEPS = [
  {
    n: "01",
    title: "Dra in två bilder",
    body: "Släpp produktfoton rakt in i Studion. PNG, WebP eller JPG, upp till 20 MB styck.",
  },
  {
    n: "02",
    title: "Friläggs automatiskt",
    body: "Bakgrunden tas bort och produkterna placeras med jämn marginal och mellanrum.",
  },
  {
    n: "03",
    title: "Exportera färdig PNG",
    body: "Ladda ner en transparent eller färgsatt paketbild, redo att läggas upp direkt i butiken.",
  },
]

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--paper)] text-ink">
      {/* Nav */}
      <header className="relative mx-auto flex max-w-[1200px] items-center justify-between px-6 py-6 sm:px-10">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="inline-flex transition-transform duration-300 ease-out group-hover:rotate-[-6deg] group-hover:scale-110">
            <Mark />
          </span>
          <span className="font-display text-[23px] font-bold tracking-[-0.02em]">Bundla</span>
        </Link>
        <nav className="hidden items-center gap-8 text-[15px] font-medium text-ink-body md:flex">
          <Link href="/losningar" className="transition-colors hover:text-ink">Lösningar</Link>
          <a href="#sa-funkar" className="transition-colors hover:text-ink">Så funkar det</a>
          <a href="#priser" className="transition-colors hover:text-ink">Priser</a>
          <a href="#faq" className="transition-colors hover:text-ink">Vanliga frågor</a>
        </nav>
        <div className="hidden items-center gap-4 md:flex">
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
        <MobileMenu />
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-[1200px] items-center gap-12 px-6 pb-12 pt-10 sm:px-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <Eyebrow>Byggd för e-handel</Eyebrow>
          <h1 className="font-display text-[38px] font-bold leading-[1.02] tracking-[-0.035em] sm:text-[48px] lg:text-[60px]">
            Två produktbilder.
            <br />
            En färdig{" "}
            <span
              style={{
                background: "var(--gradient-brand)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              bundle
            </span>
            .
          </h1>
          <p className="mt-5 max-w-[440px] text-[17px] leading-relaxed text-ink-body sm:text-[19px]">
            Dra in två produktbilder. Bundla frilägger dem automatiskt och sätter ihop dem till en
            snygg paketbild, redo för butiken på sekunder.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-3.5">
            <Link
              href="/studio"
              className="btn-brand inline-flex w-full items-center justify-center gap-2 rounded-[11px] px-6 py-3.5 text-base font-semibold sm:w-auto"
            >
              Öppna Studio →
            </Link>
            <a
              href="#sa-funkar"
              className="inline-flex w-full items-center justify-center gap-2 rounded-[11px] border border-[var(--line-strong)] bg-[var(--surface)] px-5 py-3.5 text-base font-semibold text-ink transition-colors hover:bg-white sm:w-auto"
            >
              Se hur det funkar
            </a>
          </div>
          <p className="mt-5 text-sm text-ink-muted">Inga lager, ingen Photoshop. Bara dra och släpp.</p>
        </div>

        {/* Preview card */}
        <div className="rounded-[28px] border border-[var(--line-soft)] bg-white p-6 shadow-[var(--shadow-float)]">
          <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-ghost">
            Förhandsvisning
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-row gap-3 sm:flex-col">
              <div className="checker flex h-[104px] w-full items-center justify-center overflow-hidden rounded-[14px] border border-[#eceaea] sm:w-[110px]">
                <Image
                  src="/images/preview-tvattmaskin.png"
                  alt="Tvättmaskin, frilagd"
                  width={110}
                  height={104}
                  className="h-full w-full object-contain p-1.5"
                />
              </div>
              <div className="checker flex h-[104px] w-full items-center justify-center overflow-hidden rounded-[14px] border border-[#eceaea] sm:w-[110px]">
                <Image
                  src="/images/preview-torktumlare.png"
                  alt="Torktumlare, frilagd"
                  width={110}
                  height={104}
                  className="h-full w-full object-contain p-1.5"
                />
              </div>
            </div>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#FF6A00" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mx-auto shrink-0 rotate-90 sm:rotate-0">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
            <div className="checker relative flex h-[220px] w-full items-center justify-center overflow-hidden rounded-2xl border border-[#eceaea] sm:h-[232px] sm:flex-1">
              <span className="absolute right-2.5 top-2.5 z-10 rounded-md border border-[var(--tint-orange)] bg-white px-1.5 py-0.5 font-mono text-[9px] text-[var(--bundla-orange)]">
                PNG · transparent
              </span>
              <Image
                src="/images/preview-bundle.png"
                alt="Färdig bundle: tvättmaskin och torktumlare sammansatta"
                width={420}
                height={232}
                className="h-full w-full object-contain p-3"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Platform strip */}
      <section className="mx-auto max-w-[1200px] px-6 pb-16 sm:px-10">
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-center sm:gap-7 sm:text-left">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#b3a995]">Fungerar med</span>
          <div className="flex w-full flex-col items-center gap-2.5 sm:w-auto sm:flex-row sm:flex-wrap sm:gap-3">
            {["Shopify", "WooCommerce", "Centra", "Magento", "Fortnox"].map((p) => (
              <span
                key={p}
                className="inline-flex items-center rounded-full border border-[var(--line-soft)] bg-white/70 px-4 py-1.5 font-display text-[15px] font-medium text-[#6f675b] shadow-[var(--shadow-card)]"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Så funkar det */}
      <section id="sa-funkar" className="mx-auto max-w-[1200px] px-6 pb-16 sm:px-10 sm:pb-24">
        <div className="mb-9 flex flex-col gap-4 sm:mb-11 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div>
            <Eyebrow>Så funkar det</Eyebrow>
            <h2 className="font-display text-[34px] font-bold leading-tight tracking-[-0.03em] sm:text-[40px]">
              Från två filer till färdig
              <br className="hidden sm:block" /> paketbild på tre steg
            </h2>
          </div>
          <p className="max-w-[300px] text-base leading-relaxed text-ink-body">
            Ingen Photoshop, inga lager, inga friläggningsverktyg. Bundla gör jobbet åt dig.
          </p>
        </div>
        <div className="grid gap-10 sm:grid-cols-3 sm:gap-12">
          {STEPS.map((s) => (
            <div key={s.n}>
              <div className="mb-6 border-t-2 border-ink pt-4">
                <span
                  className="font-display text-[40px] font-bold leading-none"
                  style={{
                    background: "var(--gradient-brand)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  {s.n}
                </span>
              </div>
              <h3 className="mb-3 font-display text-[23px] font-semibold tracking-[-0.02em]">{s.title}</h3>
              <p className="text-base leading-relaxed text-ink-body">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Lösningar */}
      <section className="mx-auto max-w-[1200px] px-6 pb-16 sm:px-10 sm:pb-24">
        <div className="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div>
            <Eyebrow>Lösningar</Eyebrow>
            <h2 className="font-display text-[34px] font-bold tracking-[-0.03em] sm:text-[40px]">
              Bundla för ditt behov
            </h2>
          </div>
          <Link href="/losningar" className="text-sm font-semibold text-[var(--bundla-orange-deep)] hover:underline">
            Alla lösningar →
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SOLUTIONS.map((s) => (
            <Link
              key={s.slug}
              href={`/losningar/${s.slug}`}
              className="group flex flex-col rounded-[20px] border border-[var(--line-soft)] bg-white p-6 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-pop)]"
            >
              <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-ghost">{s.eyebrow}</div>
              <h3 className="mt-3 flex-1 font-display text-[19px] font-semibold leading-snug tracking-[-0.02em]">{s.metaTitle}</h3>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--bundla-orange-deep)]">
                Läs mer
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Priser */}
      <section id="priser" className="mx-auto max-w-[1200px] px-6 pb-16 sm:px-10 sm:pb-24">
        <Eyebrow>Priser</Eyebrow>
        <h2 className="mb-10 font-display text-[34px] font-bold tracking-[-0.03em] sm:text-[40px]">
          Enkelt och flexibelt
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:max-w-[760px]">
          <div className="rounded-[22px] border border-[var(--line-soft)] bg-white p-7 shadow-[var(--shadow-card)]">
            <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-ghost">Test</div>
            <div className="mt-3 font-display text-[40px] font-bold tracking-[-0.02em]">Demo</div>
            <p className="mt-2 text-sm text-ink-body">Provkör Studion och se kvaliteten innan ni rullar ut det i teamet.</p>
            <Link href="/studio" className="mt-6 inline-flex rounded-[11px] border border-[var(--line-strong)] bg-[var(--surface)] px-5 py-3 text-sm font-semibold transition-colors hover:bg-white">
              Öppna Studio →
            </Link>
          </div>
          <div className="rounded-[22px] border border-[var(--tint-orange-border,#F6D2B6)] bg-white p-7 shadow-[var(--shadow-pop)]">
            <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--bundla-orange-deep)]">Företag</div>
            <div className="mt-3 font-display text-[40px] font-bold tracking-[-0.02em]">Skräddarsytt</div>
            <p className="mt-2 text-sm text-ink-body">Egen kvot per månad, fler användare och support. Vi sätter upp ett konto åt er.</p>
            <a href="mailto:jakob.radback@markable.se" className="btn-brand mt-6 inline-flex rounded-[11px] px-5 py-3 text-sm font-semibold">
              Kontakta oss
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-[1200px] px-6 pb-16 sm:px-10 sm:pb-24">
        <Eyebrow>Vanliga frågor</Eyebrow>
        <h2 className="mb-10 font-display text-[34px] font-bold tracking-[-0.03em] sm:text-[40px]">
          Frågor och svar
        </h2>
        <div className="flex flex-col gap-3 lg:max-w-[820px]">
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="group rounded-[18px] border border-[var(--line-soft)] bg-white px-6 py-5 shadow-[var(--shadow-card)]"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-[18px] font-semibold tracking-[-0.01em]">
                {item.q}
                <span className="shrink-0 text-[var(--bundla-orange)] transition-transform group-open:rotate-45" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </summary>
              <p className="mt-3 text-base leading-relaxed text-ink-body">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1200px] px-6 pb-16 sm:px-10 sm:pb-24">
        <div
          className="relative overflow-hidden rounded-[28px] px-6 py-12 sm:px-14 sm:py-16"
          style={{ background: "var(--gradient-brand-cta)" }}
        >
          <div className="absolute -right-16 -top-16 h-80 w-80 rounded-full bg-white/10" />
          <div className="relative max-w-[560px]">
            <h2 className="font-display text-[32px] font-bold leading-[1.05] text-white sm:text-[46px]">
              Bundla dina produkter idag
            </h2>
            <p className="mt-4 text-[17px] leading-relaxed text-[#FFEAD8] sm:text-[18px]">
              Skapa snygga paketbilder på sekunder, utan Photoshop, utan krångel.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-3.5">
              <Link href="/studio" className="inline-flex w-full items-center justify-center gap-2 rounded-[11px] bg-ink px-7 py-3.5 text-base font-semibold text-white transition-transform active:translate-y-px sm:w-auto">
                Öppna Studio →
              </Link>
              <a href="#priser" className="inline-flex w-full items-center justify-center rounded-[11px] bg-white/90 px-7 py-3.5 text-base font-semibold text-ink transition-colors hover:bg-white sm:w-auto">
                Se priser
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--line-warm)]">
        <div className="mx-auto flex max-w-[1200px] flex-col items-start gap-6 px-6 py-9 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:px-10">
          <div className="flex items-center gap-2.5">
            <Mark size={26} />
            <span className="font-display text-[18px] font-bold tracking-[-0.02em]">Bundla</span>
          </div>
          <div className="order-last text-sm text-ink-muted sm:order-none">© 2026 Bundla · Bundling-bilder för e-handel</div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-ink-body">
            <Link href="/losningar" className="transition-colors hover:text-ink">Lösningar</Link>
            <Link href="/docs" className="transition-colors hover:text-ink">Hjälp</Link>
            <Link href="/integritetspolicy" className="transition-colors hover:text-ink">Integritet</Link>
            <Link href="/villkor" className="transition-colors hover:text-ink">Villkor</Link>
            <a href="mailto:jakob.radback@markable.se" className="transition-colors hover:text-ink">Kontakt</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
