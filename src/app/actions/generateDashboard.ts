"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { searchTracks, SPOTIFY_RATE_LIMIT_ERROR } from "@/lib/spotify-api"
import { getSession } from "@/lib/spotify-session"
import { getMockPlaylistInfo } from "@/lib/mock-playlist-data"
import { WEATHER_TYPE_LABELS, TIME_OF_DAY_LABELS, type Genre } from "@/lib/constants"
import type { WeatherType, TimeOfDay } from "@/lib/weather-background"
import type { DashboardItem } from "@/types/dashboard"
import { logServerError, logServerWarn } from "@/lib/server-log"

const LOG_TAG = "GenerateDashboard"

export type { DashboardItem }

/** generateDashboard の返却型。rateLimit が true のときは「リクエスト過多」メッセージを表示する */
export type GenerateDashboardResult = {
  playlists: DashboardItem[]
  rateLimit?: boolean
}

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
    logServerError(LOG_TAG, "generate_playlist_info", error, {
      weather,
      time,
      genres: genres.join(","),
    })
    return createFallbackPlaylistInfo(genres, weatherLabel, timeLabel)
  }
}

/** 1曲検索の結果。rateLimit のときは 429 を受けたことを示す */
type SearchTrackResult =
  | { uri: string; imageUrl: string | null }
  | null
  | { rateLimit: true }

/**
 * 1曲分のSpotify track URI と アルバム画像URLを取得。
 * 429 のときは { rateLimit: true } を返し、呼び出し元でメッセージ表示に使う。
 */
async function searchTrack(
  token: string,
  artist: string,
  title: string
): Promise<SearchTrackResult> {
  try {
    const query = `artist:${artist} track:${title}`
    const response = await searchTracks(token, query, { limit: 1 })
    if (response.status === 429 || response.error === SPOTIFY_RATE_LIMIT_ERROR) {
      return { rateLimit: true }
    }
    if (!response.ok || !response.data) return null
    const track = response.data.tracks?.items?.[0]
    if (!track) return null
    return {
      uri: track.uri,
      imageUrl: track.album?.images?.[0]?.url ?? null,
    }
  } catch (e) {
    logServerError(LOG_TAG, "search_track", e, { artist, title })
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
 * ダッシュボードデータを生成。
 * エラー時は playlists を空配列にして返し、Server Action が常に正常レスポンスを返すようにする（クライアントの "unexpected response" を防ぐ）。
 * 429 を検知した場合は rateLimit: true を付与し、クライアントで「リクエスト過多」メッセージを表示する。
 */
export async function generateDashboard(
  weather: WeatherType,
  time: TimeOfDay,
  selectedGenres: Genre[]
): Promise<GenerateDashboardResult> {
  const emptyResult = (rateLimit?: boolean): GenerateDashboardResult => ({
    playlists: [],
    ...(rateLimit && { rateLimit: true }),
  })

  if (!Array.isArray(selectedGenres) || selectedGenres.length === 0) {
    return emptyResult()
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
      } catch (e) {
        logServerError(LOG_TAG, "generate_playlist_info_fallback", e, {
          weather,
          time,
          genres: selectedGenres.join(","),
        })
        playlistInfos = createFallbackPlaylistInfo(selectedGenres, weatherLabel, timeLabel)
      }
    }

    if (!Array.isArray(playlistInfos) || playlistInfos.length === 0) {
      return emptyResult()
    }

    const token = session?.accessToken ?? null

    // レート制限(429)回避: ジャンルごとに直列、曲検索は同時2件まで
    const SPOTIFY_SEARCH_CONCURRENCY = 2
    const dashboardItems: DashboardItem[] = []
    let rateLimitHit = false

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
          if (result && "rateLimit" in result) {
            rateLimitHit = true
          } else if (result && "uri" in result) {
            trackUris.push(result.uri)
          }
        }

        const firstImage = results.find(
          (r): r is { uri: string; imageUrl: string | null } =>
            r != null && "uri" in r && "imageUrl" in r
        )?.imageUrl
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

    return { playlists: dashboardItems, ...(rateLimitHit && { rateLimit: true }) }
  } catch (error) {
    logServerError(LOG_TAG, "generate_dashboard", error, {
      weather,
      time,
      genresCount: selectedGenres?.length ?? 0,
    })
    return emptyResult()
  }
}
