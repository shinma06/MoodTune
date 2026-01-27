import type { WeatherType, TimeOfDay } from "./weather-background"

// 利用可能な音楽ジャンル一覧（日本でよく使われる表記）
export const AVAILABLE_GENRES = [
  "J-POP",
  "J-Rock",
  "J-HipHop", // 日本のヒップホップ
  "Hip Hop", // 海外のヒップホップ
  "Lo-fi Hip Hop",
  "City Pop",
  "R&B",
  "J-R&B",
  "Anime Song",
  "Vocaloid",
  "Idol Pop",
  "K-POP (Boy Group)",
  "K-POP (Girl Group)",
  "EDM",
  "House",
  "Techno",
  "Acoustic",
  "Jazz",
  "Piano",
  "Chill Out",
  "City Jazz",
] as const

export type Genre = (typeof AVAILABLE_GENRES)[number]

// ユーザーが選択できる最大ジャンル数
export const MAX_SELECTED_GENRES = 8

// 天気タイプの全リスト（日本の主要な気象に絞る）
export const WEATHER_TYPES: WeatherType[] = [
  "Clear",
  "Clouds",
  "Rain",
  "Drizzle",
  "Thunderstorm",
  "Snow",
  "Mist",
  "Fog",
  "Haze",
]

// 天気タイプの日本語表記
export const WEATHER_TYPE_LABELS: Record<WeatherType, string> = {
  Clear: "晴れ",
  Clouds: "曇り",
  Rain: "雨",
  Drizzle: "霧雨",
  Thunderstorm: "雷雨",
  Snow: "雪",
  Mist: "霧",
  Fog: "濃霧",
  Haze: "もや",
}

// 時間帯オプション
export const TIME_OF_DAY_OPTIONS: { value: TimeOfDay; label: string }[] = [
  { value: "dawn", label: "朝 (6-9時)" },
  { value: "day", label: "昼 (9-17時)" },
  { value: "dusk", label: "夕方 (17-19時)" },
  { value: "night", label: "夜 (19-6時)" },
]

