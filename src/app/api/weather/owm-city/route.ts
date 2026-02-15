import { NextRequest, NextResponse } from "next/server"
import { parseLatLon } from "@/lib/parse-lat-lon"

/**
 * OpenWeatherMap のみを呼び、都市名(name)だけを返す。
 * Geocoding 失敗かつ天気が WxTech のとき、都市名フォールバック用にクライアントから呼ぶ。
 * GET /api/weather/owm-city?lat=&lon=
 */
export async function GET(request: NextRequest) {
  try {
    const parsed = parseLatLon(request.nextUrl.searchParams)
    if (!parsed.ok) {
      return NextResponse.json({ error: "無効な緯度経度です" }, { status: 400 })
    }
    const { lat: latNum, lon: lonNum } = parsed
    const lat = String(latNum)
    const lon = String(lonNum)

    const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenWeatherMap APIキーが設定されていません" },
        { status: 500 }
      )
    }

    const apiUrl = new URL("https://api.openweathermap.org/data/2.5/weather")
    apiUrl.searchParams.set("lat", lat)
    apiUrl.searchParams.set("lon", lon)
    apiUrl.searchParams.set("appid", apiKey)
    apiUrl.searchParams.set("units", "metric")
    apiUrl.searchParams.set("lang", "ja")

    const response = await fetch(apiUrl.toString(), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: "都市情報の取得に失敗しました", details: err.message },
        { status: response.status }
      )
    }

    const data = (await response.json()) as { name?: string }
    const name = typeof data.name === "string" ? data.name : ""
    return NextResponse.json({ name }, { status: 200 })
  } catch (error) {
    console.error("[Weather API] owm-city error:", error)
    return NextResponse.json(
      {
        error: "サーバーエラーが発生しました",
        details: error instanceof Error ? error.message : "不明なエラー",
      },
      { status: 500 }
    )
  }
}
