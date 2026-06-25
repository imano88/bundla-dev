"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const supabase = createClient()
      const next = new URLSearchParams(window.location.search).get("next")
      const redirectTo = `${window.location.origin}/auth/callback${
        next && next.startsWith("/") ? `?next=${encodeURIComponent(next)}` : ""
      }`
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      })
      if (error) {
        console.error("signInWithOtp error:", error)
        setError(error.message || "Kunde inte skicka länken. Försök igen.")
        setLoading(false)
      } else {
        setSent(true)
      }
    } catch (err) {
      console.error("login error:", err)
      setError(err instanceof Error ? err.message : "Något gick fel. Försök igen.")
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="rounded-[14px] bg-[var(--tint-orange)] px-4 py-4 text-sm text-ink-body">
        Kolla din mejl — vi har skickat en inloggningslänk till <strong>{email}</strong>. Öppna den på
        den här enheten för att logga in.
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="namn@företag.se"
        autoFocus
        aria-label="E-postadress"
        className="w-full rounded-[11px] border border-[var(--line-warm)] bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--bundla-orange)]"
      />
      {error && <p className="text-xs text-[var(--bundla-orange-deep)]">{error}</p>}
      <button
        type="submit"
        disabled={loading || !email}
        className="btn-brand inline-flex w-full items-center justify-center gap-2 rounded-[11px] px-4 py-3 text-sm font-semibold disabled:pointer-events-none disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Skicka inloggningslänk
      </button>
    </form>
  )
}
