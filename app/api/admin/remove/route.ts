import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"

// Removes a member from the caller's organisation (sets org_id = null). Org
// admins only; you cannot remove yourself.
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
    return Response.json({ error: "forbidden" }, { status: 403 })
  }

  let userId: unknown
  try {
    userId = (await req.json())?.userId
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 })
  }
  if (typeof userId !== "string") {
    return Response.json({ error: "bad_request" }, { status: 400 })
  }
  if (userId === user.id) {
    return Response.json({ error: "self", message: "Du kan inte ta bort dig själv." }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from("profiles")
    .update({ org_id: null, role: "member" })
    .eq("id", userId)
    .eq("org_id", me.org_id) // only remove members of your own org

  if (error) {
    return Response.json({ error: "remove_failed" }, { status: 502 })
  }
  return Response.json({ ok: true })
}
