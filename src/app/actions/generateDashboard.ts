"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { getSpotifyClient } from "@/lib/spotify-server"
import { getSession } from "@/lib/spotify-session"
import { getMockPlaylistInfo } from "@/lib/mock-playlist-data"
import { WEATHER_TYPE_LABELS, TIME_OF_DAY_LABELS, type Genre } from "@/lib/constants"
import type { WeatherType, TimeOfDay } from "@/lib/weather-background"
import type { DashboardItem } from "@/types/dashboard"

export type { DashboardItem }

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
    // 2026年2月改定: GET /search の limit は最大10・デフォルト5。1件取得で問題なし。
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

/** 同時実行数を制限して Promise を実行（429 レート制限回避） */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let index = 0
  async function worker(): Promise<void> {
    while (index < items.length) {
      const i = index++
      results[i] = await fn(items[i], i)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()))
  return results
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
    const session = await getSession()
    const isLoggedIn = Boolean(session)
    let playlistInfos: PlaylistInfo[]
    const weatherLabel = WEATHER_TYPE_LABELS[weather] ?? "晴れ"
    const timeLabel = TIME_OF_DAY_LABELS[time] ?? "昼"

    if (!isLoggedIn) {
      playlistInfos = getMockPlaylistInfo(selectedGenres, weatherLabel, timeLabel)
    } else {
      try {
        playlistInfos = await generatePlaylistInfo(weather, time, selectedGenres)
      } catch {
        playlistInfos = createFallbackPlaylistInfo(selectedGenres, weatherLabel, timeLabel)
      }
    }

    if (!Array.isArray(playlistInfos) || playlistInfos.length === 0) {
      return []
    }

    let spotifyClient: Awaited<ReturnType<typeof getSpotifyClient>> = null
    if (isLoggedIn) {
      try {
        spotifyClient = await getSpotifyClient()
      } catch {
        spotifyClient = null
      }
    }

    // レート制限(429)回避: ジャンルごとに直列、曲検索は同時2件まで
    const SPOTIFY_SEARCH_CONCURRENCY = 2
    const dashboardItems: DashboardItem[] = []

    for (let index = 0; index < playlistInfos.length; index++) {
      const info = playlistInfos[index]
      let imageUrl = getMockImageUrl(info?.genre ?? "")
      let trackUris: string[] = []

      if (isLoggedIn && spotifyClient && Array.isArray(info.tracks) && info.tracks.length > 0) {
        const results = await mapWithConcurrency(
          info.tracks,
          SPOTIFY_SEARCH_CONCURRENCY,
          (t) => searchTrack(spotifyClient!, t.artist, t.title)
        )

        for (const result of results) {
          if (result) trackUris.push(result.uri)
        }

        const firstImage = results.find((r) => r?.imageUrl)?.imageUrl
        if (firstImage) imageUrl = firstImage
      }

      dashboardItems.push({
        id: `playlist-${index + 1}`,
        genre: String(info?.genre ?? ""),
        title: String(info?.title ?? ""),
        imageUrl,
        trackUris,
      })
    }

    return dashboardItems
  } catch (error) {
    console.error("Failed to generate dashboard:", error)
    return []
  }
}
