import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { exchangeCodeForTokens } from "@/lib/spotify-pkce"
import { setSessionCookie } from "@/lib/spotify-session"

const STATE_COOKIE = "spotify_oauth_state"
const VERIFIER_COOKIE = "spotify_code_verifier"
const COOKIE_OPTIONS = { path: "/", maxAge: 0 }

/** Step 3: Callback from Spotify — exchange code for tokens, set session, redirect to /. */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  const cookieStore = await cookies()
  const savedState = cookieStore.get(STATE_COOKIE)?.value
  const codeVerifier = cookieStore.get(VERIFIER_COOKIE)?.value

  // Clear PKCE cookies regardless of outcome
  cookieStore.set(STATE_COOKIE, "", COOKIE_OPTIONS)
  cookieStore.set(VERIFIER_COOKIE, "", COOKIE_OPTIONS)

  if (error) {
    const base = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "http://127.0.0.1:3000"
    return NextResponse.redirect(`${base}/api/auth/spotify/error?error=${encodeURIComponent(error)}`)
  }

  if (!code || !state || state !== savedState || !codeVerifier) {
    const base = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "http://127.0.0.1:3000"
    return NextResponse.redirect(`${base}/api/auth/spotify/error?error=invalid_callback`)
  }

  try {
    const data = await exchangeCodeForTokens(code, codeVerifier)
    await setSessionCookie({
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? "",
      expiresAt: Date.now() + data.expires_in * 1000,
    })
  } catch (e) {
    console.error("[spotify callback]", e)
    const base = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "http://127.0.0.1:3000"
    return NextResponse.redirect(`${base}/api/auth/spotify/error?error=token_exchange_failed`)
  }

  const base = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "http://127.0.0.1:3000"
  return NextResponse.redirect(`${base}/`)
}
