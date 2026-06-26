import Link from "next/link"
import { COMPANY_NAME, COMPANY_ORG_NR, CONTACT_EMAIL } from "@/lib/site"

export const metadata = {
  title: "Integritetspolicy",
  description: "Så behandlar Bundla och Markable AB personuppgifter och bilder enligt GDPR.",
  alternates: { canonical: "/integritetspolicy" },
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 font-display text-lg font-semibold text-ink">{title}</h2>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  )
}

export default function IntegritetspolicyPage() {
  return (
    <main className="min-h-screen bg-[var(--paper)] text-ink">
      <div className="mx-auto max-w-[760px] px-6 py-14 sm:px-10">
        <Link href="/" className="font-mono text-xs uppercase tracking-[0.12em] text-ink-ghost hover:text-ink">
          ← Bundla
        </Link>
        <h1 className="mt-6 font-display text-[34px] font-bold tracking-[-0.03em]">Integritetspolicy</h1>
        <p className="mt-2 text-sm text-ink-muted">Senast uppdaterad: 2026-06-26</p>

        <div className="mt-8 flex flex-col gap-6 text-[15px] leading-relaxed text-ink-body">
          <p>
            Denna integritetspolicy beskriver hur {COMPANY_NAME} behandlar personuppgifter när du
            använder Bundla. Vi behandlar dina uppgifter i enlighet med dataskyddsförordningen (GDPR).
          </p>

          <Section title="Personuppgiftsansvarig">
            <p>
              {COMPANY_NAME} (org.nr {COMPANY_ORG_NR}) är personuppgiftsansvarig för behandlingen av
              personuppgifter i Bundla. Kontakta oss på{" "}
              <a className="underline hover:text-ink" href={`mailto:${CONTACT_EMAIL}`}>
                {CONTACT_EMAIL}
              </a>{" "}
              om du har frågor om hur vi hanterar dina uppgifter.
            </p>
          </Section>

          <Section title="Vilka uppgifter vi behandlar">
            <ul className="flex list-disc flex-col gap-1.5 pl-5">
              <li>
                <strong>Kontouppgifter:</strong> e-postadress, eventuellt namn, organisationstillhörighet
                och roll (administratör eller medlem).
              </li>
              <li>
                <strong>Användningsuppgifter:</strong> statistik om din användning, till exempel antal
                skapade bundles och tidpunkt, för att räkna av kvot och driva tjänsten.
              </li>
              <li>
                <strong>Bilder du laddar upp:</strong> de produktbilder du laddar upp behandlas för att
                skapa den färdiga bundle-bilden.
              </li>
              <li>
                <strong>Teknisk data:</strong> nödvändiga cookies för inloggning samt aggregerad,
                anonymiserad besöksstatistik.
              </li>
            </ul>
          </Section>

          <Section title="Ändamål och laglig grund">
            <ul className="flex list-disc flex-col gap-1.5 pl-5">
              <li>
                <strong>Tillhandahålla tjänsten</strong> (skapa konto, frilägga och sätta ihop bilder,
                räkna av kvot). Laglig grund: fullgörande av avtal.
              </li>
              <li>
                <strong>Drift, säkerhet och förbättring</strong> av tjänsten. Laglig grund: berättigat
                intresse.
              </li>
              <li>
                <strong>Bokföring och fakturering</strong> av företagskunder. Laglig grund: rättslig
                förpliktelse.
              </li>
            </ul>
          </Section>

          <Section title="Uppladdade bilder">
            <p>
              Produktbilder du laddar upp behandlas enbart för att leverera tjänsten, det vill säga för
              att frilägga produkterna och skapa paketbilden. Bilderna sparas inte längre än vad som
              behövs för att utföra och leverera bearbetningen, och används aldrig för att träna modeller
              eller för marknadsföring.
            </p>
          </Section>

          <Section title="Lagringstid">
            <p>
              Kontouppgifter behandlas så länge ditt konto är aktivt. När ett konto avslutas raderas eller
              anonymiseras uppgifterna, med undantag för sådant vi enligt lag måste spara, till exempel
              bokföringsunderlag som sparas i upp till sju år enligt bokföringslagen.
            </p>
          </Section>

          <Section title="Underbiträden och mottagare">
            <p>För att kunna leverera tjänsten anlitar vi följande personuppgiftsbiträden:</p>
            <ul className="flex list-disc flex-col gap-1.5 pl-5">
              <li>Leverantör av hosting och drift.</li>
              <li>Leverantör av autentisering och databas, med datalagring inom EU/EES.</li>
              <li>Extern bildbehandlingstjänst för automatisk friläggning.</li>
            </ul>
            <p>
              Vi säljer aldrig dina personuppgifter och delar dem inte med tredje part för deras egna
              ändamål.
            </p>
          </Section>

          <Section title="Överföring till tredjeland">
            <p>
              Vi strävar efter att behandla personuppgifter inom EU/EES. Om en leverantör behandlar
              uppgifter utanför EU/EES sker det med lämpliga skyddsåtgärder, till exempel EU-kommissionens
              standardavtalsklausuler.
            </p>
          </Section>

          <Section title="Dina rättigheter">
            <p>
              Du har rätt att begära tillgång till, rättelse eller radering av dina personuppgifter,
              samt rätt att begära begränsning av eller invända mot behandlingen och att få ut dina
              uppgifter (dataportabilitet). Kontakta oss så hjälper vi dig.
            </p>
            <p>
              Om du anser att vi behandlar dina uppgifter felaktigt har du rätt att lämna klagomål till
              Integritetsskyddsmyndigheten (IMY), som är tillsynsmyndighet i Sverige.
            </p>
          </Section>

          <Section title="Cookies">
            <p>
              Bundla använder nödvändiga cookies för att hålla dig inloggad och för att tjänsten ska
              fungera. Vi använder även aggregerad, anonymiserad besöksstatistik för att förstå hur
              sidan används.
            </p>
          </Section>

          <Section title="Ändringar i policyn">
            <p>
              Vi kan komma att uppdatera denna policy. Den senaste versionen finns alltid på den här
              sidan, med datum för senaste uppdatering högst upp.
            </p>
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
