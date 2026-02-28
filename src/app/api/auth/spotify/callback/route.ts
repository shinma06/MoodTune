import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { exchangeCodeForTokens } from "@/lib/spotify-pkce"
import { buildSessionCookie } from "@/lib/spotify-session"

const STATE_COOKIE = "spotify_oauth_state"
const VERIFIER_COOKIE = "spotify_code_verifier"

function getBaseUrl(): string {
  return process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "http://127.0.0.1:3000"
}

function redirectWithCleanup(url: string): NextResponse {
  const response = NextResponse.redirect(url)
  response.cookies.set(STATE_COOKIE, "", { path: "/", maxAge: 0 })
  response.cookies.set(VERIFIER_COOKIE, "", { path: "/", maxAge: 0 })
  return response
}

/** Step 3: Callback from Spotify — exchange code for tokens, set session, redirect to /. */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  const cookieStore = await cookies()
  const savedState = cookieStore.get(STATE_COOKIE)?.value
  const codeVerifier = cookieStore.get(VERIFIER_COOKIE)?.value

  if (error) {
    return redirectWithCleanup(`${getBaseUrl()}/api/auth/spotify/error?error=${encodeURIComponent(error)}`)
  }

  if (!code || !state || state !== savedState || !codeVerifier) {
    return redirectWithCleanup(`${getBaseUrl()}/api/auth/spotify/error?error=invalid_callback`)
  }

  try {
    const data = await exchangeCodeForTokens(code, codeVerifier)
    const { name, value, options } = buildSessionCookie({
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? "",
      expiresAt: Date.now() + data.expires_in * 1000,
    })

    const response = redirectWithCleanup(`${getBaseUrl()}/`)
    response.cookies.set(name, value, options)
    return response
  } catch (e) {
    console.error("[spotify callback]", e)
    return redirectWithCleanup(`${getBaseUrl()}/api/auth/spotify/error?error=token_exchange_failed`)
  }
}
