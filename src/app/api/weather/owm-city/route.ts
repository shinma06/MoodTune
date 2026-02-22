import { NextRequest, NextResponse } from "next/server"
import { parseLatLon } from "@/lib/parse-lat-lon"
import { logServerError, logServerWarn } from "@/lib/server-log"

const LOG_TAG = "Weather API (owm-city)"

/**
 * OpenWeatherMap のみを呼び、都市名(name)だけを返す。
 * Geocoding 失敗かつ天気が WxTech のとき、都市名フォールバック用にクライアントから呼ぶ。
 * GET /api/weather/owm-city?lat=&lon=
 */
export async function GET(request: NextRequest) {
  try {
    const parsed = parseLatLon(request.nextUrl.searchParams)
    if (!parsed.ok) {
      logServerWarn(LOG_TAG, "parse_lat_lon", parsed.error, {
        status: parsed.status,
        searchParams: Object.fromEntries(request.nextUrl.searchParams),
      })
      return NextResponse.json({ error: "無効な緯度経度です" }, { status: 400 })
    }
    const { lat: latNum, lon: lonNum } = parsed
    const lat = String(latNum)
    const lon = String(lonNum)

    const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY
    if (!apiKey) {
      logServerWarn(LOG_TAG, "missing_api_key", "NEXT_PUBLIC_WEATHER_API_KEY not set", {})
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
      const err = await response.json().catch((e) => {
        logServerError(LOG_TAG, "owm_city_error_body_parse", e, { status: response.status })
        return {}
      })
      logServerWarn(LOG_TAG, "owm_city_http_error", (err as { message?: string }).message ?? `HTTP ${response.status}`, {
        status: response.status,
        lat,
        lon,
      })
      return NextResponse.json(
        { error: "都市情報の取得に失敗しました", details: (err as { message?: string }).message },
        { status: response.status }
      )
    }

    let data: { name?: string }
    try {
      data = (await response.json()) as { name?: string }
    } catch (e) {
      logServerError(LOG_TAG, "owm_city_response_json", e, { status: response.status })
      return NextResponse.json(
        { error: "都市データの解析に失敗しました" },
        { status: 502 }
      )
    }
    const name = typeof data.name === "string" ? data.name : ""
    return NextResponse.json({ name }, { status: 200 })
  } catch (error) {
    logServerError(LOG_TAG, "get_owm_city", error, {
      url: request.url,
      searchParams: Object.fromEntries(request.nextUrl.searchParams),
    })
    return NextResponse.json(
      {
        error: "サーバーエラーが発生しました",
        details: error instanceof Error ? error.message : "不明なエラー",
      },
      { status: 500 }
    )
  }
}
