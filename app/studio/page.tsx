import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ProductCompositor } from "@/components/product-compositor-v2"
import { NoAccess } from "@/components/no-access"

export const metadata = { title: "Studio", robots: { index: false, follow: false } }

export default async function StudioPage() {
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

  return <ProductCompositor />
}
