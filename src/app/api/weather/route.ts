import { NextRequest, NextResponse } from "next/server"
import { parseLatLon } from "@/lib/parse-lat-lon"
import { fetchWxTechWeather, fetchOpenWeatherMap } from "@/lib/weather-fetch"

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
