"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2, ArrowLeft, X } from "lucide-react"

type Member = { id: string; email: string; role: string; confirmed: boolean }

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
  const [role, setRole] = useState<"member" | "admin">("member")
  const [inviting, setInviting] = useState(false)
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  const remaining = Math.max(0, quota - used)
  const pct = quota > 0 ? Math.min(100, Math.round((used / quota) * 100)) : 0

  const invite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviting(true)
    setMsg(null)
    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, role }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setMsg({
          type: "ok",
          text: `${email} är inbjuden och kopplad till teamet. De loggar in via inloggningssidan med sin e-post.`,
        })
        setEmail("")
        setRole("member")
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

        <div className="mt-6">
          <h1 className="font-display text-[32px] font-bold tracking-[-0.03em]">Team</h1>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-ghost">{orgName}</p>
        </div>

        {/* Genereringar (krediter) */}
        <div className="mt-6 rounded-[22px] border border-[var(--line-soft)] bg-white p-6 shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-ghost">
                Genereringar denna månad
              </div>
              <div className="mt-1 font-display text-[30px] font-bold tracking-[-0.02em]">
                {used} <span className="text-[18px] font-medium text-ink-muted">/ {quota}</span>
              </div>
            </div>
            <div className="text-sm font-medium text-ink-muted">{remaining} kvar</div>
          </div>
          <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-[var(--surface-sunken)]">
            <div
              className="h-full rounded-full"
              style={{ width: `${pct}%`, background: "var(--gradient-brand)" }}
            />
          </div>
          <p className="mt-3 text-xs text-ink-muted">
            Kvoten delas av hela teamet och återställs den 1:a varje månad.
          </p>
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
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "member" | "admin")}
              aria-label="Roll"
              className="rounded-[11px] border border-[var(--line-warm)] bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-[var(--bundla-orange)]"
            >
              <option value="member">Medlem</option>
              <option value="admin">Admin</option>
            </select>
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
        <div className="mb-3 mt-8 flex items-baseline justify-between">
          <h2 className="font-display text-lg font-semibold tracking-[-0.02em]">Medlemmar</h2>
          <span className="font-mono text-xs text-ink-muted">
            {members.length} {members.length === 1 ? "person" : "personer"}
          </span>
        </div>
        <p className="mb-3 text-xs text-ink-muted">
          Alla medlemmar delar teamets gemensamma kvot ovan. Antalet medlemmar är inte begränsat.
        </p>
        <div className="rounded-[22px] border border-[var(--line-soft)] bg-white p-2 shadow-[var(--shadow-card)]">
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
              <div className="flex shrink-0 items-center gap-2">
                {m.confirmed ? (
                  <span className="inline-flex min-w-[74px] items-center justify-center rounded-full bg-[#e8f6ef] px-2.5 py-1 text-[11px] font-semibold text-[#1c8a5b]">
                    Aktiv
                  </span>
                ) : (
                  <span
                    title="Har inte loggat in / verifierat sitt konto än"
                    className="inline-flex min-w-[74px] items-center justify-center rounded-full bg-[var(--tint-orange)] px-2.5 py-1 text-[11px] font-semibold text-[var(--bundla-orange-deep)]"
                  >
                    Inbjuden
                  </span>
                )}
                {m.id !== meId ? (
                  <button
                    onClick={() => remove(m.id)}
                    aria-label={`Ta bort ${m.email}`}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-[var(--tint-orange)] hover:text-[var(--bundla-orange-deep)]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : (
                  <span className="h-8 w-8" aria-hidden="true" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
