import { NextRequest } from "next/server"
import { cookies } from "next/headers"

export const runtime = "nodejs"

// Validates the shared password and, on success, sets the session cookie that
// the middleware checks. Both APP_PASSWORD and APP_SESSION_SECRET must be set
// in the environment.
export async function POST(req: NextRequest) {
  const expected = process.env.APP_PASSWORD
  const secret = process.env.APP_SESSION_SECRET
  if (!expected || !secret) {
    return Response.json(
      { error: "not_configured", message: "Inloggning är inte konfigurerad." },
      { status: 500 }
    )
  }

  let password: unknown
  try {
    password = (await req.json())?.password
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 })
  }

  if (typeof password !== "string" || password !== expected) {
    return Response.json({ error: "invalid", message: "Fel lösenord." }, { status: 401 })
  }

  const store = await cookies()
  store.set("bundla_session", secret, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  })
  return Response.json({ ok: true })
}
