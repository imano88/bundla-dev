"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2, ArrowLeft, X } from "lucide-react"

type Member = { id: string; email: string; role: string }

export function TeamPanel({
  orgName,
  quota,
  used,
  members,
  meId,
}: {
  orgName: string
  quota: number
  used: number
  members: Member[]
  meId: string
}) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [inviting, setInviting] = useState(false)
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  const invite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviting(true)
    setMsg(null)
    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setMsg({ type: "ok", text: `${email} har lagts till i teamet.` })
        setEmail("")
        router.refresh()
      } else {
        setMsg({ type: "err", text: data?.message ?? "Kunde inte bjuda in." })
      }
    } catch {
      setMsg({ type: "err", text: "Något gick fel. Försök igen." })
    } finally {
      setInviting(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm("Ta bort den här medlemmen från teamet?")) return
    const res = await fetch("/api/admin/remove", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId: id }),
    })
    if (res.ok) router.refresh()
  }

  return (
    <main className="min-h-screen bg-[var(--app-bg)] text-ink">
      <div className="mx-auto max-w-[720px] px-6 py-10 sm:px-8">
        <Link
          href="/studio"
          className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.12em] text-ink-ghost transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Tillbaka till Studio
        </Link>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
          <h1 className="font-display text-[32px] font-bold tracking-[-0.03em]">Team</h1>
          <span className="font-mono text-xs text-ink-muted">
            {orgName} · {used} / {quota} denna månad
          </span>
        </div>

        {/* Invite */}
        <div className="mt-6 rounded-[22px] border border-[var(--line-soft)] bg-white p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-sm font-semibold">Bjud in en kollega</h2>
          <p className="mt-1 text-xs text-ink-muted">
            De får ett mejl med en inloggningslänk och kopplas direkt till {orgName}.
          </p>
          <form onSubmit={invite} className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="namn@företag.se"
              aria-label="E-postadress"
              className="w-full flex-1 rounded-[11px] border border-[var(--line-warm)] bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--bundla-orange)]"
            />
            <button
              type="submit"
              disabled={inviting || !email}
              className="btn-brand inline-flex items-center justify-center gap-2 rounded-[11px] px-5 py-2.5 text-sm font-semibold disabled:pointer-events-none disabled:opacity-50"
            >
              {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Bjud in
            </button>
          </form>
          {msg && (
            <p
              className={
                "mt-3 text-xs " +
                (msg.type === "ok" ? "text-[var(--success)]" : "text-[var(--bundla-orange-deep)]")
              }
            >
              {msg.text}
            </p>
          )}
        </div>

        {/* Members */}
        <div className="mt-6 rounded-[22px] border border-[var(--line-soft)] bg-white p-2 shadow-[var(--shadow-card)]">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between gap-3 rounded-[16px] px-4 py-3 transition-colors hover:bg-[var(--surface)]"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{m.email}</div>
                <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-ghost">
                  {m.role === "admin" ? "Admin" : "Medlem"}
                  {m.id === meId ? " · du" : ""}
                </div>
              </div>
              {m.id !== meId && (
                <button
                  onClick={() => remove(m.id)}
                  aria-label={`Ta bort ${m.email}`}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-[var(--tint-orange)] hover:text-[var(--bundla-orange-deep)]"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
