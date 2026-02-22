"use server"

import { spotifyFetch } from "@/lib/spotify-api"
import { getSession } from "@/lib/spotify-session"
import { logServerError, logServerWarn } from "@/lib/server-log"

const LOG_TAG = "SaveToSpotify"

const PLAYLIST_NAME = "MoodTune"
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

/** Add tracks in chunks (Spotify allows max 100 per request). */
async function addTracksInChunks(
  token: string,
  playlistId: string,
  uris: string[]
): Promise<{ ok: boolean; status: number; error?: string }> {
  for (let i = 0; i < uris.length; i += MAX_TRACKS_PER_REQUEST) {
    const chunk = uris.slice(i, i + MAX_TRACKS_PER_REQUEST)
    const res = await spotifyFetch(token, `/playlists/${playlistId}/items`, {
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
    logServerWarn(LOG_TAG, "save_to_spotify", "No track URIs provided", { title })
    return { success: false, error: "再生できる楽曲がありません" }
  }

  let session
  try {
    session = await getSession()
  } catch (e) {
    logServerError(LOG_TAG, "get_session", e, { title })
    return { success: false, error: "セッションの取得に失敗しました" }
  }
  if (!session) {
    logServerWarn(LOG_TAG, "save_to_spotify", "User not logged in", { title })
    return { success: false, error: "Spotifyにログインしてください" }
  }

  const token = session.accessToken

  const existingId = await findMoodTunePlaylist(token)
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
      logServerWarn(LOG_TAG, "update_playlist", updateRes.error ?? "unknown", {
        playlistId: existingId,
        status: updateRes.status,
      })
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
      logServerWarn(LOG_TAG, "replace_playlist_items", replaceRes.error ?? "unknown", {
        playlistId: existingId,
        status: replaceRes.status,
      })
      return { success: false, error: formatSpotifyError(replaceRes.error, replaceRes.status) }
    }
    const rest = trackUris.slice(MAX_TRACKS_PER_REQUEST)
    if (rest.length > 0) {
      const addRes = await addTracksInChunks(token, existingId, rest)
      if (!addRes.ok) {
        logServerWarn(LOG_TAG, "add_tracks_chunks", addRes.error ?? "unknown", {
          playlistId: existingId,
          status: addRes.status,
        })
        return { success: false, error: formatSpotifyError(addRes.error, addRes.status) }
      }
    }
    playlistId = existingId
  } else {
    const createRes = await spotifyFetch<{ id: string }>(token, "/me/playlists", {
      method: "POST",
      body: JSON.stringify({
        name: playlistName,
        public: true,
        description,
      }),
    })
    if (!createRes.ok) {
      logServerWarn(LOG_TAG, "create_playlist", createRes.error ?? "unknown", {
        status: createRes.status,
        playlistName,
      })
      return { success: false, error: formatSpotifyError(createRes.error, createRes.status) }
    }
    playlistId = createRes.data!.id

    const addRes = await addTracksInChunks(token, playlistId, trackUris)
    if (!addRes.ok) {
      logServerWarn(LOG_TAG, "add_tracks_after_create", addRes.error ?? "unknown", {
        playlistId,
        status: addRes.status,
      })
      return { success: false, error: formatSpotifyError(addRes.error, addRes.status) }
    }
  }

  return {
    success: true,
    playlistUrl: `https://open.spotify.com/playlist/${playlistId}`,
  }
}

async function findMoodTunePlaylist(token: string): Promise<string | null> {
  let offset = 0
  const limit = 50

  while (true) {
    const res = await spotifyFetch<{
      items: Array<{ id: string; name: string }>;
    }>(token, `/me/playlists?limit=${limit}&offset=${offset}`)

    if (!res.ok || !res.data) {
      logServerWarn(LOG_TAG, "find_playlist_fetch", res.error ?? `HTTP ${res.status}`, {
        offset,
        status: res.status,
      })
      return null
    }

    const found = res.data.items.find((p) => p.name.startsWith(PLAYLIST_NAME))
    if (found) return found.id

    if (res.data.items.length < limit) break
    offset += limit
  }

  return null
}
