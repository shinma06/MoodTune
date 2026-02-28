"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { spotifyFetch, getAccessToken } from "@/lib/spotify-server"
import { getMockPlaylistInfo } from "@/lib/mock-playlist-data"
import { WEATHER_TYPE_LABELS, TIME_OF_DAY_LABELS, type Genre } from "@/lib/constants"
import type { WeatherType, TimeOfDay } from "@/lib/weather-background"
import type { DashboardItem } from "@/types/dashboard"

export type { DashboardItem }

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

function createFallbackPlaylistInfo(
  genres: Genre[],
  weatherLabel: string,
  timeLabel: string
): PlaylistInfo[] {
  return getMockPlaylistInfo(genres, weatherLabel, timeLabel).map((info) => ({
    ...info,
    tracks: (info.tracks ?? []).slice(0, 10),
  }))
}

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

tracksには各ジャンルの雰囲気・天気・時間帯に合った楽曲を10曲リストアップしてください。
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
      const list = Array.isArray(parsed) ? parsed : [parsed]
      return list.map((p: PlaylistInfo) => ({
        ...p,
        tracks: (p.tracks ?? []).slice(0, 10),
      }))
    }
    return createFallbackPlaylistInfo(genres, weatherLabel, timeLabel)
  } catch (error) {
    console.error("Failed to generate playlist info:", error)
    return createFallbackPlaylistInfo(genres, weatherLabel, timeLabel)
  }
}

type SpotifyTrack = {
  uri: string
  album?: { images?: Array<{ url: string }> }
}
type SpotifySearchResult = {
  tracks?: { items?: SpotifyTrack[] }
}

async function searchTrack(
  token: string,
  artist: string,
  title: string
): Promise<{ uri: string; imageUrl: string | null } | null> {
  const query = encodeURIComponent(`artist:${artist} track:${title}`)
  const res = await spotifyFetch<SpotifySearchResult>(
    token,
    `/search?type=track&q=${query}&limit=1`
  )
  if (!res.ok) return null
  const track = res.data.tracks?.items?.[0]
  if (!track) return null
  return {
    uri: track.uri,
    imageUrl: track.album?.images?.[0]?.url ?? null,
  }
}

/** Concurrency limiter to avoid Spotify 429 rate limits. */
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
 * エラー時は空配列を返し、Server Action が常に正常レスポンスを返すようにする
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
    const token = await getAccessToken()
    const isLoggedIn = Boolean(token)
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

    const SPOTIFY_SEARCH_CONCURRENCY = 2
    const dashboardItems: DashboardItem[] = []

    for (let index = 0; index < playlistInfos.length; index++) {
      const info = playlistInfos[index]
      let imageUrl = getMockImageUrl(info?.genre ?? "")
      let trackUris: string[] = []

      if (isLoggedIn && token && Array.isArray(info.tracks) && info.tracks.length > 0) {
        const results = await mapWithConcurrency(
          info.tracks,
          SPOTIFY_SEARCH_CONCURRENCY,
          (t) => searchTrack(token, t.artist, t.title)
        )

        for (const result of results) {
          if (result && trackUris.length < 8) trackUris.push(result.uri)
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
