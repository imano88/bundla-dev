import { createBrowserClient } from "@supabase/ssr"
import { getSupabaseUrl } from "@/lib/supabase/url"

// Browser Supabase client (uses the public publishable key, protected by RLS).
export function createClient() {
  return createBrowserClient(
    getSupabaseUrl(),
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
