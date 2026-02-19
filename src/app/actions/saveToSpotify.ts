"use server"

import { getSession } from "@/lib/spotify-session"

const PLAYLIST_NAME = "MoodTune"
const SPOTIFY_API = "https://api.spotify.com/v1"
const MAX_TRACKS_PER_REQUEST = 100

export type SaveToSpotifyResult =
  | { success: true; playlistUrl: string }
  | { success: false; error: string }

function formatSpotifyError(error?: string, status?: number): string {
  if (error) return `Spotify: ${error}`
  return status === 401
    ? "Spotify の認証が切れています。再度ログインしてください。"
    : "Spotify でエラーが発生しました。しばらくしてからお試しください。"
}

type SpotifyErrorBody = {
  error?: { status?: number; message?: string }
}

async function spotifyFetch<T>(
  token: string,
  path: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
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
    // ignore
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

/** Add tracks in chunks (Spotify allows max 100 per request). */
async function addTracksInChunks(
  token: string,
  playlistId: string,
  uris: string[]
): Promise<{ ok: boolean; status: number; error?: string }> {
  for (let i = 0; i < uris.length; i += MAX_TRACKS_PER_REQUEST) {
    const chunk = uris.slice(i, i + MAX_TRACKS_PER_REQUEST)
    const res = await spotifyFetch(token, `/playlists/${playlistId}/tracks`, {
      method: "POST",
      body: JSON.stringify({ uris: chunk }),
    })
    if (!res.ok) return res
  }
  return { ok: true, status: 200 }
}

/**
 * Spotify プレイリスト "MoodTune" を上書き or 新規作成してトラックを追加する
 */
export async function saveToSpotify(
  title: string,
  trackUris: string[]
): Promise<SaveToSpotifyResult> {
  if (trackUris.length === 0) {
    return { success: false, error: "再生できる楽曲がありません" }
  }

  const session = await getSession()
  if (!session) {
    return { success: false, error: "Spotifyにログインしてください" }
  }

  const token = session.accessToken

  const meRes = await spotifyFetch<{ id: string }>(token, "/me")
  if (!meRes.ok) {
    return {
      success: false,
      error: formatSpotifyError(meRes.error, meRes.status),
    }
  }
  const userId = meRes.data!.id

  const existingId = await findMoodTunePlaylist(token, userId)
  const playlistName = `${PLAYLIST_NAME}: ${title}`
  const description = "MoodTuneが天気と時間帯に合わせて生成したプレイリスト"

  let playlistId: string

  if (existingId) {
    const updateRes = await spotifyFetch(token, `/playlists/${existingId}`, {
      method: "PUT",
      body: JSON.stringify({
        name: playlistName,
        description,
        public: true,
      }),
    })
    if (!updateRes.ok) {
      return { success: false, error: formatSpotifyError(updateRes.error, updateRes.status) }
    }

    const firstChunk = trackUris.slice(0, MAX_TRACKS_PER_REQUEST)
    const replaceRes = await spotifyFetch(
      token,
      `/playlists/${existingId}/items`,
      {
        method: "PUT",
        body: JSON.stringify({ uris: firstChunk }),
      }
    )
    if (!replaceRes.ok) {
      return { success: false, error: formatSpotifyError(replaceRes.error, replaceRes.status) }
    }
    const rest = trackUris.slice(MAX_TRACKS_PER_REQUEST)
    if (rest.length > 0) {
      const addRes = await addTracksInChunks(token, existingId, rest)
      if (!addRes.ok) {
        return { success: false, error: formatSpotifyError(addRes.error, addRes.status) }
      }
    }
    playlistId = existingId
  } else {
    const createRes = await spotifyFetch<{ id: string }>(
      token,
      `/users/${userId}/playlists`,
      {
        method: "POST",
        body: JSON.stringify({
          name: playlistName,
          public: true,
          description,
        }),
      }
    )
    if (!createRes.ok) {
      return { success: false, error: formatSpotifyError(createRes.error, createRes.status) }
    }
    playlistId = createRes.data!.id

    const addRes = await addTracksInChunks(token, playlistId, trackUris)
    if (!addRes.ok) {
      return { success: false, error: formatSpotifyError(addRes.error, addRes.status) }
    }
  }

  return {
    success: true,
    playlistUrl: `https://open.spotify.com/playlist/${playlistId}`,
  }
}

async function findMoodTunePlaylist(
  token: string,
  _userId: string
): Promise<string | null> {
  let offset = 0
  const limit = 50

  while (true) {
    const res = await spotifyFetch<{
      items: Array<{ id: string; name: string }>;
    }>(token, `/me/playlists?limit=${limit}&offset=${offset}`)

    if (!res.ok || !res.data) return null

    const found = res.data.items.find((p) => p.name.startsWith(PLAYLIST_NAME))
    if (found) return found.id

    if (res.data.items.length < limit) break
    offset += limit
  }

  return null
}
