"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { getSpotifyClient } from "@/lib/spotify-server"
import { WEATHER_TYPE_LABELS, TIME_OF_DAY_LABELS, type Genre } from "@/lib/constants"
import type { WeatherType, TimeOfDay } from "@/lib/weather-background"
import type { DashboardItem } from "@/types/dashboard"

export type { DashboardItem }

/** Spotify 未連携時は true。明示的に "false" でない限りモック画像を使用 */
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_SPOTIFY !== "false"

/**
 * ジャンル名に基づいてモック画像URLを生成
 */
function getMockImageUrl(genre: string): string {
  const genreHash = genre
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return `https://picsum.photos/seed/${genreHash}/400/400`
}

type TrackCandidate = { artist: string; title: string }
type PlaylistInfo = {
  genre: string
  title: string
  tracks: TrackCandidate[]
}

/**
 * フォールバック用のプレイリスト情報を生成
 */
function createFallbackPlaylistInfo(
  genres: Genre[],
  weatherLabel: string,
  timeLabel: string
): PlaylistInfo[] {
  return genres.map((genre) => ({
    genre,
    title: `${weatherLabel}の${timeLabel}に聴く${genre}`,
    tracks: [],
  }))
}

/**
 * AIを使用してジャンルごとのタイトルと楽曲候補リストを生成
 */
async function generatePlaylistInfo(
  weather: WeatherType,
  time: TimeOfDay,
  genres: Genre[]
): Promise<PlaylistInfo[]> {
  const weatherLabel = WEATHER_TYPE_LABELS[weather]
  const timeLabel = TIME_OF_DAY_LABELS[time]

  const prompt = `あなたは音楽プレイリストのキュレーターです。以下の条件に基づいて、各ジャンルに対するプレイリストのタイトルと楽曲リストを生成してください。

条件:
- 天気: ${weatherLabel}
- 時間帯: ${timeLabel}
- ジャンル: ${genres.join(", ")}

各ジャンルに対して、以下のJSON形式で出力してください:
{
  "genre": "ジャンル名",
  "title": "プレイリストのタイトル（日本語、30文字以内）",
  "tracks": [
    { "artist": "アーティスト名（英語表記）", "title": "曲名（英語表記）" }
  ]
}

tracksには各ジャンルの雰囲気・天気・時間帯に合った楽曲を15曲リストアップしてください。
実際にSpotifyに存在する楽曲・アーティストを選んでください。
出力はJSON配列形式で、各ジャンルごとに1つのオブジェクトを含めてください。`

  try {
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
    })

    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return Array.isArray(parsed) ? parsed : [parsed]
    }
    return createFallbackPlaylistInfo(genres, weatherLabel, timeLabel)
  } catch (error) {
    console.error("Failed to generate playlist info:", error)
    return createFallbackPlaylistInfo(genres, weatherLabel, timeLabel)
  }
}

/**
 * 1曲分のSpotify track URI と アルバム画像URLを取得
 */
async function searchTrack(
  spotifyClient: NonNullable<Awaited<ReturnType<typeof getSpotifyClient>>>,
  artist: string,
  title: string
): Promise<{ uri: string; imageUrl: string | null } | null> {
  try {
    const query = `artist:${artist} track:${title}`
    const response = await spotifyClient.searchTracks(query, { limit: 1 })
    const track = response.body.tracks?.items?.[0]
    if (!track) return null
    return {
      uri: track.uri,
      imageUrl: track.album?.images?.[0]?.url ?? null,
    }
  } catch {
    return null
  }
}

/**
 * ダッシュボードデータを生成
 * エラー時は空配列を返し、Server Action が常に正常レスポンスを返すようにする（クライアントの "unexpected response" を防ぐ）
 */
export async function generateDashboard(
  weather: WeatherType,
  time: TimeOfDay,
  selectedGenres: Genre[]
): Promise<DashboardItem[]> {
  if (!Array.isArray(selectedGenres) || selectedGenres.length === 0) {
    return []
  }

  try {
    let playlistInfos: PlaylistInfo[]
    try {
      playlistInfos = await generatePlaylistInfo(weather, time, selectedGenres)
    } catch {
      playlistInfos = createFallbackPlaylistInfo(
        selectedGenres,
        WEATHER_TYPE_LABELS[weather] ?? "晴れ",
        TIME_OF_DAY_LABELS[time] ?? "昼"
      )
    }
    if (!Array.isArray(playlistInfos) || playlistInfos.length === 0) {
      return []
    }

    let spotifyClient: Awaited<ReturnType<typeof getSpotifyClient>> = null
    if (!USE_MOCK) {
      try {
        spotifyClient = await getSpotifyClient()
      } catch {
        spotifyClient = null
      }
    }

    const dashboardItems: DashboardItem[] = await Promise.all(
      playlistInfos.map(async (info, index) => {
        let imageUrl = getMockImageUrl(info?.genre ?? "")
        let trackUris: string[] = []

        if (!USE_MOCK && spotifyClient && Array.isArray(info.tracks) && info.tracks.length > 0) {
          // 全楽曲を並列検索
          const results = await Promise.all(
            info.tracks.map((t) => searchTrack(spotifyClient!, t.artist, t.title))
          )

          for (const result of results) {
            if (result) trackUris.push(result.uri)
          }

          // 先頭曲のジャケ写をカード画像として使用
          const firstImage = results.find((r) => r?.imageUrl)?.imageUrl
          if (firstImage) imageUrl = firstImage
        }

        return {
          id: `playlist-${index + 1}`,
          genre: String(info?.genre ?? ""),
          title: String(info?.title ?? ""),
          imageUrl,
          trackUris,
        }
      })
    )

    return dashboardItems
  } catch (error) {
    console.error("Failed to generate dashboard:", error)
    return []
  }
}
