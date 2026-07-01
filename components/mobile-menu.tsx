"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"

// Mobile navigation menu for the landing page header. Isolated as a client
// component so the landing page itself can stay a server component.
export function MobileMenu() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Stäng meny" : "Öppna meny"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-[11px] border border-[var(--line-warm)] bg-white/70 text-ink transition-colors hover:bg-white"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-ink/20" onClick={close} aria-hidden="true" />
          <div className="absolute left-4 right-4 top-full z-50 mt-2 rounded-[20px] border border-[var(--line-soft)] bg-white p-3 shadow-[var(--shadow-float)]">
            <nav className="flex flex-col">
              <Link href="/losningar" onClick={close} className="rounded-[11px] px-4 py-3 text-[15px] font-medium text-ink-body transition-colors hover:bg-[var(--surface)]">
                Lösningar
              </Link>
              <a href="#sa-funkar" onClick={close} className="rounded-[11px] px-4 py-3 text-[15px] font-medium text-ink-body transition-colors hover:bg-[var(--surface)]">
                Så funkar det
              </a>
              <a href="#priser" onClick={close} className="rounded-[11px] px-4 py-3 text-[15px] font-medium text-ink-body transition-colors hover:bg-[var(--surface)]">
                Priser
              </a>
              <a href="#faq" onClick={close} className="rounded-[11px] px-4 py-3 text-[15px] font-medium text-ink-body transition-colors hover:bg-[var(--surface)]">
                Vanliga frågor
              </a>
              <div className="my-2 border-t border-[var(--line-soft)]" />
              <Link href="/login" onClick={close} className="rounded-[11px] px-4 py-3 text-[15px] font-semibold text-ink-body transition-colors hover:bg-[var(--surface)]">
                Logga in
              </Link>
              <Link href="/studio" onClick={close} className="btn-brand mt-1 inline-flex items-center justify-center rounded-[11px] px-4 py-3 text-[15px] font-semibold">
                Skapa en bundle →
              </Link>
            </nav>
          </div>
        </>
      )}
    </div>
  )
}
