import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { SOLUTIONS, getSolution } from "@/lib/landing-pages"
import { SITE_URL } from "@/lib/site"
import { JsonLd } from "@/components/json-ld"
import { MarketingHeader, MarketingFooter } from "@/components/marketing-chrome"

export function generateStaticParams() {
  return SOLUTIONS.map((s) => ({ slug: s.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const s = getSolution(slug)
  if (!s) return {}
  return {
    title: s.metaTitle,
    description: s.metaDescription,
    alternates: { canonical: `/losningar/${s.slug}` },
    openGraph: {
      title: s.metaTitle,
      description: s.metaDescription,
      url: `${SITE_URL}/losningar/${s.slug}`,
      type: "article",
    },
  }
}

export default async function SolutionPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const s = getSolution(slug)
  if (!s) notFound()

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Hem", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Lösningar", item: `${SITE_URL}/losningar` },
      { "@type": "ListItem", position: 3, name: s.h1, item: `${SITE_URL}/losningar/${s.slug}` },
    ],
  }
  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: s.faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  }

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-ink">
      <JsonLd data={[breadcrumb, faqPage]} />
      <MarketingHeader />

      {/* Hero */}
      <section className="mx-auto max-w-[820px] px-6 pt-10 pb-14 sm:px-10">
        <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-ghost">
          {s.eyebrow}
        </div>
        <h1 className="font-display text-[38px] font-bold leading-[1.05] tracking-[-0.03em] sm:text-[52px]">
          {s.h1}
        </h1>
        {s.intro.map((p) => (
          <p key={p} className="mt-5 text-[19px] leading-relaxed text-ink-body">
            {p}
          </p>
        ))}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-3.5">
          <Link href="/studio" className="btn-brand inline-flex w-full items-center justify-center gap-2 rounded-[11px] px-7 py-3.5 text-base font-semibold sm:w-auto">
            Öppna Studio →
          </Link>
          <Link href="/losningar" className="inline-flex w-full items-center justify-center rounded-[11px] border border-[var(--line-strong)] bg-[var(--surface)] px-7 py-3.5 text-base font-semibold transition-colors hover:bg-white sm:w-auto">
            Alla lösningar
          </Link>
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto max-w-[1200px] px-6 pb-20 sm:px-10">
        <h2 className="mb-10 font-display text-[28px] font-bold tracking-[-0.03em] sm:text-[34px]">
          {s.benefitsTitle}
        </h2>
        <div className="grid gap-8 sm:grid-cols-3">
          {s.benefits.map((b) => (
            <div key={b.title}>
              <div className="mb-4 border-t-2 border-ink pt-4" />
              <h3 className="mb-2 font-display text-[20px] font-semibold tracking-[-0.02em]">{b.title}</h3>
              <p className="text-base leading-relaxed text-ink-body">{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="mx-auto max-w-[1200px] px-6 pb-20 sm:px-10">
        <h2 className="mb-10 font-display text-[28px] font-bold tracking-[-0.03em] sm:text-[34px]">
          Så funkar det
        </h2>
        <div className="grid gap-10 sm:grid-cols-3 sm:gap-12">
          {s.steps.map((step, i) => (
            <div key={step.title}>
              <span
                className="font-display text-[34px] font-bold leading-none"
                style={{ background: "var(--gradient-brand)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 mb-2 font-display text-[20px] font-semibold tracking-[-0.02em]">{step.title}</h3>
              <p className="text-base leading-relaxed text-ink-body">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-[820px] px-6 pb-20 sm:px-10">
        <h2 className="mb-8 font-display text-[28px] font-bold tracking-[-0.03em] sm:text-[34px]">
          Vanliga frågor
        </h2>
        <div className="flex flex-col gap-3">
          {s.faq.map((item) => (
            <details key={item.q} className="group rounded-[18px] border border-[var(--line-soft)] bg-white px-6 py-5 shadow-[var(--shadow-card)]">
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
      <section className="mx-auto max-w-[1200px] px-6 pb-24 sm:px-10">
        <div className="relative overflow-hidden rounded-[28px] px-6 py-12 sm:px-14 sm:py-16" style={{ background: "var(--gradient-brand-cta)" }}>
          <div className="absolute -right-16 -top-16 h-80 w-80 rounded-full bg-white/10" />
          <div className="relative max-w-[560px]">
            <h2 className="font-display text-[32px] font-bold leading-none text-white sm:text-[42px]">{s.ctaTitle}</h2>
            <p className="mt-4 text-[18px] leading-relaxed text-[#FFEAD8]">{s.ctaText}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-3.5">
              <Link href="/studio" className="inline-flex w-full items-center justify-center gap-2 rounded-[11px] bg-ink px-7 py-3.5 text-base font-semibold text-white transition-transform active:translate-y-px sm:w-auto">
                Öppna Studio →
              </Link>
              <a href="mailto:jakob.radback@markable.se" className="inline-flex w-full items-center justify-center rounded-[11px] bg-white/90 px-7 py-3.5 text-base font-semibold text-ink transition-colors hover:bg-white sm:w-auto">
                Kontakta oss
              </a>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
