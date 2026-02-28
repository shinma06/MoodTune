import { getSession } from "@/lib/spotify-session"

const SPOTIFY_API = "https://api.spotify.com/v1"

type SpotifyErrorBody = {
  error?: { status?: number; message?: string }
}

export type SpotifyFetchResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error?: string }

/** Authenticated fetch against Spotify Web API. */
export async function spotifyFetch<T>(
  token: string,
  path: string,
  options: RequestInit = {}
): Promise<SpotifyFetchResult<T>> {
  const url = path.startsWith("http") ? path : `${SPOTIFY_API}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    },
  })
  const text = await res.text()
  let data: T | SpotifyErrorBody | undefined
  try {
    data = text ? (JSON.parse(text) as T | SpotifyErrorBody) : undefined
  } catch {
    if (!res.ok) {
      return { ok: false, status: res.status, error: `Invalid response body` }
    }
  }
  if (!res.ok) {
    const errBody = data as SpotifyErrorBody | undefined
    const errMsg =
      errBody?.error?.message ??
      (typeof data === "object" && data && "error" in data
        ? String((data as { error: unknown }).error)
        : undefined)
    return { ok: false, status: res.status, error: errMsg }
  }
  return { ok: true, status: res.status, data: data as T }
}

/** Get current access token from session (returns null if not authenticated). */
export async function getAccessToken(): Promise<string | null> {
  const session = await getSession()
  return session?.accessToken ?? null
}
