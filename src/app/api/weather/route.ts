import { NextRequest, NextResponse } from "next/server"
import { parseLatLon } from "@/lib/parse-lat-lon"
import { isInJapan, wxCodeToWeatherType, WXTECH_API_BASE } from "@/lib/wxtech-weather"
import { WEATHER_TYPE_LABELS } from "@/lib/constants"
import type { WeatherType } from "@/lib/weather-background"

/** OpenWeatherMap 互換のレスポンス型（クライアントがそのまま利用） */
interface NormalizedWeatherResponse {
  main: { temp: number }
  weather: Array<{ main: string; description: string }>
  name: string
}

export async function GET(request: NextRequest) {
  try {
    const parsed = parseLatLon(request.nextUrl.searchParams)
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status })
    }
    const { lat: latNum, lon: lonNum } = parsed
    const lat = String(latNum)
    const lon = String(lonNum)

    const wxTechKey = process.env.WXTECH_API_KEY
    const owmKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY

    if (wxTechKey) {
      const result = await fetchWxTechWeather(wxTechKey, latNum, lonNum, lat, lon)
      if (result.normalized) {
        return NextResponse.json(result.normalized, { status: 200 })
      }
      console.error("[Weather API] WxTech fallback:", result.reason)
    }

    if (!owmKey) {
      return NextResponse.json(
        { error: "天気APIキーが設定されていません（WxTech または OpenWeatherMap）" },
        { status: 500 }
      )
    }

    const owmResponse = await fetchOpenWeatherMap(owmKey, lat, lon)
    if (!owmResponse.ok) {
      const errorData = await owmResponse.json().catch(() => ({}))
      return NextResponse.json(
        {
          error: "天気情報の取得に失敗しました",
          details: errorData.message || `HTTP ${owmResponse.status}`,
        },
        { status: owmResponse.status }
      )
    }
    const data = await owmResponse.json()
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("天気APIエラー:", error)
    return NextResponse.json(
      {
        error: "サーバーエラーが発生しました",
        details: error instanceof Error ? error.message : "不明なエラー",
      },
      { status: 500 }
    )
  }
}

type WxTechResult =
  | { normalized: NormalizedWeatherResponse; reason?: never }
  | { normalized?: never; reason: string }

function buildWxTechUrl(isJapan: boolean, lat: string, lon: string): string {
  const base = WXTECH_API_BASE.startsWith("http") ? WXTECH_API_BASE : `https://${WXTECH_API_BASE}`
  if (isJapan) {
    return `${base}/api/v1/ss1wx?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`
  }
  return `${base}/api/v2/global/wx?latlon=${encodeURIComponent(lat)}/${encodeURIComponent(lon)}`
}

async function fetchWxTechWeather(
  apiKey: string,
  latNum: number,
  lonNum: number,
  lat: string,
  lon: string
): Promise<WxTechResult> {
  const isJapan = isInJapan(latNum, lonNum)
  const url = buildWxTechUrl(isJapan, lat, lon)

  try {
    // 呼び出しはサーバー（API Route）からのみ。ブラウザ直叩きは CORS でブロックされる。
    // 認証: 仕様により X-API-Key / Authorization / クエリ api_key など要確認。
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
      return {
        reason: `HTTP ${response.status}: ${detail.slice(0, 200)}`,
      }
    }

    const body = await response.json().catch((e) => {
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

async function fetchOpenWeatherMap(apiKey: string, lat: string, lon: string): Promise<Response> {
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
