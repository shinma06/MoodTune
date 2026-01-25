import type { WeatherApiResponse, WeatherData } from "@/types/weather"
import { getWeatherIcon, normalizeWeatherType } from "./weather-utils"

// 天気APIからデータを取得
export async function fetchWeatherData(lat: number, lon: number): Promise<{
  weatherData: WeatherData
  weatherMain: string
}> {
  const response = await fetch(`/api/weather?lat=${lat}&lon=${lon}`)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || "天気情報の取得に失敗しました")
  }

  const data: WeatherApiResponse = await response.json()
  const rawWeatherMain = data.weather[0]?.main || "Clear"
  // 天気タイプを正規化（サポートされていない場合はClearにフォールバック）
  const weatherMain = normalizeWeatherType(rawWeatherMain)

  return {
    weatherData: {
      icon: getWeatherIcon(weatherMain),
      temp: `${Math.round(data.main.temp)}°C`,
      city: data.name,
      description: data.weather[0]?.description || "",
      weatherMain,
    },
    weatherMain,
  }
}

