import type { LucideIcon } from "lucide-react"

// OpenWeatherMap APIレスポンスの型定義
export interface WeatherApiResponse {
  main: {
    temp: number
    feels_like: number
    temp_min: number
    temp_max: number
    pressure: number
    humidity: number
  }
  name: string
  weather: Array<{
    id: number
    main: string
    description: string
    icon: string
  }>
  coord: {
    lat: number
    lon: number
  }
}

// 天気データの型定義
export interface WeatherData {
  icon: LucideIcon
  temp: string
  city: string
  description: string
  weatherMain: string // 天気タイプ（アイコンを動的に取得するために必要）
}

// 天気状態の型定義
export type WeatherState =
  | { status: "loading"; message: string }
  | { status: "error"; message: string }
  | { status: "success"; data: WeatherData }

