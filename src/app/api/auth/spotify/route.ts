import { NextResponse } from "next/server"
import { buildAuthorizeUrl } from "@/lib/spotify-pkce"
import crypto from "node:crypto"

const STATE_COOKIE = "spotify_oauth_state"
const VERIFIER_COOKIE = "spotify_code_verifier"
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 600, // 10 min
}

/** Step 1–2: Generate PKCE, store code_verifier + state in cookies, redirect to Spotify authorize. */
export async function GET() {
  const state = crypto.randomBytes(24).toString("base64url")
  const { url, codeVerifier } = await buildAuthorizeUrl(state)

  const response = NextResponse.redirect(url)
  response.cookies.set(STATE_COOKIE, state, COOKIE_OPTIONS)
  response.cookies.set(VERIFIER_COOKIE, codeVerifier, COOKIE_OPTIONS)

  return response
}
