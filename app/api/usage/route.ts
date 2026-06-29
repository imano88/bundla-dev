import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

// Returns the current organisation's monthly usage for the meter in the Studio.
export async function GET() {
  const skipAuth = process.env.SKIP_AUTH === "true"

  // In dev mode, return dummy usage data
  if (skipAuth) {
    return Response.json({
      hasOrg: true,
      used: 0,
      quota: 999,
      isAdmin: true,
    })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, role, is_platform_admin")
    .eq("id", user.id)
    .maybeSingle()

  const isAdmin = profile?.role === "admin" || profile?.is_platform_admin === true

  if (!profile?.org_id) {
    return Response.json({ hasOrg: false, used: 0, quota: 0, isAdmin })
  }

  const period = new Date().toISOString().slice(0, 7) // YYYY-MM
  const [{ data: org }, { data: counter }] = await Promise.all([
    supabase.from("organizations").select("monthly_quota").eq("id", profile.org_id).maybeSingle(),
    supabase
      .from("usage_counters")
      .select("used")
      .eq("org_id", profile.org_id)
      .eq("period", period)
      .maybeSingle(),
  ])

  return Response.json({
    hasOrg: true,
    used: counter?.used ?? 0,
    quota: org?.monthly_quota ?? 0,
    isAdmin,
  })
}
