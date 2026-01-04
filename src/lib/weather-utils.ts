import {
  Cloud,
  CloudRain,
  Sun,
  Moon,
  CloudSnow,
  Wind,
  CloudDrizzle,
  CloudLightning,
  CloudFog,
  Tornado,
  type LucideIcon,
} from "lucide-react"
import type { TimeOfDay, WeatherType } from "./weather-background"

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
    Dust: Wind, // 砂塵
    Sand: Wind, // 砂
    Ash: CloudFog, // 灰（霧アイコンを使用）
    Squall: Wind, // スコール
    Tornado: Tornado, // 竜巻
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
    Dust: "#CD853F", // ペルー
    Sand: "#F5DEB3", // 小麦色
    Ash: "#696969", // ディムグレー
    Squall: "#5F9EA0", // カデットブルー
    Tornado: "#2F4F4F", // ダークスレートグレー
  }
  return themeColors[weatherType] || "#FFD700"
}

