import {
  THEME_PREFERENCES,
  MOOD_TUNING_WEATHER_DISPLAY_MODES,
  AVAILABLE_GENRES,
  MAX_SELECTED_GENRES,
  type ThemePreference,
  type MoodTuningWeatherDisplayMode,
  type Genre,
} from "@/lib/constants"

export const isThemePreference = (value: unknown): value is ThemePreference => {
  return typeof value === "string" && THEME_PREFERENCES.includes(value as ThemePreference)
}

export const isMoodTuningWeatherDisplayMode = (value: unknown): value is MoodTuningWeatherDisplayMode => {
  return (
    typeof value === "string" &&
    MOOD_TUNING_WEATHER_DISPLAY_MODES.includes(value as MoodTuningWeatherDisplayMode)
  )
}

export const isBoolean = (value: unknown): value is boolean => typeof value === "boolean"

export function isValidGenreArray(value: unknown): value is Genre[] {
  if (!Array.isArray(value)) return false
  if (value.length === 0) return false
  if (value.length > MAX_SELECTED_GENRES) return false
  return value.every((v) => typeof v === "string" && AVAILABLE_GENRES.includes(v as Genre))
}
