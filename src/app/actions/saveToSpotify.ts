"use server"

import { getSpotifyClient } from "@/lib/spotify-server"

const PLAYLIST_NAME = "MoodTune"

export type SaveToSpotifyResult =
  | { success: true; playlistUrl: string }
  | { success: false; error: string }

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

  const spotifyClient = await getSpotifyClient()
  if (!spotifyClient) {
    return { success: false, error: "Spotifyにログインしてください" }
  }

  try {
    // ユーザーIDを取得
    const meResponse = await spotifyClient.getMe()
    const userId = meResponse.body.id

    // 既存の "MoodTune" プレイリストを検索
    const existingPlaylistId = await findMoodTunePlaylist(spotifyClient, userId)

    let playlistId: string

    if (existingPlaylistId) {
      // 既存プレイリストのタイトルと曲を上書き
      await spotifyClient.changePlaylistDetails(existingPlaylistId, {
        name: `${PLAYLIST_NAME}: ${title}`,
      })
      await spotifyClient.replaceTracksInPlaylist(existingPlaylistId, trackUris)
      playlistId = existingPlaylistId
    } else {
      // 新規プレイリスト作成 (v5 API: createPlaylist(name, options))
      const createResponse = await spotifyClient.createPlaylist(`${PLAYLIST_NAME}: ${title}`, {
        public: false,
        description: "MoodTuneが天気と時間帯に合わせて生成したプレイリスト",
      })
      playlistId = createResponse.body.id
      await spotifyClient.addTracksToPlaylist(playlistId, trackUris)
    }

    return {
      success: true,
      playlistUrl: `https://open.spotify.com/playlist/${playlistId}`,
    }
  } catch (error) {
    console.error("Failed to save to Spotify:", error)
    return { success: false, error: "Spotifyへの保存に失敗しました" }
  }
}

/**
 * ユーザーのプレイリスト一覧から "MoodTune" プレイリストを検索する
 */
async function findMoodTunePlaylist(
  spotifyClient: NonNullable<Awaited<ReturnType<typeof getSpotifyClient>>>,
  userId: string
): Promise<string | null> {
  try {
    let offset = 0
    const limit = 50

    while (true) {
      const response = await spotifyClient.getUserPlaylists(userId, { limit, offset })
      const playlists = response.body.items

      const found = playlists.find((p) => p.name.startsWith(PLAYLIST_NAME))
      if (found) return found.id

      if (playlists.length < limit) break
      offset += limit
    }

    return null
  } catch {
    return null
  }
}
