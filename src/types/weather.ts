/** OpenWeatherMap API のレスポンス型 */
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

/** UI表示用の天気データ */
export interface WeatherData {
  temp: string
  city: string
  description: string
  weatherMain: string
}

/** 天気取得の状態（ローディング / エラー / 成功） */
export type WeatherState =
  | { status: "loading"; message: string }
  | { status: "error"; message: string }
  | { status: "success"; data: WeatherData }

