import type { WeatherApiResponse, WeatherData } from "@/types/weather"
import { normalizeWeatherType } from "./weather-utils"

/** 緯度・経度から天気APIとGeocoding APIを並列で叩き、正規化した天気データを返す。都市名はGoogle Geocodingで取得。 */
export async function fetchWeatherData(lat: number, lon: number): Promise<{
  weatherData: WeatherData
  weatherMain: string
}> {
  const [weatherRes, geocodeRes] = await Promise.all([
    fetch(`/api/weather?lat=${lat}&lon=${lon}`),
    fetch(`/api/geocode?lat=${lat}&lon=${lon}`),
  ])

  if (!weatherRes.ok) {
    const errorData = await weatherRes.json().catch(() => ({}))
    throw new Error(errorData.error || "天気情報の取得に失敗しました")
  }

  const data: WeatherApiResponse = await weatherRes.json()
  const rawWeatherMain = data.weather[0]?.main || "Clear"
  const weatherMain = normalizeWeatherType(rawWeatherMain)

  let city = data.name
  const geocodeBody = await geocodeRes.json().catch(() => ({}))
  if (geocodeRes.ok && geocodeBody.city) {
    city = geocodeBody.city
  }
  if (!city) {
    const owmCityRes = await fetch(`/api/weather/owm-city?lat=${lat}&lon=${lon}`).catch(() => null)
    if (owmCityRes?.ok) {
      const owmCity = await owmCityRes.json().catch(() => ({}))
      if (owmCity.name) city = owmCity.name
    }
  }

  return {
    weatherData: {
      temp: `${Math.round(data.main.temp)}°C`,
      city,
      description: data.weather[0]?.description || "",
      weatherMain,
    },
    weatherMain,
  }
}
