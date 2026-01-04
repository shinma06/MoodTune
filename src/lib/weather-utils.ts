import {
  Cloud,
  CloudRain,
  Sun,
  CloudSnow,
  Wind,
  CloudDrizzle,
  CloudLightning,
  CloudFog,
  Tornado,
  type LucideIcon,
} from "lucide-react"

// 天候の種類に応じたアイコンのマッピング（各パターンに個別のアイコンを割り当て）
export function getWeatherIcon(weatherMain: string): LucideIcon {
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

