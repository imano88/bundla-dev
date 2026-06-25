import { createBrowserClient } from "@supabase/ssr"

// Browser Supabase client (uses the public publishable key, protected by RLS).
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
