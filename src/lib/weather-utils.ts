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
export function normalizeWeatherType(weatherMain: string): WeatherType {
  // サポートされている天気タイプかチェック
  if (WEATHER_TYPES.includes(weatherMain as WeatherType)) {
    return weatherMain as WeatherType
  }
  // 存在しない場合はClearにフォールバック
  return "Clear"
}

// 天候の種類に応じたアイコンのマッピング（各パターンに個別のアイコンを割り当て）
export function getWeatherIcon(
  weatherMain: string,
  timeOfDay?: TimeOfDay
): LucideIcon {
  // Clearかつ夜の場合は月を表示
  if (weatherMain === "Clear" && timeOfDay === "night") {
    return Moon
  }

  const iconMap: Record<string, LucideIcon> = {
    Clear: Sun, // 晴れ
    Clouds: Cloud, // 曇り
    Rain: CloudRain, // 雨
    Drizzle: CloudDrizzle, // 霧雨
    Thunderstorm: CloudLightning, // 雷雨
    Snow: CloudSnow, // 雪
    Mist: CloudFog, // 霧
    Fog: CloudFog, // 濃霧
    Haze: CloudFog, // もや
  }
  return iconMap[weatherMain] || Sun
}

// 日時フォーマット関数
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

// 位置情報エラーメッセージの取得
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

// 位置情報取得のオプション
export const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
}

// 天気タイプごとのテーマカラー
export function getWeatherThemeColor(
  weatherType: WeatherType,
  timeOfDay?: TimeOfDay
): string {
  // Clearかつ夜の場合は月の色（シルバー/薄い青）
  if (weatherType === "Clear" && timeOfDay === "night") {
    return "#C0C0FF" // 薄い青（月）
  }

  const themeColors: Record<WeatherType, string> = {
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
  return themeColors[weatherType] || "#FFD700"
}

/**
 * 暗い背景用の天気テーマカラー（視認性を確保しつつ雰囲気を維持）
 */
export function getWeatherThemeColorForDark(
  weatherType: WeatherType,
  timeOfDay?: TimeOfDay
): string {
  // Clearかつ夜の場合は月の色（明るめの青）
  if (weatherType === "Clear" && timeOfDay === "night") {
    return "#B0B0FF" // 明るい青（月）
  }

  const darkThemeColors: Record<WeatherType, string> = {
    Clear: "#FFE55C", // 明るい金色（太陽の雰囲気を維持）
    Clouds: "#A0B0C0", // 明るいスレートグレー
    Rain: "#6BA3D4", // 明るいスチールブルー（雨の雰囲気）
    Drizzle: "#A0D4F0", // 明るいスカイブルー
    Thunderstorm: "#FFD700", // 金色（雷の閃光をイメージ）
    Snow: "#E0F0FF", // 明るいアリスブルー（雪の雰囲気）
    Mist: "#E8E8E8", // 明るいライトグレー
    Fog: "#D8D8D8", // 明るいシルバー
    Haze: "#F0F0F0", // 明るいライトグレー
  }
  return darkThemeColors[weatherType] || "#FFE55C"
}

