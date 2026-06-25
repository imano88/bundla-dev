import Link from "next/link"
import { LogoutButton } from "@/components/logout-button"

export function NoAccess({ email }: { email: string }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--paper)] px-6 text-center">
      <div className="max-w-[440px]">
        <Link href="/" className="mb-8 inline-flex items-center gap-2.5">
          <svg width="34" height="34" viewBox="0 0 60 60" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id="naMark" x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#FF8A2B" />
                <stop offset="1" stopColor="#FFB05C" />
              </linearGradient>
            </defs>
            <rect x="6" y="6" width="33" height="33" rx="10" fill="url(#naMark)" />
            <rect x="21" y="21" width="33" height="33" rx="10" fill="#FF6A00" />
          </svg>
          <span className="font-display text-2xl font-bold tracking-[-0.02em] text-ink">Bundla</span>
        </Link>
        <h1 className="font-display text-2xl font-bold tracking-[-0.02em] text-ink">
          Du har inte fått åtkomst än
        </h1>
        <p className="mx-auto mt-3 max-w-[380px] text-[15px] leading-relaxed text-ink-body">
          Du är inloggad som <strong>{email}</strong>, men kontot är inte kopplat till någon
          organisation. Be din administratör om åtkomst, eller hör av dig till oss.
        </p>
        <div className="mt-7 flex items-center justify-center gap-3">
          <a
            href="mailto:jakob.radback@markable.se"
            className="btn-brand inline-flex rounded-[11px] px-5 py-2.5 text-sm font-semibold"
          >
            Kontakta oss
          </a>
          <LogoutButton />
        </div>
      </div>
    </main>
  )
}
