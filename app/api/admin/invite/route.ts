import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"

// Invites a person to the caller's organisation. Org admins (or platform admins)
// only. Creates the auth user + sends an email; if the user already exists, just
// attaches them to the org.
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 })

  const { data: me } = await supabase
    .from("profiles")
    .select("org_id, role, is_platform_admin")
    .eq("id", user.id)
    .maybeSingle()

  if (!me?.org_id || !(me.role === "admin" || me.is_platform_admin)) {
    return Response.json({ error: "forbidden", message: "Endast admin kan bjuda in." }, { status: 403 })
  }

  let email: unknown
  let role: unknown
  try {
    const body = await req.json()
    email = body?.email
    role = body?.role
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 })
  }
  if (typeof email !== "string" || !email.includes("@")) {
    return Response.json({ error: "bad_email", message: "Ogiltig e-postadress." }, { status: 400 })
  }
  const normalizedEmail = email.trim().toLowerCase()
  const memberRole = role === "admin" ? "admin" : "member"

  const admin = createAdminClient()
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin
  const redirectTo = `${origin}/auth/callback`

  // Create + email the user. If they already exist this errors, so fall back to
  // looking up their existing profile by email.
  const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(
    normalizedEmail,
    { redirectTo }
  )

  let targetId: string | null = invited?.user?.id ?? null
  if (!targetId && inviteErr) {
    const { data: existing } = await admin
      .from("profiles")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle()
    targetId = existing?.id ?? null
  }

  if (!targetId) {
    return Response.json(
      { error: "invite_failed", message: "Kunde inte bjuda in. Be personen logga in en gång först." },
      { status: 502 }
    )
  }

  const { error: updErr } = await admin
    .from("profiles")
    .update({ org_id: me.org_id, role: memberRole })
    .eq("id", targetId)

  if (updErr) {
    return Response.json({ error: "attach_failed", message: "Kunde inte koppla användaren." }, { status: 502 })
  }

  return Response.json({ ok: true, existing: !!inviteErr })
}
