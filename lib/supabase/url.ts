// Normalises NEXT_PUBLIC_SUPABASE_URL to just the origin (https://<ref>.supabase.co)
// so a trailing slash or an accidental path (e.g. /rest/v1) can't break the
// auth/REST request paths.
export function getSupabaseUrl() {
  const raw = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim()
  try {
    return new URL(raw).origin
  } catch {
    return raw.replace(/\/+$/, "")
  }
}
