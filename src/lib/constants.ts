import type { WeatherType, TimeOfDay } from "./weather-background"

/** ジャンルごとのレコード・ページネーション用テーマカラー */
export type GenreThemeColors = { vinylColor: string; accentColor: string }

/**
 * ジャンル定義の単一ソース（保守性のためここだけ編集すればよい）
 * - id: アプリ内で一意のジャンルID（表示・API・ストレージで使用）
 * - themeColors: レコード・ページネーションのテーマカラー
 */
const GENRE_DEFINITIONS = [
  { id: "J-POP" as const, themeColors: { vinylColor: "from-rose-400 via-pink-600 to-rose-900", accentColor: "#e11d48" } },
  { id: "J-Rock" as const, themeColors: { vinylColor: "from-red-400 via-rose-600 to-red-950", accentColor: "#b91c1c" } },
  { id: "J-HipHop" as const, themeColors: { vinylColor: "from-amber-400 via-orange-600 to-amber-900", accentColor: "#d97706" } },
  { id: "Hip Hop" as const, themeColors: { vinylColor: "from-violet-500 via-purple-600 to-violet-800", accentColor: "#7c3aed" } },
  { id: "Lo-fi Hip Hop" as const, themeColors: { vinylColor: "from-amber-500 via-orange-700 to-amber-950", accentColor: "#b45309" } },
  { id: "City Pop" as const, themeColors: { vinylColor: "from-cyan-600 to-fuchsia-700", accentColor: "#0891b2" } },
  { id: "R&B" as const, themeColors: { vinylColor: "from-indigo-300 via-violet-600 to-indigo-900", accentColor: "#4f46e5" } },
  { id: "J-R&B" as const, themeColors: { vinylColor: "from-violet-400 via-fuchsia-600 to-violet-900", accentColor: "#7c3aed" } },
  { id: "Anime Song" as const, themeColors: { vinylColor: "from-sky-300 via-indigo-500 to-sky-800", accentColor: "#0ea5e9" } },
  { id: "Vocaloid" as const, themeColors: { vinylColor: "from-teal-300 via-cyan-500 to-teal-800", accentColor: "#14b8a6" } },
  { id: "Idol Pop" as const, themeColors: { vinylColor: "from-pink-300 via-rose-500 to-pink-700", accentColor: "#ec4899" } },
  { id: "K-POP (Boy)" as const, themeColors: { vinylColor: "from-indigo-600 via-slate-500 to-indigo-900", accentColor: "#6366f1" } },
  { id: "K-POP (Girl)" as const, themeColors: { vinylColor: "from-pink-300 via-sky-400 to-rose-600", accentColor: "#db2777" } },
  { id: "EDM" as const, themeColors: { vinylColor: "from-lime-300 via-emerald-500 to-lime-700", accentColor: "#65a30d" } },
  { id: "House" as const, themeColors: { vinylColor: "from-orange-400 via-red-500 to-orange-800", accentColor: "#ea580c" } },
  { id: "Techno" as const, themeColors: { vinylColor: "from-slate-500 via-violet-600 to-slate-800", accentColor: "#7c3aed" } },
  { id: "Acoustic" as const, themeColors: { vinylColor: "from-amber-400 via-yellow-500 to-amber-700", accentColor: "#ca8a04" } },
  { id: "Jazz" as const, themeColors: { vinylColor: "from-amber-500 via-rose-600 to-amber-900", accentColor: "#b45309" } },
  { id: "Piano" as const, themeColors: { vinylColor: "from-emerald-300 via-teal-600 to-emerald-900", accentColor: "#047857" } },
  { id: "Chill Out" as const, themeColors: { vinylColor: "from-teal-300 via-cyan-500 to-teal-800", accentColor: "#0d9488" } },
  { id: "City Jazz" as const, themeColors: { vinylColor: "from-blue-300 via-indigo-600 to-blue-900", accentColor: "#2563eb" } },
] as const

/** 利用可能な音楽ジャンル一覧（GENRE_DEFINITIONS から導出） */
export const AVAILABLE_GENRES = GENRE_DEFINITIONS.map((g) => g.id)

export type Genre = (typeof GENRE_DEFINITIONS)[number]["id"]

/** ジャンルごとのテーマカラー（GENRE_DEFINITIONS から導出） */
export const GENRE_THEME_COLORS: Record<Genre, GenreThemeColors> = Object.fromEntries(
  GENRE_DEFINITIONS.map((g) => [g.id, g.themeColors])
) as Record<Genre, GenreThemeColors>

// ユーザーが選択できる最大ジャンル数
export const MAX_SELECTED_GENRES = 8

// ジャンル選択のlocalStorageキー
export const GENRE_STORAGE_KEY = "selected-genres"

// デフォルトで選択されているジャンル（初回アクセス時）
export const DEFAULT_SELECTED_GENRES: Genre[] = [
  "J-POP",
  "J-Rock",
  "Hip Hop",
  "City Pop",
  "K-POP (Girl)",
]

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

// 時間帯オプション（label: 1行表示用、timeRange: 2行表示の2行目用）
export const TIME_OF_DAY_OPTIONS: { value: TimeOfDay; label: string; timeRange: string }[] = [
  { value: "dawn", label: "朝 (6-9時)", timeRange: "6~9時" },
  { value: "day", label: "昼 (9-17時)", timeRange: "9~17時" },
  { value: "dusk", label: "夕方 (17-19時)", timeRange: "17~19時" },
  { value: "night", label: "夜 (19-6時)", timeRange: "19~6時" },
]

// 時間帯の日本語表記
export const TIME_OF_DAY_LABELS: Record<TimeOfDay, string> = {
  dawn: "朝",
  day: "昼",
  dusk: "夕方",
  night: "夜",
}

const DEFAULT_THEME_COLORS: GenreThemeColors = {
  vinylColor: "from-slate-500 via-slate-600 to-slate-800",
  accentColor: "#64748b",
}

/** 現実の一般的なレコードの色（構築中・空のときのレコード表示用） */
export const REALISTIC_VINYL_THEME: GenreThemeColors = {
  vinylColor: "from-neutral-800 to-neutral-950",
  accentColor: "#525252",
}

/** ジャンル名からテーマカラーを取得（未定義はデフォルト） */
export function getGenreThemeColors(genre: string): GenreThemeColors {
  if (genre in GENRE_THEME_COLORS) {
    return GENRE_THEME_COLORS[genre as Genre]
  }
  return DEFAULT_THEME_COLORS
}
