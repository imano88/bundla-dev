import Link from "next/link"

export const metadata = {
  title: "Användarvillkor",
  description: "Användarvillkor för Bundla, verktyget för automatiska bundle-bilder till e-handel.",
  alternates: { canonical: "/villkor" },
}

export default function VillkorPage() {
  return (
    <main className="min-h-screen bg-[var(--paper)] text-ink">
      <div className="mx-auto max-w-[760px] px-6 py-14 sm:px-10">
        <Link href="/" className="font-mono text-xs uppercase tracking-[0.12em] text-ink-ghost hover:text-ink">
          ← Bundla
        </Link>
        <h1 className="mt-6 font-display text-[34px] font-bold tracking-[-0.03em]">Användarvillkor</h1>
        <p className="mt-2 text-sm text-ink-muted">Senast uppdaterad: 2026-06-25</p>

        <div className="mt-8 flex flex-col gap-6 text-[15px] leading-relaxed text-ink-body">
          <p>
            Bundla är ett verktyg för att skapa produktbilder för e-handel. Genom att använda tjänsten
            godkänner du dessa villkor. Detta är ett utkast som bör granskas juridiskt innan publik lansering.
          </p>
          <section>
            <h2 className="mb-2 font-display text-lg font-semibold text-ink">Tjänsten</h2>
            <p>
              Bundla låter dig ladda upp produktbilder, friställa dem och sätta ihop dem till en
              paketbild. Tillgänglighet och funktioner kan ändras över tid.
            </p>
          </section>
          <section>
            <h2 className="mb-2 font-display text-lg font-semibold text-ink">Ditt ansvar</h2>
            <p>
              Du ansvarar för att du har rätt att använda de bilder du laddar upp, och för att
              innehållet inte gör intrång i tredje parts rättigheter eller bryter mot lag.
            </p>
          </section>
          <section>
            <h2 className="mb-2 font-display text-lg font-semibold text-ink">Konton & åtkomst</h2>
            <p>
              Åtkomst till Studion är begränsad. Du ansvarar för att hålla dina inloggningsuppgifter
              skyddade och för aktivitet som sker via ditt konto.
            </p>
          </section>
          <section>
            <h2 className="mb-2 font-display text-lg font-semibold text-ink">Ansvarsbegränsning</h2>
            <p>
              Tjänsten tillhandahålls i befintligt skick. Vi ansvarar inte för indirekta skador eller
              utebliven vinst till följd av användningen.
            </p>
          </section>
          <section>
            <h2 className="mb-2 font-display text-lg font-semibold text-ink">Kontakt</h2>
            <p>
              Frågor? Kontakta{" "}
              <a className="underline hover:text-ink" href="mailto:jakob.radback@markable.se">
                jakob.radback@markable.se
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
