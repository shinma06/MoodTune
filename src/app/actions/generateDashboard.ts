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

/**
 * フォールバック用のプレイリスト情報を生成
 */
function createFallbackPlaylistInfo(
  genres: Genre[],
  weatherLabel: string,
  timeLabel: string
): Array<{ genre: string; title: string; query: string }> {
  return genres.map((genre) => ({
    genre,
    title: `${weatherLabel}の${timeLabel}に聴く${genre}`,
    query: `${genre} ${weatherLabel} ${timeLabel}`,
  }))
}

/**
 * Spotify APIから画像を取得（通常モード）
 */
async function getSpotifyImage(
  spotifyClient: NonNullable<Awaited<ReturnType<typeof getSpotifyClient>>>,
  query: string
): Promise<string | null> {
  try {
    const response = await spotifyClient.searchTracks(query, { limit: 1 })
    const track = response.body.tracks?.items?.[0]
    return track?.album?.images?.[0]?.url || null
  } catch (error) {
    console.error("Failed to search Spotify tracks:", error)
    return null
  }
}

/**
 * AIを使用してジャンルごとのタイトルと検索クエリを生成
 */
async function generatePlaylistInfo(
  weather: WeatherType,
  time: TimeOfDay,
  genres: Genre[]
): Promise<Array<{ genre: string; title: string; query: string }>> {
  const weatherLabel = WEATHER_TYPE_LABELS[weather]
  const timeLabel = TIME_OF_DAY_LABELS[time]

  const prompt = `あなたは音楽プレイリストのキュレーターです。以下の条件に基づいて、各ジャンルに対するプレイリストのタイトルとSpotify検索クエリを生成してください。

条件:
- 天気: ${weatherLabel}
- 時間帯: ${timeLabel}
- ジャンル: ${genres.join(", ")}

各ジャンルに対して、以下のJSON形式で出力してください:
{
  "genre": "ジャンル名",
  "title": "プレイリストのタイトル（日本語、30文字以内）",
  "query": "Spotify検索クエリ（英語、アーティスト名や楽曲名を含む）"
}

出力はJSON配列形式で、各ジャンルごとに1つのオブジェクトを含めてください。`

  try {
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
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
 * ダッシュボードデータを生成
 * エラー時は空配列を返し、Server Action が常に正常レスポンスを返すようにする（クライアントの "unexpected response" を防ぐ）
 */
export async function generateDashboard(
  weather: WeatherType,
  time: TimeOfDay,
  selectedGenres: Genre[]
): Promise<DashboardItem[]> {
  try {
    const playlistInfos = await generatePlaylistInfo(weather, time, selectedGenres)
    const spotifyClient = USE_MOCK ? null : await getSpotifyClient()

    const dashboardItems: DashboardItem[] = await Promise.all(
      playlistInfos.map(async (info, index) => {
        let imageUrl = ""
        if (USE_MOCK || !spotifyClient) {
          imageUrl = getMockImageUrl(info.genre)
        } else {
          const spotifyImage = await getSpotifyImage(spotifyClient, info.query)
          imageUrl = spotifyImage || getMockImageUrl(info.genre)
        }

        return {
          id: `playlist-${index + 1}`,
          genre: info.genre,
          title: info.title,
          query: info.query,
          imageUrl,
        }
      })
    )

    return dashboardItems
  } catch (error) {
    console.error("Failed to generate dashboard:", error)
    return []
  }
}
