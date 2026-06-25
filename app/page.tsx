import type { Metadata } from "next"
import { LandingPage } from "@/components/landing-page"
import { JsonLd } from "@/components/json-ld"
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, SITE_TAGLINE } from "@/lib/site"

export const metadata: Metadata = {
  alternates: { canonical: "/" },
}

const organization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/icon.svg`,
  description: SITE_DESCRIPTION,
}

const website = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  inLanguage: "sv-SE",
}

const software = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: SITE_NAME,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  inLanguage: "sv-SE",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "SEK",
    description: "Prova Bundla. Kontakta oss för abonnemang.",
  },
  featureList: [
    "Automatisk friläggning av produktbilder",
    "Sammanslagning av två bilder till en bundle",
    "Export som transparent PNG",
    "Justerbar bakgrund och marginal",
  ],
  slogan: SITE_TAGLINE,
}

export default function Page() {
  return (
    <>
      <JsonLd data={[organization, website, software]} />
      <LandingPage />
    </>
  )
}
