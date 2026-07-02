import Link from "next/link"
import { FAQ } from "@/lib/faq"
import { SOLUTIONS } from "@/lib/landing-pages"
import { MobileMenu } from "@/components/mobile-menu"
import { MarketingFooter } from "@/components/marketing-chrome"
import { AnimatedLogoMark } from "@/components/animated-logo"
import { ScrollRevealScript } from "@/components/scroll-reveal"
import { BackToTop } from "@/components/back-to-top"

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 inline-flex items-center gap-3">
      <span className="h-0.5 w-[30px] bg-[var(--bundla-orange)]" />
      <span className="font-mono text-[12px] uppercase tracking-[0.14em] text-[var(--bundla-orange-deep)]">
        {children}
      </span>
    </div>
  )
}


export function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--paper)] text-ink">
      {/* Nav */}
      <div className="sticky top-0 z-50 border-b border-[var(--line-soft)] bg-[#f4f0e9]/90 backdrop-blur-md">
      <header className="mx-auto flex max-w-[1200px] items-center px-6 py-5 sm:px-10">
        <div className="flex flex-1">
          <Link href="/" className="group flex items-center gap-2.5">
            <AnimatedLogoMark size={34} />
            <span className="font-display text-[23px] font-bold tracking-[-0.02em]">Bundla</span>
          </Link>
        </div>
        <nav aria-label="Primär navigering" className="hidden items-center gap-8 text-[15px] font-medium text-ink-body md:flex">
          <Link href="/losningar" className="transition-colors hover:text-ink">Lösningar</Link>
          <a href="#priser" className="transition-colors hover:text-ink">Priser</a>
          <a href="#faq" className="transition-colors hover:text-ink">FAQ</a>
        </nav>
        <div className="hidden flex-1 items-center justify-end gap-4 md:flex">
          <Link href="/login" className="text-[15px] font-semibold text-ink-body transition-colors hover:text-ink">
            Logga in
          </Link>
          <Link
            href="/studio"
            className="btn-brand inline-flex items-center gap-2 rounded-[11px] px-5 py-2.5 text-[15px] font-semibold"
          >
            Skapa en bundle →
          </Link>
        </div>
        <MobileMenu />
      </header>
      </div>

      {/* Hero */}
      <section className="mx-auto max-w-[1200px] px-6 pb-6 pt-10 sm:px-10">
        <div className="text-center">
          <div className="mb-5 flex items-center justify-center gap-3 animate-rise">
            <span className="h-px w-7 bg-[var(--bundla-orange)]" />
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--bundla-orange-deep)]">
              Byggd för e-handel
            </span>
            <span className="h-px w-7 bg-[var(--bundla-orange)]" />
          </div>
          <h1
            className="font-display font-semibold leading-[1.0] tracking-[-0.04em] animate-rise"
            style={{ fontSize: "clamp(52px, 8.5vw, 108px)", animationDelay: '80ms' }}
          >
            Två bilder.
            <br />
            En{" "}
            <span
              style={{
                background: "var(--gradient-brand)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              bundle
            </span>
            .
          </h1>
          <p className="mx-auto mt-6 max-w-[480px] text-[17px] leading-relaxed text-ink-body sm:text-[19px] animate-rise" style={{ animationDelay: '160ms' }}>
            Bundla frilägger, sätter ihop och exporterar. Butiksklar PNG under 1 minut — utan Photoshop, utan byrå.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-3.5 animate-rise" style={{ animationDelay: '240ms' }}>
            <Link
              href="/studio"
              className="btn-brand inline-flex w-full items-center justify-center gap-2 rounded-[11px] px-6 py-3.5 text-base font-semibold sm:w-auto"
            >
              Skapa en bundle →
            </Link>
            <a
              href="#priser"
              className="inline-flex w-full items-center justify-center gap-2 rounded-[11px] border border-[var(--line-strong)] bg-[var(--surface)] px-5 py-3.5 text-base font-semibold text-ink transition-colors hover:bg-white sm:w-auto"
            >
              Se priser
            </a>
          </div>
        </div>

        {/* Steg-kort */}
        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {/* Steg 1: Two product photos */}
          <div className="rounded-[20px] border border-[var(--line-soft)] bg-white p-6 shadow-[var(--shadow-card)] transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-pop)]">
            <div className="mb-5 flex h-[120px] items-center justify-center overflow-hidden">
              <svg width="220" height="110" viewBox="0 0 220 110" fill="none" aria-hidden="true">
                {/* Card 1: warm rose bg, tall package */}
                <rect x="6" y="6" width="80" height="96" rx="12" fill="#EDDBCC" stroke="#D8C4B2" strokeWidth="1.5"/>
                <rect x="27" y="14" width="38" height="80" rx="10" fill="#C0A08A"/>
                <rect x="27" y="58" width="38" height="26" rx="0" fill="white" fillOpacity="0.18"/>
                <rect x="31" y="65" width="30" height="2.5" rx="1.25" fill="white" fillOpacity="0.55"/>
                <rect x="34" y="71" width="22" height="2" rx="1" fill="white" fillOpacity="0.4"/>
                <rect x="31" y="18" width="7" height="48" rx="3.5" fill="white" fillOpacity="0.28"/>
                {/* Plus connector — drawn after card 1 so it renders on top */}
                <circle cx="110" cy="54" r="13" fill="#FFF0E8" stroke="#FFD0A0" strokeWidth="1.5"/>
                <line x1="110" y1="48" x2="110" y2="60" stroke="#FF6A00" strokeWidth="2.5" strokeLinecap="round"/>
                <line x1="104" y1="54" x2="116" y2="54" stroke="#FF6A00" strokeWidth="2.5" strokeLinecap="round"/>
                {/* Card 2: cool blue bg, box with lid */}
                <rect x="134" y="6" width="80" height="96" rx="12" fill="#C2D8EE" stroke="#AACADE" strokeWidth="1.5"/>
                <rect x="148" y="20" width="52" height="74" rx="10" fill="#7AACC8"/>
                <rect x="148" y="20" width="52" height="18" rx="10" fill="#5C9AB8"/>
                <rect x="152" y="60" width="44" height="24" rx="0" fill="white" fillOpacity="0.18"/>
                <rect x="156" y="67" width="36" height="2.5" rx="1.25" fill="white" fillOpacity="0.5"/>
                <rect x="159" y="73" width="26" height="2" rx="1" fill="white" fillOpacity="0.35"/>
                <rect x="152" y="24" width="7" height="46" rx="3.5" fill="white" fillOpacity="0.22"/>
              </svg>
            </div>
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--ink-ghost)]">Steg 01</p>
            <h3 className="mb-2 font-display text-[17px] font-semibold tracking-[-0.02em]">Dra in två bilder</h3>
            <p className="text-[14px] leading-relaxed text-ink-body">Släpp produktfoton rakt in i Studion. PNG, WebP eller JPG, upp till 20 MB styck.</p>
          </div>

          {/* Steg 2: Background removal — before / after */}
          <div className="rounded-[20px] border border-[var(--line-soft)] bg-white p-6 shadow-[var(--shadow-card)] transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-pop)]">
            <div className="mb-5 flex h-[120px] items-center justify-center overflow-hidden">
              <svg width="220" height="110" viewBox="0 0 220 110" fill="none" aria-hidden="true">
                <defs>
                  <pattern id="illu-s2" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
                    <rect width="4" height="4" fill="#E9EBEE"/>
                    <rect x="4" y="0" width="4" height="4" fill="#F7F8F9"/>
                    <rect x="0" y="4" width="4" height="4" fill="#F7F8F9"/>
                    <rect x="4" y="4" width="4" height="4" fill="#E9EBEE"/>
                  </pattern>
                </defs>
                {/* Left panel: both products with original backgrounds */}
                <rect x="6" y="6" width="94" height="96" rx="12" fill="#C2D8EE" stroke="#AACADE" strokeWidth="1.5"/>
                {/* Product A — tall package, warm brown (same tone as steg 1 card 1) */}
                <rect x="16" y="14" width="28" height="78" rx="8" fill="#BFA08A"/>
                <rect x="16" y="54" width="28" height="26" rx="0" fill="white" fillOpacity="0.18"/>
                <rect x="19" y="61" width="22" height="2.5" rx="1.25" fill="white" fillOpacity="0.55"/>
                <rect x="22" y="67" width="16" height="2" rx="1" fill="white" fillOpacity="0.4"/>
                <rect x="19" y="18" width="6" height="44" rx="3" fill="white" fillOpacity="0.25"/>
                {/* Product B — box with lid */}
                <rect x="52" y="18" width="40" height="70" rx="8" fill="#5A8CAA"/>
                <rect x="52" y="18" width="40" height="16" rx="8" fill="#4A7C9A"/>
                <rect x="56" y="54" width="32" height="22" rx="0" fill="white" fillOpacity="0.18"/>
                <rect x="59" y="60" width="26" height="2.5" rx="1.25" fill="white" fillOpacity="0.5"/>
                <rect x="62" y="66" width="18" height="2" rx="1" fill="white" fillOpacity="0.35"/>
                <rect x="55" y="22" width="6" height="40" rx="3" fill="white" fillOpacity="0.18"/>
                {/* Sparkle badge — on top of left panel */}
                <circle cx="110" cy="54" r="14" fill="#FF6A00"/>
                <path d="M110 47 L111.4 51.4 L116 53 L111.4 54.6 L110 59 L108.6 54.6 L104 53 L108.6 51.4 Z" fill="white" fillOpacity="0.95"/>
                {/* Right panel: same products, transparent background */}
                <rect x="130" y="6" width="84" height="96" rx="12" fill="url(#illu-s2)" stroke="#D4CBB8" strokeWidth="1.5"/>
                {/* Product A cutout */}
                <rect x="138" y="14" width="26" height="78" rx="8" fill="#EEE8DF" stroke="#D8D0C4" strokeWidth="1"/>
                <rect x="138" y="54" width="26" height="26" rx="0" fill="#F4F0E8"/>
                <rect x="141" y="61" width="20" height="2.5" rx="1.25" fill="#C8C0B4"/>
                <rect x="143" y="67" width="14" height="2" rx="1" fill="#C8C0B4" fillOpacity="0.7"/>
                <rect x="141" y="18" width="6" height="44" rx="3" fill="white" fillOpacity="0.42"/>
                {/* Product B cutout — cool blue tint to match steg 1 card 2 */}
                <rect x="168" y="18" width="36" height="70" rx="8" fill="#DDE6F0" stroke="#C4D4E4" strokeWidth="1"/>
                <rect x="168" y="18" width="36" height="16" rx="8" fill="#CCDAEB" stroke="#B4CADD" strokeWidth="1"/>
                <rect x="172" y="54" width="28" height="22" rx="0" fill="#E4EEF8"/>
                <rect x="175" y="60" width="22" height="2.5" rx="1.25" fill="#9AAEC0"/>
                <rect x="178" y="66" width="14" height="2" rx="1" fill="#9AAEC0" fillOpacity="0.7"/>
                <rect x="171" y="22" width="6" height="38" rx="3" fill="white" fillOpacity="0.4"/>
                {/* Check badge — drawn last, always on top */}
                <circle cx="208" cy="16" r="8" fill="#FF6A00"/>
                <path d="M205 16 L207.5 18.5 L211 14" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--ink-ghost)]">Steg 02</p>
            <h3 className="mb-2 font-display text-[17px] font-semibold tracking-[-0.02em]">Friläggs automatiskt</h3>
            <p className="text-[14px] leading-relaxed text-ink-body">Bundla frilägger båda bilderna automatiskt och centrerar dem med perfekt marginal.</p>
          </div>

          {/* Steg 3: Bundle export */}
          <div className="rounded-[20px] border border-[var(--line-soft)] bg-white p-6 shadow-[var(--shadow-card)] transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-pop)]">
            <div className="mb-5 flex h-[120px] items-center justify-center overflow-hidden">
              <svg width="220" height="110" viewBox="0 0 220 110" fill="none" aria-hidden="true">
                <defs>
                  <pattern id="illu-s3" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
                    <rect width="4" height="4" fill="#E9EBEE"/>
                    <rect x="4" y="0" width="4" height="4" fill="#F7F8F9"/>
                    <rect x="0" y="4" width="4" height="4" fill="#F7F8F9"/>
                    <rect x="4" y="4" width="4" height="4" fill="#E9EBEE"/>
                  </pattern>
                </defs>
                {/* Bundle canvas */}
                <rect x="6" y="6" width="178" height="96" rx="12" fill="url(#illu-s3)" stroke="#D4CBB8" strokeWidth="1.5"/>
                {/* Product A — tall package (left half) */}
                <rect x="20" y="18" width="48" height="76" rx="10" fill="#EEE8DF" stroke="#D8D0C4" strokeWidth="1"/>
                <rect x="20" y="60" width="48" height="26" rx="0" fill="#F4F0E8"/>
                <rect x="24" y="67" width="40" height="2.5" rx="1.25" fill="#C8C0B4"/>
                <rect x="28" y="73" width="30" height="2" rx="1" fill="#C8C0B4" fillOpacity="0.7"/>
                <rect x="24" y="22" width="8" height="46" rx="4" fill="white" fillOpacity="0.42"/>
                {/* Divider */}
                <line x1="92" y1="12" x2="92" y2="96" stroke="#D4CBB8" strokeWidth="1" strokeDasharray="4 3"/>
                {/* Product B — box with lid (right half), cool blue tint */}
                <rect x="104" y="14" width="62" height="80" rx="10" fill="#DDE6F0" stroke="#C4D4E4" strokeWidth="1"/>
                <rect x="104" y="14" width="62" height="14" rx="10" fill="#CCDAEB" stroke="#B4CADD" strokeWidth="1"/>
                <rect x="110" y="52" width="50" height="30" rx="0" fill="#E4EEF8"/>
                <rect x="114" y="59" width="42" height="2.5" rx="1.25" fill="#9AAEC0"/>
                <rect x="118" y="65" width="30" height="2" rx="1" fill="#9AAEC0" fillOpacity="0.7"/>
                <rect x="122" y="71" width="18" height="2" rx="1" fill="#9AAEC0" fillOpacity="0.45"/>
                <rect x="108" y="20" width="8" height="44" rx="4" fill="white" fillOpacity="0.4"/>
                {/* Download button */}
                <rect x="192" y="36" width="22" height="36" rx="9" fill="#FF6A00"/>
                <line x1="203" y1="43" x2="203" y2="57" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <path d="M198.5 53 L203 58 L207.5 53" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                {/* PNG badge — drawn last so it renders on top of products */}
                <rect x="10" y="10" width="32" height="15" rx="4" fill="white" stroke="#E8DFD0" strokeWidth="0.8" fillOpacity="0.95"/>
                <text x="26" y="21" fontFamily="monospace" fontSize="8" fill="#FF6A00" textAnchor="middle" fontWeight="700">PNG</text>
              </svg>
            </div>
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--ink-ghost)]">Steg 03</p>
            <h3 className="mb-2 font-display text-[17px] font-semibold tracking-[-0.02em]">Exportera färdig PNG</h3>
            <p className="text-[14px] leading-relaxed text-ink-body">Ladda ner en transparent eller färgsatt paketbild, redo att läggas upp direkt i butiken.</p>
          </div>
        </div>
      </section>

      {/* Platform strip */}
      <section className="mx-auto max-w-[1200px] px-6 pb-16 sm:px-10" data-reveal>
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-7">
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#b3a995]">Fungerar med</span>
          <div className="flex w-full flex-row flex-wrap items-center gap-2 sm:w-auto sm:gap-3">
            {/* Shopify */}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line-soft)] bg-white/70 px-3 py-1 text-[13px] font-medium text-[#6f675b] shadow-[var(--shadow-card)] transition-transform duration-200 hover:scale-[1.04] sm:gap-2 sm:px-4 sm:py-1.5 sm:text-[15px]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M15.337 23.979l7.216-1.561s-2.604-17.613-2.625-17.73c-.018-.116-.114-.192-.211-.192s-1.929-.136-1.929-.136-1.275-1.274-1.439-1.411c-.045-.037-.075-.057-.121-.074l-.914 21.104h.023zM11.71 11.305s-.81-.424-1.774-.424c-1.447 0-1.504.906-1.504 1.141 0 1.232 3.24 1.715 3.24 4.629 0 2.295-1.44 3.76-3.406 3.76-2.354 0-3.54-1.465-3.54-1.465l.646-2.086s1.245 1.066 2.28 1.066c.675 0 .975-.545.975-.932 0-1.619-2.654-1.694-2.654-4.359-.034-2.237 1.571-4.416 4.827-4.416 1.257 0 1.875.361 1.875.361l-.945 2.715-.02.01zM11.17.83c.136 0 .271.038.405.135-.984.465-2.064 1.639-2.508 3.992-.656.213-1.293.405-1.889.578C7.697 3.75 8.951.84 11.17.84V.83zm1.235 2.949v.135c-.754.232-1.583.484-2.394.736.466-1.777 1.333-2.645 2.085-2.971.193.501.309 1.176.309 2.1zm.539-2.234c.694.074 1.141.867 1.429 1.755-.349.114-.735.231-1.158.366v-.252c0-.752-.096-1.371-.271-1.871v.002zm2.992 1.289c-.02 0-.06.021-.078.021s-.289.075-.714.21c-.423-1.233-1.176-2.37-2.508-2.37h-.115C12.135.209 11.669 0 11.265 0 8.159 0 6.675 3.877 6.21 5.846c-1.194.365-2.063.636-2.16.674-.675.213-.694.232-.772.87-.075.462-1.83 14.063-1.83 14.063L15.009 24l.927-21.166z"/>
              </svg>
              Shopify
            </span>
            {/* WooCommerce */}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line-soft)] bg-white/70 px-3 py-1 text-[13px] font-medium text-[#6f675b] shadow-[var(--shadow-card)] transition-transform duration-200 hover:scale-[1.04] sm:gap-2 sm:px-4 sm:py-1.5 sm:text-[15px]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M2.227 4.857A2.228 2.228 0 000 7.094v7.457c0 1.236 1.001 2.237 2.237 2.237h9.253l4.229 2.355-.962-2.355h7.006c1.236 0 2.237-1 2.237-2.237V7.094c0-1.236-1-2.237-2.237-2.237zm8.08 1.311c.194.002.372.071.535.2a.769.769 0 01.304.56.851.851 0 01-.098.47c-.382.707-.696 1.894-.951 3.542-.246 1.6-.334 2.846-.275 3.739.02.245-.02.46-.118.647a.632.632 0 01-.52.353c-.255.02-.52-.098-.775-.362-.913-.933-1.639-2.326-2.169-4.18a184.085 184.085 0 00-1.413 2.825c-.578 1.11-1.069 1.678-1.481 1.708-.265.02-.49-.206-.687-.677-.5-1.286-1.04-3.768-1.619-7.448-.03-.255.02-.48.157-.657.137-.186.344-.284.618-.304.5-.04.785.196.854.706.304 2.051.638 3.788.991 5.21L5.809 8.41c.196-.373.441-.57.736-.589.431-.03.696.245.804.824.246 1.305.56 2.414.932 3.356.255-2.492.687-4.288 1.295-5.397.148-.274.363-.412.648-.431a.866.866 0 01.084-.004zm3.734 1.063c.167 0 .343.02.53.06.687.146 1.216.52 1.57 1.137.314.53.47 1.168.47 1.933 0 1.011-.254 1.933-.765 2.777-.588.981-1.354 1.472-2.305 1.472-.167 0-.344-.02-.53-.059-.697-.147-1.217-.52-1.57-1.138-.314-.54-.471-1.187-.471-1.943 0-1.01.255-1.933.765-2.767.599-.981 1.364-1.472 2.306-1.472zm6.152 0c.167 0 .343.02.53.06.696.146 1.216.52 1.57 1.137.314.53.47 1.168.47 1.933 0 1.011-.254 1.933-.765 2.777-.588.981-1.354 1.472-2.305 1.472-.167 0-.344-.02-.53-.059-.697-.147-1.217-.52-1.57-1.138-.314-.54-.471-1.187-.471-1.943 0-1.01.255-1.933.765-2.767.599-.981 1.364-1.472 2.306-1.472zm-6.107 1.645c-.307-.002-.606.201-.889.622a3.173 3.173 0 00-.52 1.168c-.05.225-.069.47-.069.716 0 .284.06.589.177.893.147.382.343.589.579.638.245.049.51-.06.795-.315.363-.323.608-.804.745-1.452.05-.225.069-.47.069-.726a2.49 2.49 0 00-.176-.893c-.148-.382-.344-.588-.58-.637a.714.714 0 00-.131-.014zm6.152 0c-.307-.002-.606.201-.889.622a3.173 3.173 0 00-.52 1.168c-.049.225-.069.47-.069.716 0 .284.06.589.177.893.147.382.344.589.579.638.245.049.51-.06.795-.315.363-.323.608-.804.745-1.452.04-.225.07-.47.07-.726a2.49 2.49 0 00-.177-.893c-.148-.382-.344-.588-.58-.637a.714.714 0 00-.131-.014Z"/>
              </svg>
              WooCommerce
            </span>
            {/* Centra */}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line-soft)] bg-white/70 px-3 py-1 text-[13px] font-medium text-[#6f675b] shadow-[var(--shadow-card)] transition-transform duration-200 hover:scale-[1.04] sm:gap-2 sm:px-4 sm:py-1.5 sm:text-[15px]">
              <svg width="12" height="14" viewBox="449 401 1035 1249" fill="currentColor" aria-hidden="true">
                <path d="M1063.3,401.3c162.7,0,310.3,64.3,420.3,169.3l-200,279c-49.3-47-118.7-76.3-195.7-76.3c-150.7,0-272.7,112.7-272.7,252s122,252,272.7,252c77,0,146.7-29.3,196.3-77l199.7,279.3c-110,105-258,169.7-420.7,169.7c-339,0-613.7-279.3-613.7-624S724.3,401.3,1063.3,401.3z"/>
              </svg>
              Centra
            </span>
            {/* Magento */}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line-soft)] bg-white/70 px-3 py-1 text-[13px] font-medium text-[#6f675b] shadow-[var(--shadow-card)] transition-transform duration-200 hover:scale-[1.04] sm:gap-2 sm:px-4 sm:py-1.5 sm:text-[15px]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 24l-4.455-2.572v-12l2.97-1.715v12.001l1.485.902 1.485-.902V7.713l2.971 1.715v12L12 24zM22.391 6v12l-2.969 1.714V7.713L12 3.43 4.574 7.713v12.001L1.609 18V6L12 0l10.391 6z"/>
              </svg>
              Magento
            </span>
          </div>
        </div>
      </section>


      {/* Lösningar */}
      <section className="mx-auto max-w-[1200px] px-6 pb-16 sm:px-10 sm:pb-24">
        <div className="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between" data-reveal>
          <div>
            <Eyebrow>Lösningar</Eyebrow>
          </div>
          <Link href="/losningar" className="text-sm font-semibold text-[var(--bundla-orange-deep)] hover:underline">
            Alla lösningar →
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" data-reveal data-reveal-delay="100">
          {SOLUTIONS.map((s) => (
            <Link
              key={s.slug}
              href={`/losningar/${s.slug}`}
              className="group flex flex-col rounded-[20px] border border-[var(--line-soft)] bg-white p-6 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-pop)]"
            >
              <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-ghost">{s.eyebrow}</div>
              <h3 className="mt-3 flex-1 font-display text-[19px] font-semibold leading-snug tracking-[-0.02em]">{s.metaTitle}</h3>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--bundla-orange-deep)]">
                Läs mer
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Priser */}
      <section id="priser" className="mx-auto max-w-[1200px] px-6 pb-16 sm:px-10 sm:pb-24">
        <div data-reveal>
          <Eyebrow>Priser</Eyebrow>
          <h2 className="mb-10 font-display text-[34px] font-semibold tracking-[-0.03em] sm:text-[40px]">
            Enkelt och flexibelt
          </h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:max-w-[760px]" data-reveal data-reveal-delay="100">
          <div className="rounded-[22px] border border-[var(--line-soft)] bg-white p-7 shadow-[var(--shadow-card)]">
            <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-ghost">Gratis</div>
            <div className="mt-3 font-display text-[40px] font-semibold tracking-[-0.02em]">Prova</div>
            <p className="mt-2 text-sm text-ink-body">Testa Studion direkt i webbläsaren — ingen registrering, inga kreditkort.</p>
            <Link href="/studio" className="mt-6 inline-flex rounded-[11px] border border-[var(--line-strong)] bg-[var(--surface)] px-5 py-3 text-sm font-semibold transition-colors hover:bg-white">
              Skapa en bundle →
            </Link>
          </div>
          <div className="rounded-[22px] border border-[var(--tint-orange-border,#F6D2B6)] bg-white p-7 shadow-[var(--shadow-pop)]">
            <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--bundla-orange-deep)]">Företag</div>
            <div className="mt-3 font-display text-[40px] font-semibold tracking-[-0.02em]">Skräddarsytt</div>
            <p className="mt-2 text-sm text-ink-body">Egen kvot per månad, fler användare och support. Vi sätter upp ett konto åt er.</p>
            <a href="mailto:jakob.radback@markable.se" className="btn-brand mt-6 inline-flex rounded-[11px] px-5 py-3 text-sm font-semibold">
              Kontakta oss
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-[1200px] px-6 pb-16 sm:px-10 sm:pb-24">
        <div data-reveal>
          <Eyebrow>Vanliga frågor</Eyebrow>
          <h2 className="mb-10 font-display text-[34px] font-semibold tracking-[-0.03em] sm:text-[40px]">
            Frågor och svar
          </h2>
        </div>
        <div className="flex flex-col gap-3 lg:max-w-[820px]" data-reveal data-reveal-delay="100">
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="group rounded-[18px] border border-[var(--line-soft)] bg-white px-6 py-5 shadow-[var(--shadow-card)]"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-[18px] font-semibold tracking-[-0.01em]">
                {item.q}
                <span className="shrink-0 text-[var(--bundla-orange)] transition-transform group-open:rotate-45" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </summary>
              <p className="mt-3 text-base leading-relaxed text-ink-body">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1200px] px-6 pb-16 sm:px-10 sm:pb-24" data-reveal>
        <div
          className="relative overflow-hidden rounded-[24px] px-8 py-8 sm:px-12 sm:py-10"
          style={{ background: "var(--gradient-brand-cta)" }}
        >
          <div className="absolute -right-12 -top-12 h-56 w-56 rounded-full bg-white/10" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-[480px]">
              <h2 className="font-display text-[26px] font-semibold leading-[1.06] text-white sm:text-[34px]">
                Gör det som tar timmar på sekunder
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-[#FFEAD8]">
                Ingen designkunskap. Ingen installation. Ladda ner färdig PNG direkt.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2.5">
              <div className="flex flex-wrap gap-3">
                <Link href="/studio" className="inline-flex items-center justify-center gap-2 rounded-[11px] bg-ink px-6 py-3 text-[15px] font-semibold text-white transition-transform active:translate-y-px">
                  Skapa en bundle →
                </Link>
                <a href="#priser" className="inline-flex items-center justify-center rounded-[11px] bg-white/90 px-6 py-3 text-[15px] font-semibold text-ink transition-colors hover:bg-white">
                  Se priser
                </a>
              </div>
              <p className="text-[12px] text-[#FFCFAE]">Kostnadsfritt att testa · Inga kreditkort · direkt i webbläsaren</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <MarketingFooter />
      <ScrollRevealScript />
      <BackToTop />
    </div>
  )
}
