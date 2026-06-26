// Shared FAQ content. Rendered on the landing page and emitted as FAQPage
// structured data (JSON-LD) for answer engines (AEO).
export type FaqItem = { q: string; a: string }

export const FAQ: FaqItem[] = [
  {
    q: "Vad är Bundla?",
    a: "Bundla är ett webbverktyg som frilägger två produktbilder automatiskt och slår ihop dem till en färdig bundle-bild för e-handel. Du behöver varken Photoshop eller designkunskap.",
  },
  {
    q: "Vilka filformat och storlekar fungerar?",
    a: "Du kan ladda upp PNG, WebP och JPG, upp till 20 MB per bild. Bilderna behöver inte vara frilagda i förväg, det sköter Bundla.",
  },
  {
    q: "Vilken upplösning får den färdiga bilden?",
    a: "Du väljer format: Standard (2000×1700), Kvadrat (1000×1000) eller en egen storlek. Bilden exporteras som PNG, redo för webbutiken.",
  },
  {
    q: "Kan jag välja bakgrund?",
    a: "Ja. Du kan exportera med transparent bakgrund eller välja en färgad bakgrund, och justera marginal och mellanrum mellan produkterna.",
  },
  {
    q: "Behöver jag installera något?",
    a: "Nej. Bundla körs helt i webbläsaren. Du loggar in, drar in dina bilder och exporterar resultatet.",
  },
  {
    q: "Vad kostar Bundla?",
    a: "Företag får ett skräddarsytt konto med en månadskvot av bilder, flera användare och support. Hör av dig så sätter vi upp ett konto åt er.",
  },
  {
    q: "Hur många bilder kan vårt team skapa?",
    a: "Varje organisation har en gemensam månadskvot som delas av alla inloggade användare. Kvoten anpassas efter ert behov.",
  },
]
