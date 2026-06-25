import { NextResponse, type NextRequest } from "next/server"

// Interim access gate: the Studio and the paid friläggnings-endpoint require a
// valid session cookie (set by /api/login after the shared password is entered).
// The marketing pages stay public. Fails closed if the env vars are unset.
export function middleware(req: NextRequest) {
  const session = req.cookies.get("bundla_session")?.value
  const secret = process.env.APP_SESSION_SECRET
  if (secret && session === secret) {
    return NextResponse.next()
  }

  const { pathname, search } = req.nextUrl
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const url = req.nextUrl.clone()
  url.pathname = "/login"
  url.search = `?next=${encodeURIComponent(pathname + search)}`
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ["/studio", "/studio/:path*", "/api/remove-bg"],
}
