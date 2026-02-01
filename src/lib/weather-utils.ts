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

/** 天気 → アイコン用テーマカラー（明るい背景用、静的なマッピング） */
const WEATHER_THEME_COLORS: Record<WeatherType, string> = {
  Clear: "#FFD700", // 金色（太陽）
  Clouds: "#778899", // スレートグレー
  Rain: "#4682B4", // スチールブルー
  Drizzle: "#87CEEB", // スカイブルー
  Thunderstorm: "#1C1C1C", // ほぼ黒
  Snow: "#F0F8FF", // アリスブルー
  Mist: "#D3D3D3", // ライトグレー
  Fog: "#C0C0C0", // シルバー
  Haze: "#E0E0E0", // ライトグレー
}

/** 天気 → アイコン用テーマカラー（暗い背景用、静的なマッピング） */
const WEATHER_THEME_COLORS_DARK: Record<WeatherType, string> = {
  Clear: "#FFE55C", // 明るい金色
  Clouds: "#A0B0C0", // 明るいスレートグレー
  Rain: "#6BA3D4", // 明るいスチールブルー
  Drizzle: "#A0D4F0", // 明るいスカイブルー
  Thunderstorm: "#FFD700", // 金色（雷の閃光）
  Snow: "#E0F0FF", // 明るいアリスブルー
  Mist: "#E8E8E8", // 明るいライトグレー
  Fog: "#D8D8D8", // 明るいシルバー
  Haze: "#F0F0F0", // 明るいライトグレー
}

/** 天気タイプごとのアイコン用テーマカラー */
export function getWeatherThemeColor(
  weatherType: WeatherType,
  timeOfDay?: TimeOfDay
): string {
  if (weatherType === "Clear" && timeOfDay === "night") {
    return "#C0C0FF" // 月（薄い青）
  }
  return WEATHER_THEME_COLORS[weatherType] || "#FFD700"
}

/** 暗い背景用の天気テーマカラー（視認性を確保しつつ雰囲気を維持） */
export function getWeatherThemeColorForDark(
  weatherType: WeatherType,
  timeOfDay?: TimeOfDay
): string {
  if (weatherType === "Clear" && timeOfDay === "night") {
    return "#B0B0FF" // 月（明るい青）
  }
  return WEATHER_THEME_COLORS_DARK[weatherType] || "#FFE55C"
}

