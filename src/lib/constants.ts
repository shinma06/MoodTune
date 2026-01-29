import type { WeatherType, TimeOfDay } from "./weather-background"

/** ジャンルごとのレコード・ページネーション用テーマカラー */
export type GenreThemeColors = { vinylColor: string; accentColor: string }

/**
 * ジャンル定義の単一ソース（保守性のためここだけ編集すればよい）
 * - id: アプリ内で一意のジャンルID（表示・API・ストレージで使用）
 * - themeColors: レコード・ページネーションのテーマカラー
 */
const GENRE_DEFINITIONS = [
  { id: "J-POP" as const, themeColors: { vinylColor: "from-rose-500 to-pink-700", accentColor: "#e11d48" } },
  { id: "J-Rock" as const, themeColors: { vinylColor: "from-red-600 to-rose-900", accentColor: "#b91c1c" } },
  { id: "J-HipHop" as const, themeColors: { vinylColor: "from-amber-500 to-orange-800", accentColor: "#d97706" } },
  { id: "Hip Hop" as const, themeColors: { vinylColor: "from-violet-600 to-fuchsia-800", accentColor: "#7c3aed" } },
  { id: "Lo-fi Hip Hop" as const, themeColors: { vinylColor: "from-amber-600 to-orange-900", accentColor: "#b45309" } },
  { id: "City Pop" as const, themeColors: { vinylColor: "from-cyan-600 to-fuchsia-700", accentColor: "#0891b2" } },
  { id: "R&B" as const, themeColors: { vinylColor: "from-indigo-500 to-violet-700", accentColor: "#4f46e5" } },
  { id: "J-R&B" as const, themeColors: { vinylColor: "from-violet-500 to-fuchsia-700", accentColor: "#7c3aed" } },
  { id: "Anime Song" as const, themeColors: { vinylColor: "from-sky-400 to-indigo-600", accentColor: "#0ea5e9" } },
  { id: "Vocaloid" as const, themeColors: { vinylColor: "from-teal-400 to-cyan-600", accentColor: "#14b8a6" } },
  { id: "Idol Pop" as const, themeColors: { vinylColor: "from-pink-400 to-rose-600", accentColor: "#ec4899" } },
  { id: "K-POP (Boy Group)" as const, themeColors: { vinylColor: "from-slate-500 to-slate-800", accentColor: "#475569" } },
  { id: "K-POP (Girl Group)" as const, themeColors: { vinylColor: "from-pink-500 to-rose-700", accentColor: "#db2777" } },
  { id: "EDM" as const, themeColors: { vinylColor: "from-lime-400 to-emerald-600", accentColor: "#65a30d" } },
  { id: "House" as const, themeColors: { vinylColor: "from-orange-500 to-red-600", accentColor: "#ea580c" } },
  { id: "Techno" as const, themeColors: { vinylColor: "from-slate-500 to-zinc-700", accentColor: "#64748b" } },
  { id: "Acoustic" as const, themeColors: { vinylColor: "from-amber-500 to-yellow-600", accentColor: "#ca8a04" } },
  { id: "Jazz" as const, themeColors: { vinylColor: "from-amber-600 to-rose-800", accentColor: "#b45309" } },
  { id: "Piano" as const, themeColors: { vinylColor: "from-emerald-500 to-teal-700", accentColor: "#047857" } },
  { id: "Chill Out" as const, themeColors: { vinylColor: "from-teal-500 to-cyan-600", accentColor: "#0d9488" } },
  { id: "City Jazz" as const, themeColors: { vinylColor: "from-blue-500 to-indigo-700", accentColor: "#2563eb" } },
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
export const DEFAULT_SELECTED_GENRES: Genre[] = ["J-POP"]

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

// 時間帯の日本語表記
export const TIME_OF_DAY_LABELS: Record<TimeOfDay, string> = {
  dawn: "朝",
  day: "昼",
  dusk: "夕方",
  night: "夜",
}

const DEFAULT_THEME_COLORS: GenreThemeColors = {
  vinylColor: "from-slate-600 to-slate-800",
  accentColor: "#64748b",
}

/** 現実の一般的なレコードの色（生成中・空のときのレコード表示用） */
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
