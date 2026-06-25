import Link from "next/link"

export const metadata = {
  title: "Hjälp",
  description: "Kom igång med Bundla: dra in två produktbilder, frilägg automatiskt och exportera en färdig bundle-bild.",
  alternates: { canonical: "/docs" },
}

const STEPS = [
  ["Dra in två bilder", "Släpp en produktbild i vardera rutan under Källbilder. PNG, WebP eller JPG, upp till 20 MB per bild."],
  ["Frilägg & skapa bundle", "Klicka på knappen i Inställningar. Bundla klipper ut båda produkterna och slår ihop dem till en bundle."],
  ["Justera", "Slå på/av plustecknet, välj bakgrund (transparent eller färg) och finjustera inre marginal och mellanrum."],
  ["Exportera", "Klicka Exportera PNG uppe till höger för att ladda ner en färdig 1000×1000-bild."],
]

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-[var(--paper)] text-ink">
      <div className="mx-auto max-w-[760px] px-6 py-14 sm:px-10">
        <Link href="/" className="font-mono text-xs uppercase tracking-[0.12em] text-ink-ghost hover:text-ink">
          ← Bundla
        </Link>
        <h1 className="mt-6 font-display text-[34px] font-bold tracking-[-0.03em]">Så använder du Bundla</h1>
        <p className="mt-2 text-[15px] text-ink-body">Från två produktbilder till en färdig paketbild på några sekunder.</p>

        <div className="mt-8 flex flex-col gap-6">
          {STEPS.map(([title, body], i) => (
            <div key={title} className="flex gap-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--tint-orange)] font-display text-sm font-bold text-[var(--bundla-orange-deep)]">
                {i + 1}
              </span>
              <div>
                <h2 className="font-display text-lg font-semibold tracking-[-0.02em]">{title}</h2>
                <p className="mt-1 text-[15px] leading-relaxed text-ink-body">{body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <Link href="/studio" className="btn-brand inline-flex rounded-[11px] px-5 py-3 text-sm font-semibold">
            Öppna Studio →
          </Link>
        </div>
      </div>
    </main>
  )
}
