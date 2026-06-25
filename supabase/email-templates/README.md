# Brandade autentiseringsmejl (Bundla)

Som standard skickar Supabase fula, engelska mejl från `noreply@mail.app.supabase.io`
med texten "powered by Supabase". Det vill vi inte. Här är färdiga svenska,
Bundla-brandade mallar och två steg för att fixa det.

## Steg 1 — Byt ut mejlmallarna (2 min, gratis)

I Supabase: **Authentication → Emails** (Email Templates).

För varje mall: klistra in HTML:en, sätt ämnesraden, spara.

| Mall i Supabase | Fil | Föreslagen ämnesrad |
| --- | --- | --- |
| Invite user | `invite.html` | Du har blivit inbjuden till Bundla |
| Magic Link | `magic-link.html` | Din inloggningslänk till Bundla |

Mallarna använder Supabase-variabeln `{{ .ConfirmationURL }}`, så länkarna
fortsätter fungera precis som idag. Det här tar bort "powered by Supabase" och
gör allt svenskt och brandat.

> Om du även använder "Confirm signup" eller "Change Email" kan samma stil
> återanvändas — kopiera `magic-link.html` och byt rubrik/brödtext.

## Steg 2 — Byt avsändaradress (tar bort `@mail.app.supabase.io`)

Mallbytet ovan gör mejlet snyggt, men avsändaren är fortfarande Supabase. För att
mejlen ska komma från t.ex. `noreply@bundla.se` behövs egen SMTP:

1. Skapa konto hos en mejlleverantör med gratisnivå, t.ex. **Resend** (rekommenderas)
   eller Postmark/Brevo.
2. Verifiera en avsändardomän (kräver en domän, t.ex. `bundla.se`, och några
   DNS-poster). Utan egen domän går det inte att fullt ut dölja avsändaren.
3. I Supabase: **Project Settings → Authentication → SMTP Settings** → fyll i
   leverantörens host/port/användare/lösenord och sätt avsändare till
   `Bundla <noreply@bundla.se>`.

Effekt: alla auth-mejl kommer från din egen domän, ser professionella ut och
hamnar mer sällan i skräpposten. Detta är också ett krav innan ni skalar (den
inbyggda Supabase-tjänsten är hårt rate-limitad).

> Sidonot: en egen domän (bundla.se) är ändå värd att skaffa inför lansering —
> bättre för varumärke och SEO. Då pekar vi även `NEXT_PUBLIC_SITE_URL` dit.
