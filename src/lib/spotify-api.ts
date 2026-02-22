import { logServerError, logServerWarn } from "@/lib/server-log"

const LOG_TAG = "SpotifyAPI"
export const SPOTIFY_API_BASE = "https://api.spotify.com/v1"

type SpotifyErrorBody = {
  error?: { status?: number; message?: string }
}

/**
 * Spotify Web API への認証付き fetch。
 * 2026年2月改定準拠のエンドポイントを呼ぶ際に使用する。
 */
export async function spotifyFetch<T>(
  token: string,
  path: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
  const url = path.startsWith("http") ? path : `${SPOTIFY_API_BASE}${path}`
  let res: Response
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
      },
    })
  } catch (e) {
    logServerError(LOG_TAG, "spotify_fetch_network", e, { path, method: options.method ?? "GET" })
    throw e
  }
  const text = await res.text()
  let data: T | SpotifyErrorBody | undefined
  try {
    data = text ? (JSON.parse(text) as T | SpotifyErrorBody) : undefined
  } catch (e) {
    logServerError(LOG_TAG, "spotify_fetch_parse_body", e, {
      path,
      status: res.status,
      bodyPreview: text.slice(0, 200),
    })
  }
  if (!res.ok) {
    const errBody = data as SpotifyErrorBody | undefined
    const errMsg =
      errBody?.error?.message ??
      (typeof data === "object" && data && "error" in data
        ? String((data as { error: unknown }).error)
        : undefined)
    logServerWarn(LOG_TAG, "spotify_fetch_error", errMsg ?? `HTTP ${res.status}`, {
      path,
      status: res.status,
      errorMessage: errMsg,
    })
    return { ok: false, status: res.status, error: errMsg }
  }
  if (data === undefined) {
    logServerWarn(LOG_TAG, "spotify_fetch_parse_body", "OK response but invalid JSON", {
      path,
      status: res.status,
    })
    return { ok: false, status: 502, error: "Invalid response body" }
  }
  return { ok: true, status: res.status, data: data as T }
}

/** GET /search のトラック検索結果で利用する型（2026年2月改定後も items は変更なし） */
export interface SpotifyTrack {
  id?: string
  uri: string
  name?: string
  album?: {
    images?: Array<{ url: string; height?: number; width?: number }>
  }
}

export interface SpotifySearchTracksResponse {
  tracks?: {
    items?: SpotifyTrack[]
  }
}

/**
 * トラック検索（GET /v1/search?type=track）。
 * 2026年2月改定: limit 最大 10・デフォルト 5。
 */
export async function searchTracks(
  token: string,
  query: string,
  options?: { limit?: number }
): Promise<{
  ok: boolean
  status: number
  data?: SpotifySearchTracksResponse
  error?: string
}> {
  const limit = Math.min(options?.limit ?? 1, 10)
  const path = `/search?type=track&q=${encodeURIComponent(query)}&limit=${limit}`
  return spotifyFetch<SpotifySearchTracksResponse>(token, path)
}
