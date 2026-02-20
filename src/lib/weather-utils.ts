import {
  Cloud,
  CloudRain,
  Sun,
  Moon,
  CloudSnow,
  CloudDrizzle,
  CloudLightning,
  CloudFog,
  type LucideIcon,
} from "lucide-react"
import type { TimeOfDay, WeatherType } from "./weather-background"
import { WEATHER_TYPES } from "./constants"

/**
 * APIから取得した天気タイプを正規化（サポートされている天気タイプに変換）
 * 存在しない天気タイプの場合は"Clear"にフォールバック
 */
export function normalizeWeatherType(weatherMain: string | null | undefined): WeatherType {
  if (!weatherMain) {
    return "Clear"
  }
  if (WEATHER_TYPES.includes(weatherMain as WeatherType)) {
    return weatherMain as WeatherType
  }
  return "Clear"
}

/** 天気 → アイコン（静的なマッピング） */
const WEATHER_ICON_MAP: Record<string, LucideIcon> = {
  Clear: Sun,
  Clouds: Cloud,
  Rain: CloudRain,
  Drizzle: CloudDrizzle,
  Thunderstorm: CloudLightning,
  Snow: CloudSnow,
  Mist: CloudFog,
  Fog: CloudFog,
  Haze: CloudFog,
}

/** 天気タイプと時間帯に応じたアイコンを返す */
export function getWeatherIcon(
  weatherMain: string,
  timeOfDay?: TimeOfDay
): LucideIcon {
  if (weatherMain === "Clear" && timeOfDay === "night") {
    return Moon
  }
  return WEATHER_ICON_MAP[weatherMain] || Sun
}

/** 日時を表示用文字列にフォーマット */
export function formatDateTime(date: Date) {
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const day = date.getDate().toString().padStart(2, "0")
  const hours = date.getHours().toString().padStart(2, "0")
  const minutes = date.getMinutes().toString().padStart(2, "0")
  const weekdays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]
  const weekday = weekdays[date.getDay()]

  return {
    dateString: `${year}/${month}/${day}/${weekday}`,
    timeString: `${hours}:${minutes}`,
  }
}

/** 位置情報エラーのユーザー向けメッセージを返す */
export function getGeolocationErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "位置情報の許可が必要です"
    case error.POSITION_UNAVAILABLE:
      return "位置情報が利用できません"
    case error.TIMEOUT:
      return "位置情報の取得がタイムアウトしました"
    default:
      return "位置情報の取得に失敗しました"
  }
}

export const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
}

/** 天気 → アイコン用テーマカラー（light / dark 別、静的なマッピング） */
const WEATHER_THEME_COLORS: Record<WeatherType, { light: string; dark: string }> = {
  Clear:       { light: "#FFD700", dark: "#FFE55C" },
  Clouds:      { light: "#778899", dark: "#A0B0C0" },
  Rain:        { light: "#4682B4", dark: "#6BA3D4" },
  Drizzle:     { light: "#87CEEB", dark: "#A0D4F0" },
  Thunderstorm:{ light: "#1C1C1C", dark: "#FFD700" },
  Snow:        { light: "#6B8BA3", dark: "#E0F0FF" },
  Mist:        { light: "#5C5C5C", dark: "#E8E8E8" },
  Fog:         { light: "#4A4A4A", dark: "#D8D8D8" },
  Haze:        { light: "#606060", dark: "#F0F0F0" },
}

/**
 * 天気タイプごとのアイコン用テーマカラーを返す。
 * @param darkBackground true のとき暗い背景用の色を返す（視認性確保）。キャンバス上のテキスト・アイコンには isCanvasBackgroundDark、モーダル・パネル内には isOverlayThemeDark を渡す。
 */
export function getWeatherThemeColor(
  weatherType: WeatherType,
  timeOfDay?: TimeOfDay,
  darkBackground = false
): string {
  if (weatherType === "Clear" && timeOfDay === "night") {
    return darkBackground ? "#B0B0FF" : "#C0C0FF"
  }
  const colors = WEATHER_THEME_COLORS[weatherType]
  return colors ? (darkBackground ? colors.dark : colors.light) : (darkBackground ? "#FFE55C" : "#FFD700")
}

