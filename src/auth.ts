import { getSession as getSpotifySession } from "@/lib/spotify-session"

/**
 * Session shape compatible with previous NextAuth usage.
 * Used by page.tsx (isUnauthenticated) and spotify-server.ts (accessToken).
 */
export interface Session {
  accessToken?: string
  refreshToken?: string
  expiresAt?: number
  error?: string
}

/** Returns current Spotify session or null. Refreshes token if expired. */
export async function auth(): Promise<Session | null> {
  const session = await getSpotifySession()
  if (!session) return null
  return {
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    expiresAt: session.expiresAt,
  }
}
