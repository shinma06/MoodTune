import { NextResponse } from "next/server"
import { clearSessionCookie } from "@/lib/spotify-session"

export async function GET() {
  await clearSessionCookie()
  const base = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "http://127.0.0.1:3000"
  return NextResponse.redirect(`${base}/`)
}
