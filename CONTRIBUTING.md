# Så jobbar vi i Bundla

Kort workflow för att slippa krockar när flera pushar.

## Grundregel
**`main` är deploy-grenen (Vercel produktion). Pusha aldrig direkt till `main`.**
Allt går via egna grenar + Pull Request.

## Flöde
1. Synka först:
   ```bash
   git checkout main
   git pull origin main
   ```
2. Skapa en gren för din uppgift:
   ```bash
   git checkout -b iman/landningssida   # eller jakob/..., claude/...
   ```
3. Jobba, committa ofta med tydliga meddelanden.
4. Innan du pushar, hämta senaste och rebasa:
   ```bash
   git pull --rebase origin main
   ```
5. Pusha din gren och öppna en **Pull Request** mot `main` på GitHub.
6. Merge:a PR:en (gärna efter en snabb titt av den andra). Då deployar Vercel produktion.

## Tips för att undvika konflikter
- **Dela upp arbetet** så ni inte redigerar samma filer samtidigt
  (t.ex. en på landningssidan, en på studion).
- Små, ofta-PR:ar är lättare att merge:a än stora.
- Varje gren/PR får en **egen preview-deploy** i Vercel. Testa där innan merge.

## Lokal körning
```bash
pnpm install
cp .env.example .env.local   # fyll i nycklarna (dela säkert, committa aldrig)
pnpm dev
```

## Hemligheter
Nycklar ligger i Vercel/Supabase, aldrig i repot. `.env.local` är gitignorerad.
