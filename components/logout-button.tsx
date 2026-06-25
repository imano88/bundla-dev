"use client"

import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter()
  return (
    <button
      onClick={async () => {
        await createClient().auth.signOut()
        router.push("/")
        router.refresh()
      }}
      className={
        className ??
        "inline-flex items-center rounded-[11px] border border-[var(--line-strong)] bg-white px-4 py-2.5 text-sm font-semibold text-ink-body transition-colors hover:bg-[var(--surface)]"
      }
    >
      Logga ut
    </button>
  )
}
