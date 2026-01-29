import type { WeatherApiResponse, WeatherData } from "@/types/weather"
import { getWeatherIcon, normalizeWeatherType } from "./weather-utils"

/** 緯度・経度から天気APIを叩き、正規化した天気データを返す */
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

