import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { exchangeCodeForTokens } from "@/lib/spotify-pkce"
import { setSessionCookie } from "@/lib/spotify-session"
import { logServerError, logServerWarn } from "@/lib/server-log"

const LOG_TAG = "Spotify Auth (callback)"

const STATE_COOKIE = "spotify_oauth_state"
const VERIFIER_COOKIE = "spotify_code_verifier"
const COOKIE_OPTIONS = { path: "/", maxAge: 0 }

/** Step 3: Callback from Spotify — exchange code for tokens, set session, redirect to /. */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const requestOrigin = requestUrl.origin
  const { searchParams } = requestUrl
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
    logServerWarn(LOG_TAG, "oauth_error_param", error, {
      error,
      hasCode: !!code,
      hasState: !!state,
    })
    return NextResponse.redirect(
      `${requestOrigin}/api/auth/spotify/error?error=${encodeURIComponent(error)}`
    )
  }

  if (!code || !state || state !== savedState || !codeVerifier) {
    logServerWarn(LOG_TAG, "invalid_callback", "missing or mismatch code/state/verifier", {
      hasCode: !!code,
      hasState: !!state,
      stateMatch: state === savedState,
      hasCodeVerifier: !!codeVerifier,
    })
    return NextResponse.redirect(
      `${requestOrigin}/api/auth/spotify/error?error=invalid_callback`
    )
  }

  try {
    const data = await exchangeCodeForTokens(code, codeVerifier, requestOrigin)
    await setSessionCookie({
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? "",
      expiresAt: Date.now() + data.expires_in * 1000,
    })
  } catch (e) {
    logServerError(LOG_TAG, "token_exchange_or_set_session", e, {
      hasCode: !!code,
      redirectOrigin: requestOrigin,
    })
    return NextResponse.redirect(
      `${requestOrigin}/api/auth/spotify/error?error=token_exchange_failed`
    )
  }

  return NextResponse.redirect(`${requestOrigin}/`)
}
