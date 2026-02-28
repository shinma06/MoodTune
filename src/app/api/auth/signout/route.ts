import { NextResponse } from "next/server"
import { SESSION_COOKIE_NAME } from "@/lib/spotify-session"

export async function GET() {
  const base = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "http://127.0.0.1:3000"
  const response = NextResponse.redirect(`${base}/`)
  response.cookies.set(SESSION_COOKIE_NAME, "", { path: "/", maxAge: 0 })
  return response
}
