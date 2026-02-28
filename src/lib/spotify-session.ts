import crypto from "node:crypto"
import { cookies } from "next/headers"
import { logServerError, logServerWarn } from "@/lib/server-log"

const LOG_TAG = "Spotify Session"

const COOKIE_NAME = "spotify_session"
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 // 30 days
const REFRESH_MARGIN_MS = 60_000 // refresh if expires in < 1 min

export interface SpotifySession {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

function getSecret(): Buffer {
  const secret = process.env.AUTH_SECRET
  if (!secret || secret.length < 32) {
    logServerWarn(LOG_TAG, "get_secret", "AUTH_SECRET missing or too short", { length: secret?.length ?? 0 })
    throw new Error("AUTH_SECRET must be at least 32 chars")
  }
  return crypto.createHash("sha256").update(secret).digest()
}

function encrypt(payload: SpotifySession): string {
  const iv = crypto.randomBytes(12)
  const key = getSecret()
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv)
  const enc = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()
  return Buffer.concat([iv, authTag, enc]).toString("base64url")
}

function decrypt(value: string): SpotifySession | null {
  try {
    const buf = Buffer.from(value, "base64url")
    if (buf.length < 12 + 16) return null
    const iv = buf.subarray(0, 12)
    const authTag = buf.subarray(12, 28)
    const enc = buf.subarray(28)
    const key = getSecret()
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv)
    decipher.setAuthTag(authTag)
    const raw = decipher.update(enc) as Buffer
    const rest = decipher.final() as Buffer
    const json = Buffer.concat([raw, rest]).toString("utf8")
    const data = JSON.parse(json) as Record<string, unknown>
    if (
      typeof data.accessToken !== "string" ||
      typeof data.refreshToken !== "string" ||
      typeof data.expiresAt !== "number"
    )
      return null
    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresAt: data.expiresAt,
    }
  } catch (e) {
    logServerError(LOG_TAG, "decrypt_session", e, { valueLength: value?.length ?? 0 })
    return null
  }
}

/** Refresh access token using refresh_token (uses client_secret). */
async function refreshSpotifyToken(
  refreshToken: string
): Promise<SpotifySession | null> {
  const id = process.env.AUTH_SPOTIFY_ID
  const secret = process.env.AUTH_SPOTIFY_SECRET
  if (!id || !secret) {
    logServerWarn(LOG_TAG, "refresh_token", "AUTH_SPOTIFY_ID or AUTH_SPOTIFY_SECRET not set", {
      hasId: !!id,
      hasSecret: !!secret,
    })
    return null
  }
  try {
    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    })
    if (!res.ok) {
      const errText = await res.text()
      logServerWarn(LOG_TAG, "refresh_token_response", `HTTP ${res.status}`, {
        status: res.status,
        bodyPreview: errText.slice(0, 200),
      })
      return null
    }
    const data = (await res.json()) as {
      access_token: string
      refresh_token?: string
      expires_in: number
    }
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? refreshToken,
      expiresAt: Date.now() + data.expires_in * 1000,
    }
  } catch (e) {
    logServerError(LOG_TAG, "refresh_token", e, {})
    return null
  }
}

/**
 * Get current session from cookie. If expired, attempt refresh and update cookie.
 */
export async function getSession(): Promise<SpotifySession | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(COOKIE_NAME)?.value
  if (!raw) return null
  let session = decrypt(raw)
  if (!session) return null
  if (Date.now() < session.expiresAt - REFRESH_MARGIN_MS) return session
  const refreshed = await refreshSpotifyToken(session.refreshToken)
  if (!refreshed) return session
  // Cookie can only be set in Server Action or Route Handler; avoid throwing during RSC render.
  try {
    await setSessionCookie(refreshed)
  } catch {
    // Ignore: this request still gets the refreshed session; cookie will be updated on next Route Handler/Server Action.
  }
  return refreshed
}

/** Set session cookie (used from callback route). */
export async function setSessionCookie(session: SpotifySession): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, encrypt(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  })
}

/** Clear session cookie (sign out). */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}
