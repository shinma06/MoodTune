import { NextRequest, NextResponse } from "next/server"
import { parseLatLon } from "@/lib/parse-lat-lon"
import { fetchWxTechWeather, fetchOpenWeatherMap } from "@/lib/weather-fetch"
import { logServerError, logServerWarn } from "@/lib/server-log"

const LOG_TAG = "Weather API"

export async function GET(request: NextRequest) {
  try {
    const parsed = parseLatLon(request.nextUrl.searchParams)
    if (!parsed.ok) {
      logServerWarn(LOG_TAG, "parse_lat_lon", parsed.error, {
        status: parsed.status,
        searchParams: Object.fromEntries(request.nextUrl.searchParams),
      })
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
      logServerWarn(LOG_TAG, "wxtech_fallback", result.reason ?? "unknown", { lat, lon })
    }

    if (!owmKey) {
      logServerWarn(LOG_TAG, "missing_api_key", "WxTech 未使用 or OWM キー未設定", { hasWxTech: !!wxTechKey })
      return NextResponse.json(
        { error: "天気APIキーが設定されていません（WxTech または OpenWeatherMap）" },
        { status: 500 }
      )
    }

    const owmResponse = await fetchOpenWeatherMap(owmKey, lat, lon)
    if (!owmResponse.ok) {
      const errorData = await owmResponse.json().catch((e) => {
        logServerError(LOG_TAG, "owm_error_body_parse", e, { status: owmResponse.status })
        return {}
      })
      logServerWarn(LOG_TAG, "owm_http_error", errorData.message || `HTTP ${owmResponse.status}`, {
        status: owmResponse.status,
        lat,
        lon,
        detail: (errorData as { message?: string }).message,
      })
      return NextResponse.json(
        {
          error: "天気情報の取得に失敗しました",
          details: errorData.message || `HTTP ${owmResponse.status}`,
        },
        { status: owmResponse.status }
      )
    }
    let data: unknown
    try {
      data = await owmResponse.json()
    } catch (e) {
      logServerError(LOG_TAG, "owm_response_json", e, { status: owmResponse.status })
      return NextResponse.json(
        { error: "天気データの解析に失敗しました", details: "Invalid JSON" },
        { status: 502 }
      )
    }
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    logServerError(LOG_TAG, "get_weather", error, {
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
