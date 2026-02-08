import { NextRequest, NextResponse } from "next/server"

/**
 * OpenWeatherMap のみを呼び、都市名(name)だけを返す。
 * Geocoding 失敗かつ天気が WxTech のとき、都市名フォールバック用にクライアントから呼ぶ。
 * GET /api/weather/owm-city?lat=&lon=
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const lat = searchParams.get("lat")
    const lon = searchParams.get("lon")

    if (!lat || !lon) {
      return NextResponse.json(
        { error: "緯度(lat)と経度(lon)のパラメータが必要です" },
        { status: 400 }
      )
    }

    const latNum = parseFloat(lat)
    const lonNum = parseFloat(lon)
    if (isNaN(latNum) || isNaN(lonNum) || latNum < -90 || latNum > 90 || lonNum < -180 || lonNum > 180) {
      return NextResponse.json({ error: "無効な緯度経度です" }, { status: 400 })
    }

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
