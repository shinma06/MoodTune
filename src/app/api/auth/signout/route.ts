import { NextResponse } from "next/server"
import { clearSessionCookie } from "@/lib/spotify-session"
import { logServerError } from "@/lib/server-log"

const LOG_TAG = "Spotify Auth (signout)"

export async function GET() {
  try {
    await clearSessionCookie()
  } catch (error) {
    logServerError(LOG_TAG, "clear_session_cookie", error, {})
  }
  const base = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "http://127.0.0.1:3000"
  return NextResponse.redirect(`${base}/`)
}
