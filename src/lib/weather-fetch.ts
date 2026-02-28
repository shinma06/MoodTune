import { isInJapan, wxCodeToWeatherType, WXTECH_API_BASE } from "@/lib/wxtech-weather"
import { WEATHER_TYPE_LABELS } from "@/lib/constants"
import type { WeatherType } from "@/lib/weather-background"

/** OWM-compatible response structure used by the client */
export interface NormalizedWeatherResponse {
  main: { temp: number }
  weather: Array<{ main: string; description: string }>
  name: string
}

export type WxTechResult =
  | { normalized: NormalizedWeatherResponse; reason?: never }
  | { normalized?: never; reason: string }

function buildWxTechUrl(isJapan: boolean, lat: string, lon: string): string {
  const base = WXTECH_API_BASE.startsWith("http") ? WXTECH_API_BASE : `https://${WXTECH_API_BASE}`
  if (isJapan) {
    return `${base}/api/v1/ss1wx?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`
  }
  return `${base}/api/v2/global/wx?latlon=${encodeURIComponent(lat)}/${encodeURIComponent(lon)}`
}

export async function fetchWxTechWeather(
  apiKey: string,
  latNum: number,
  lonNum: number,
  lat: string,
  lon: string
): Promise<WxTechResult> {
  const isJapan = isInJapan(latNum, lonNum)
  const url = buildWxTechUrl(isJapan, lat, lon)

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const text = await response.text()
      let detail = text
      try {
        const j = JSON.parse(text)
        detail = j.message ?? j.error ?? text
      } catch {
        // use raw text
      }
      return { reason: `HTTP ${response.status}: ${detail.slice(0, 200)}` }
    }

    const body = await response.json().catch((e: unknown) => {
      throw new Error(`JSON parse: ${e instanceof Error ? e.message : String(e)}`)
    })

    const wxdata = body.wxdata
    if (!Array.isArray(wxdata) || wxdata.length === 0) {
      return { reason: "wxdata missing or empty" }
    }
    const srf = wxdata[0].srf
    if (!Array.isArray(srf) || srf.length === 0) {
      return { reason: "srf missing or empty" }
    }

    const first = srf[0]
    const wx = typeof first.wx === "number" ? first.wx : 100
    const temp = typeof first.temp === "number" ? first.temp : 0
    const weatherType = wxCodeToWeatherType(wx) as WeatherType
    const main = weatherType
    const description = WEATHER_TYPE_LABELS[weatherType] ?? ""

    return {
      normalized: {
        main: { temp },
        weather: [{ main, description }],
        name: "",
      },
    }
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e))
    const msg = err.message
    const cause = err.cause != null ? String(err.cause) : ""
    return { reason: cause ? `${msg} (cause: ${cause})` : msg }
  }
}

export async function fetchOpenWeatherMap(apiKey: string, lat: string, lon: string): Promise<Response> {
  const apiUrl = new URL("https://api.openweathermap.org/data/2.5/weather")
  apiUrl.searchParams.set("lat", lat)
  apiUrl.searchParams.set("lon", lon)
  apiUrl.searchParams.set("appid", apiKey)
  apiUrl.searchParams.set("units", "metric")
  apiUrl.searchParams.set("lang", "ja")

  return fetch(apiUrl.toString(), {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  })
}
