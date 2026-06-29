import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ProductCompositor } from "@/components/product-compositor-v2"
import { NoAccess } from "@/components/no-access"

export const metadata = { title: "Studio", robots: { index: false, follow: false } }

const skipAuth = process.env.SKIP_AUTH === "true"

export default async function StudioPage() {
  if (!skipAuth) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      redirect("/login?next=/studio")
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .maybeSingle()

    if (!profile?.org_id) {
      return <NoAccess email={user.email ?? ""} />
    }
  }

  return (
    <>
      {skipAuth && (
        <div className="w-full bg-amber-400 px-4 py-2 text-center text-sm font-semibold text-amber-900">
          ⚠ DEV-LÄGE — Inloggning är inaktiverad. Aktivera inte SKIP_AUTH i produktion.
        </div>
      )}
      <ProductCompositor />
    </>
  )
}
