import type { WeatherType, TimeOfDay } from "./weather-background"

// 天気タイプの全リスト
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
  "Dust",
  "Sand",
  "Ash",
  "Squall",
  "Tornado",
]

// 時間帯オプション
export const TIME_OF_DAY_OPTIONS: { value: TimeOfDay; label: string }[] = [
  { value: "dawn", label: "朝 (6-9時)" },
  { value: "day", label: "昼 (9-17時)" },
  { value: "dusk", label: "夕方 (17-19時)" },
  { value: "night", label: "夜 (19-6時)" },
]

