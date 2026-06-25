import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

// Exchanges the magic-link code for a session, then sends the user on.
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next")
  const dest = next && next.startsWith("/") ? next : "/studio"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${dest}`)
    }
  }
  return NextResponse.redirect(`${origin}/login?error=auth`)
}
