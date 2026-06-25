import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { getSupabaseUrl } from "@/lib/supabase/url"

// Privileged server-only client (uses the secret key, bypasses RLS).
// NEVER import this into client code.
export function createAdminClient() {
  return createSupabaseClient(getSupabaseUrl(), process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
