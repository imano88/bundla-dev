import Link from "next/link"

export const metadata = { title: "Integritetspolicy" }

export default function IntegritetspolicyPage() {
  return (
    <main className="min-h-screen bg-[var(--paper)] text-ink">
      <div className="mx-auto max-w-[760px] px-6 py-14 sm:px-10">
        <Link href="/" className="font-mono text-xs uppercase tracking-[0.12em] text-ink-ghost hover:text-ink">
          ← Bundla
        </Link>
        <h1 className="mt-6 font-display text-[34px] font-bold tracking-[-0.03em]">Integritetspolicy</h1>
        <p className="mt-2 text-sm text-ink-muted">Senast uppdaterad: 2026-06-25</p>

        <div className="mt-8 flex flex-col gap-6 text-[15px] leading-relaxed text-ink-body">
          <p>
            Den här policyn beskriver hur Bundla behandlar uppgifter. Detta är ett utkast som bör
            granskas juridiskt (t.ex. personuppgiftsbiträdesavtal med företagskunder) innan publik lansering.
          </p>
          <section>
            <h2 className="mb-2 font-display text-lg font-semibold text-ink">Vad vi behandlar</h2>
            <p>
              För inloggade användare lagrar vi e-postadress, organisationstillhörighet och
              användningsstatistik (antal skapade bundles). Uppladdade produktbilder behandlas för att
              skapa paketbilden och sparas inte längre än nödvändigt för att leverera tjänsten.
            </p>
          </section>
          <section>
            <h2 className="mb-2 font-display text-lg font-semibold text-ink">Underbiträden</h2>
            <p>För att driva tjänsten anlitar vi:</p>
            <ul className="mt-2 list-disc pl-5">
              <li>Vercel (hosting)</li>
              <li>Supabase (autentisering och databas, EU-region)</li>
              <li>Extern bildbehandlingstjänst för automatisk friläggning</li>
            </ul>
          </section>
          <section>
            <h2 className="mb-2 font-display text-lg font-semibold text-ink">Dina rättigheter</h2>
            <p>
              Du har rätt att begära utdrag, rättelse och radering av dina uppgifter enligt GDPR.
              Kontakta oss så hjälper vi dig.
            </p>
          </section>
          <section>
            <h2 className="mb-2 font-display text-lg font-semibold text-ink">Kontakt</h2>
            <p>
              <a className="underline hover:text-ink" href="mailto:jakob.radback@markable.se">
                jakob.radback@markable.se
              </a>
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
