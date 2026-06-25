"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export function LoginForm() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        const next = new URLSearchParams(window.location.search).get("next")
        router.push(next && next.startsWith("/") ? next : "/studio")
        router.refresh()
        return
      }
      const data = await res.json().catch(() => ({}))
      setError(data?.message ?? "Kunde inte logga in.")
    } catch {
      setError("Något gick fel. Försök igen.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Lösenord"
        autoFocus
        aria-label="Lösenord"
        className="w-full rounded-[11px] border border-[var(--line-warm)] bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--bundla-orange)]"
      />
      {error && <p className="text-xs text-[var(--bundla-orange-deep)]">{error}</p>}
      <button
        type="submit"
        disabled={loading || !password}
        className="btn-brand inline-flex w-full items-center justify-center gap-2 rounded-[11px] px-4 py-3 text-sm font-semibold disabled:pointer-events-none disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Logga in
      </button>
    </form>
  )
}
