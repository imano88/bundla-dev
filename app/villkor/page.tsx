import Link from "next/link"
import { COMPANY_NAME, COMPANY_ORG_NR, CONTACT_EMAIL } from "@/lib/site"

export const metadata = {
  title: "Användarvillkor",
  description: "Användarvillkor för Bundla, tjänsten för automatiska bundle-bilder till e-handel.",
  alternates: { canonical: "/villkor" },
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 font-display text-lg font-semibold text-ink">{title}</h2>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  )
}

export default function VillkorPage() {
  return (
    <main className="min-h-screen bg-[var(--paper)] text-ink">
      <div className="mx-auto max-w-[760px] px-6 py-14 sm:px-10">
        <Link href="/" className="font-mono text-xs uppercase tracking-[0.12em] text-ink-ghost hover:text-ink">
          ← Bundla
        </Link>
        <h1 className="mt-6 font-display text-[34px] font-bold tracking-[-0.03em]">Användarvillkor</h1>
        <p className="mt-2 text-sm text-ink-muted">Senast uppdaterad: 2026-06-26</p>

        <div className="mt-8 flex flex-col gap-6 text-[15px] leading-relaxed text-ink-body">
          <p>
            Dessa villkor gäller när du använder Bundla, en tjänst som tillhandahålls av {COMPANY_NAME}{" "}
            (org.nr {COMPANY_ORG_NR}). Genom att använda tjänsten godkänner du villkoren.
          </p>

          <Section title="Tjänsten">
            <p>
              Bundla låter dig ladda upp produktbilder, frilägga dem automatiskt och sätta ihop dem till
              en färdig paketbild för e-handel. Vi utvecklar tjänsten löpande och funktioner kan komma
              att läggas till, ändras eller tas bort.
            </p>
          </Section>

          <Section title="Konto och åtkomst">
            <p>
              Åtkomst till Bundla kräver ett konto. Du ansvarar för att hålla dina inloggningsuppgifter
              skyddade och för all aktivitet som sker via ditt konto. Konton är personliga och får inte
              delas. En administratör i din organisation kan bjuda in och ta bort användare.
            </p>
          </Section>

          <Section title="Ditt innehåll och dina rättigheter">
            <p>
              Du behåller alla rättigheter till de bilder du laddar upp och till de bundle-bilder du
              skapar, och får använda de exporterade bilderna fritt, även kommersiellt. Du ansvarar för
              att du har rätt att använda de bilder du laddar upp och att de inte gör intrång i tredje
              parts rättigheter eller bryter mot lag.
            </p>
          </Section>

          <Section title="Tillåten användning">
            <p>
              Du får inte använda tjänsten för olagligt innehåll, försöka kringgå kvoter eller
              åtkomstkontroller, störa driften eller ladda upp skadlig kod. Vi får stänga av konton som
              bryter mot villkoren.
            </p>
          </Section>

          <Section title="Immateriella rättigheter">
            <p>
              {COMPANY_NAME} äger alla rättigheter till Bundla som tjänst, inklusive varumärke,
              programkod och design. Inget i dessa villkor överför några rättigheter till tjänsten i sig
              till dig.
            </p>
          </Section>

          <Section title="Abonnemang och kvot">
            <p>
              Tillgång till tjänsten kan vara förenad med ett abonnemang och en månadskvot av antal
              bilder, enligt vad som avtalats med din organisation. Kvoten delas av organisationens
              användare och återställs varje månad.
            </p>
          </Section>

          <Section title="Tillgänglighet">
            <p>
              Vi strävar efter hög tillgänglighet men kan inte garantera att tjänsten alltid är
              oavbruten eller felfri. Underhåll, uppdateringar eller omständigheter utanför vår kontroll
              kan tillfälligt påverka tillgängligheten.
            </p>
          </Section>

          <Section title="Ansvarsbegränsning">
            <p>
              Tjänsten tillhandahålls i befintligt skick. I den utsträckning lagen tillåter ansvarar vi
              inte för indirekta skador, utebliven vinst eller förlust av data till följd av
              användningen av tjänsten.
            </p>
          </Section>

          <Section title="Ändringar av villkoren">
            <p>
              Vi kan komma att uppdatera dessa villkor. Den senaste versionen finns alltid på den här
              sidan. Väsentliga ändringar meddelas i rimlig tid.
            </p>
          </Section>

          <Section title="Uppsägning">
            <p>
              Du kan när som helst sluta använda tjänsten. Vi kan avsluta eller begränsa åtkomst om
              villkoren bryts eller om ett avtal upphör.
            </p>
          </Section>

          <Section title="Tillämplig lag">
            <p>Svensk lag tillämpas på dessa villkor. Tvist prövas av svensk allmän domstol.</p>
          </Section>

          <Section title="Kontakt">
            <p>
              {COMPANY_NAME} · org.nr {COMPANY_ORG_NR}
              <br />
              <a className="underline hover:text-ink" href={`mailto:${CONTACT_EMAIL}`}>
                {CONTACT_EMAIL}
              </a>
            </p>
          </Section>
        </div>
      </div>
    </main>
  )
}
