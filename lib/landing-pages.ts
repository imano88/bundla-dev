// Keyword-targeted marketing/solution pages, rendered by
// app/losningar/[slug]/page.tsx. Each is a distinct search intent to avoid
// keyword cannibalisation. Copy is factual and never names any third-party API.
import type { FaqItem } from "@/lib/faq"

export type Solution = {
  slug: string
  eyebrow: string
  h1: string
  metaTitle: string
  metaDescription: string
  intro: string[]
  benefitsTitle: string
  benefits: { title: string; body: string }[]
  steps: { title: string; body: string }[]
  faq: FaqItem[]
  ctaTitle: string
  ctaText: string
}

const SHARED_STEPS = [
  { title: "Dra in två bilder", body: "Släpp en produktbild i vardera rutan. PNG, WebP eller JPG, upp till 20 MB per bild." },
  { title: "Friläggs automatiskt", body: "Bakgrunden tas bort och produkterna placeras med jämn marginal och mellanrum." },
  { title: "Exportera färdig PNG", body: "Ladda ner en transparent eller färgsatt bundle-bild i 1000×1000, redo för butiken." },
]

export const SOLUTIONS: Solution[] = [
  {
    slug: "ta-bort-bakgrund-produktbilder",
    eyebrow: "Friläggning",
    h1: "Ta bort bakgrunden på produktbilder automatiskt",
    metaTitle: "Ta bort bakgrund på produktbilder automatiskt",
    metaDescription:
      "Frilägg produktbilder automatiskt och få en ren, transparent bakgrund. Ingen Photoshop, inga lager. Klart på sekunder med Bundla.",
    intro: [
      "Att klippa ut produkter för hand i Photoshop tar tid och kräver vana. Bundla frilägger dina produktbilder automatiskt och ger dig en ren, transparent bakgrund på sekunder.",
      "Ladda upp bilden, låt Bundla ta bort bakgrunden och exportera en färdig PNG som kan läggas upp direkt i webbutiken.",
    ],
    benefitsTitle: "Därför frilägger e-handlare med Bundla",
    benefits: [
      { title: "Jämn kvalitet", body: "Samma rena kant på varje bild, oavsett vem i teamet som gör jobbet." },
      { title: "Inga verktyg", body: "Du behöver varken Photoshop, plugins eller designkunskap." },
      { title: "Snabbt", body: "Friläggning på sekunder istället för minuter per bild." },
    ],
    steps: SHARED_STEPS,
    faq: [
      { q: "Behöver bilden vara förbehandlad?", a: "Nej. Ladda upp din vanliga produktbild i PNG, WebP eller JPG, så sköter Bundla friläggningen." },
      { q: "Får jag transparent bakgrund?", a: "Ja, du kan exportera med transparent bakgrund eller välja en färgad bakgrund." },
    ],
    ctaTitle: "Frilägg dina produktbilder idag",
    ctaText: "Prova Bundla och se kvaliteten på dina egna bilder.",
  },
  {
    slug: "paketbilder-ehandel",
    eyebrow: "Paketbilder",
    h1: "Paketbilder för e-handel på sekunder",
    metaTitle: "Paketbilder för e-handel",
    metaDescription:
      "Skapa snygga paketbilder (bundles) för e-handel automatiskt. Slå ihop två produktbilder till en färdig bundle-bild med Bundla.",
    intro: [
      "Paketerbjudanden säljer bättre med en tydlig bild. Bundla slår ihop två produktbilder till en proffsig paketbild med jämn placering och ett tydligt plustecken emellan.",
      "Perfekt för kampanjer, mängdrabatter och tillbehörspaket i webbutiken.",
    ],
    benefitsTitle: "Bättre paketbilder, mindre jobb",
    benefits: [
      { title: "Konsekvent layout", body: "Produkterna placeras alltid jämnt, med samma marginal och mellanrum." },
      { title: "Färdig för butiken", body: "Exporten är 1000×1000 PNG, anpassad för produktytor i e-handel." },
      { title: "Skala upp", body: "Hela teamet kan skapa paketbilder från samma konto och kvot." },
    ],
    steps: SHARED_STEPS,
    faq: [
      { q: "Kan jag styra mellanrummet mellan produkterna?", a: "Ja, du justerar marginal och mellanrum, och kan slå på eller av plustecknet." },
      { q: "Vilken storlek får paketbilden?", a: "Den exporteras som en 1000×1000 pixlar PNG." },
    ],
    ctaTitle: "Skapa din första paketbild",
    ctaText: "Slå ihop två produkter till en färdig bundle på sekunder.",
  },
  {
    slug: "produktbilder-utan-photoshop",
    eyebrow: "Enkelt",
    h1: "Snygga produktbilder utan Photoshop",
    metaTitle: "Produktbilder utan Photoshop",
    metaDescription:
      "Skapa professionella produkt- och paketbilder utan Photoshop eller designkunskap. Dra in, frilägg och exportera med Bundla.",
    intro: [
      "Alla i teamet ska kunna skapa snygga produktbilder, inte bara den som kan Photoshop. Bundla gör friläggning och layout automatiskt, direkt i webbläsaren.",
      "Inga lager, inga maskar, inga plugins. Dra in dina bilder och exportera en färdig bild.",
    ],
    benefitsTitle: "Gjort för team utan designavdelning",
    benefits: [
      { title: "Ingen inlärning", body: "Om du kan dra och släppa en fil kan du använda Bundla." },
      { title: "Webbaserat", body: "Inget att installera. Logga in och kör, på vilken dator som helst." },
      { title: "Proffsigt resultat", body: "Rena kanter och jämn layout varje gång." },
    ],
    steps: SHARED_STEPS,
    faq: [
      { q: "Måste jag installera något?", a: "Nej, Bundla körs helt i webbläsaren." },
      { q: "Behöver jag designkunskap?", a: "Nej. Friläggning och layout sköts automatiskt." },
    ],
    ctaTitle: "Skapa produktbilder utan krångel",
    ctaText: "Prova Bundla, ingen Photoshop behövs.",
  },
  {
    slug: "bundle-bilder-for-byraer",
    eyebrow: "För byråer",
    h1: "Bundle-bilder för byråer och flera kunder",
    metaTitle: "Bundle-bilder för byråer",
    metaDescription:
      "Producera bundle- och paketbilder åt flera e-handelskunder från ett konto, med gemensam kvot och flera användare. Bundla för byråer.",
    intro: [
      "Producerar du produktbilder åt flera e-handelskunder? Bundla låter hela byrån skapa bundle-bilder från ett konto, med en gemensam månadskvot och flera inloggningar.",
      "Leverera jämn, varumärkessäker kvalitet till varje kund, utan manuellt klippande.",
    ],
    benefitsTitle: "Byggt för produktion i skala",
    benefits: [
      { title: "Flera användare", body: "Bjud in kollegor och dela en gemensam månadskvot." },
      { title: "Jämn leverans", body: "Samma kvalitet och format oavsett vem som producerar." },
      { title: "Snabb genomströmning", body: "Friläggning och layout på sekunder per bild." },
    ],
    steps: SHARED_STEPS,
    faq: [
      { q: "Kan flera personer dela samma konto?", a: "Ja. Varje organisation har en gemensam kvot som delas av alla inbjudna användare." },
      { q: "Hur lägger vi till kollegor?", a: "En administratör bjuder in dem via e-post, och de kopplas direkt till organisationen." },
    ],
    ctaTitle: "Sätt upp byråns konto",
    ctaText: "Hör av dig så ordnar vi kvot och inloggningar åt teamet.",
  },
]

export function getSolution(slug: string): Solution | undefined {
  return SOLUTIONS.find((s) => s.slug === slug)
}
