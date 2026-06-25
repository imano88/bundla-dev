import Link from "next/link"
import { MarketingHeader, MarketingFooter } from "@/components/marketing-chrome"

export const metadata = { title: "Sidan hittades inte", robots: { index: false } }

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--app-bg)] text-ink">
      <MarketingHeader />
      <main className="mx-auto flex w-full max-w-[680px] flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-ghost">
          Sidan hittades inte
        </div>
        <h1 className="mt-4 font-display text-[72px] font-bold leading-none tracking-[-0.03em]">404</h1>
        <p className="mt-4 max-w-[420px] text-[17px] leading-relaxed text-ink-body">
          Sidan du letar efter finns inte eller har flyttat.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3.5">
          <Link href="/" className="btn-brand inline-flex items-center gap-2 rounded-[11px] px-6 py-3 text-base font-semibold">
            Till startsidan
          </Link>
          <Link href="/losningar" className="inline-flex items-center rounded-[11px] border border-[var(--line-strong)] bg-[var(--surface)] px-6 py-3 text-base font-semibold transition-colors hover:bg-white">
            Se lösningar
          </Link>
        </div>
      </main>
      <MarketingFooter />
    </div>
  )
}
