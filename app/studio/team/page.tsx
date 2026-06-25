import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { TeamPanel } from "@/components/team-panel"

export const metadata = { title: "Team" }

export default async function TeamPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/studio/team")

  const { data: me } = await supabase
    .from("profiles")
    .select("org_id, role, is_platform_admin")
    .eq("id", user.id)
    .maybeSingle()

  if (!me?.org_id) redirect("/studio")
  const isAdmin = me.role === "admin" || me.is_platform_admin
  if (!isAdmin) redirect("/studio")

  const period = new Date().toISOString().slice(0, 7)
  const [{ data: members }, { data: org }, { data: counter }] = await Promise.all([
    supabase.from("profiles").select("id, email, role").eq("org_id", me.org_id).order("email"),
    supabase.from("organizations").select("name, monthly_quota").eq("id", me.org_id).maybeSingle(),
    supabase
      .from("usage_counters")
      .select("used")
      .eq("org_id", me.org_id)
      .eq("period", period)
      .maybeSingle(),
  ])

  return (
    <TeamPanel
      orgName={org?.name ?? "Din organisation"}
      quota={org?.monthly_quota ?? 0}
      used={counter?.used ?? 0}
      meId={user.id}
      members={(members ?? []).map((m) => ({
        id: m.id,
        email: m.email ?? "",
        role: m.role as string,
      }))}
    />
  )
}
