import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const lat = searchParams.get("lat")
    const lon = searchParams.get("lon")

    // パラメータのバリデーション
    if (!lat || !lon) {
      return NextResponse.json(
        { error: "緯度(lat)と経度(lon)のパラメータが必要です" },
        { status: 400 }
      )
    }

    const latNum = parseFloat(lat)
    const lonNum = parseFloat(lon)

    // 数値のバリデーション
    if (isNaN(latNum) || isNaN(lonNum)) {
      return NextResponse.json(
        { error: "緯度(lat)と経度(lon)は数値である必要があります" },
        { status: 400 }
      )
    }

    // 緯度・経度の範囲チェック
    if (latNum < -90 || latNum > 90) {
      return NextResponse.json(
        { error: "緯度は-90から90の範囲である必要があります" },
        { status: 400 }
      )
    }

    if (lonNum < -180 || lonNum > 180) {
      return NextResponse.json(
        { error: "経度は-180から180の範囲である必要があります" },
        { status: 400 }
      )
    }

    // APIキーの確認
    const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "天気APIキーが設定されていません" },
        { status: 500 }
      )
    }

    // OpenWeatherMap APIを呼び出し
    const apiUrl = new URL("https://api.openweathermap.org/data/2.5/weather")
    apiUrl.searchParams.set("lat", lat)
    apiUrl.searchParams.set("lon", lon)
    apiUrl.searchParams.set("appid", apiKey)
    apiUrl.searchParams.set("units", "metric")
    apiUrl.searchParams.set("lang", "ja")

    const response = await fetch(apiUrl.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        {
          error: "天気情報の取得に失敗しました",
          details: errorData.message || `HTTP ${response.status}`,
        },
        { status: response.status }
      )
    }

    const data = await response.json()

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

