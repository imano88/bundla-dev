import Link from "next/link"
import { LoginForm } from "@/components/login-form"

export const metadata = { title: "Logga in" }

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--paper)] px-6">
      <div className="w-full max-w-[360px]">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <svg width="34" height="34" viewBox="0 0 60 60" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id="loginMark" x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#FF8A2B" />
                <stop offset="1" stopColor="#FFB05C" />
              </linearGradient>
            </defs>
            <rect x="6" y="6" width="33" height="33" rx="10" fill="url(#loginMark)" />
            <rect x="21" y="21" width="33" height="33" rx="10" fill="#FF6A00" />
          </svg>
          <span className="font-display text-2xl font-bold tracking-[-0.02em] text-ink">Bundla</span>
        </Link>

        <div className="rounded-[22px] border border-[var(--line-soft)] bg-white p-7 shadow-[var(--shadow-card)]">
          <h1 className="mb-1 font-display text-xl font-bold tracking-[-0.02em] text-ink">Logga in</h1>
          <p className="mb-5 text-sm text-ink-muted">Ange lösenordet för att öppna Studion.</p>
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-ink-ghost">
          Saknar du åtkomst?{" "}
          <a href="mailto:jakob.radback@markable.se" className="underline hover:text-ink">
            Hör av dig
          </a>
        </p>
      </div>
    </main>
  )
}
