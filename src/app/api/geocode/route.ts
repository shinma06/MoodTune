import { NextRequest, NextResponse } from "next/server"
import { parseLatLon } from "@/lib/parse-lat-lon"
import { logServerError, logServerWarn } from "@/lib/server-log"

const LOG_TAG = "Geocode API"

/**
 * Google Geocoding API (reverse) で緯度経度から都市名を取得する。
 * GET /api/geocode?lat=35.68&lon=139.76
 */
export async function GET(request: NextRequest) {
  try {
    const parsed = parseLatLon(request.nextUrl.searchParams, { validateRange: false })
    if (!parsed.ok) {
      logServerWarn(LOG_TAG, "parse_lat_lon", parsed.error, {
        status: parsed.status,
        searchParams: Object.fromEntries(request.nextUrl.searchParams),
      })
      return NextResponse.json({ error: parsed.error }, { status: parsed.status })
    }
    const { lat: latNum, lon: lonNum } = parsed

    const apiKey = process.env.GOOGLE_GEOCODING_API_KEY
    if (!apiKey) {
      logServerWarn(LOG_TAG, "missing_api_key", "GOOGLE_GEOCODING_API_KEY not set", {})
      return NextResponse.json(
        { error: "Geocoding APIキーが設定されていません" },
        { status: 500 }
      )
    }

    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json")
    url.searchParams.set("latlng", `${latNum},${lonNum}`)
    url.searchParams.set("key", apiKey)
    url.searchParams.set("language", "ja")

    const fetchOptions: RequestInit = { method: "GET" }
    if (process.env.NODE_ENV === "production") {
      const origin = request.headers.get("origin")
      if (origin) {
        fetchOptions.headers = { Referer: origin }
      }
    }
    const response = await fetch(url.toString(), fetchOptions)
    let data: { status?: string; error_message?: string; results?: Array<{ address_components?: Array<{ long_name: string; types: string[] }> }> }
    try {
      data = await response.json()
    } catch (e) {
      logServerError(LOG_TAG, "geocode_response_json", e, {
        status: response.status,
        lat: latNum,
        lon: lonNum,
      })
      return NextResponse.json(
        { error: "Geocoding レスポンスの解析に失敗しました" },
        { status: 502 }
      )
    }

    if (data.status === "REQUEST_DENIED") {
      logServerWarn(LOG_TAG, "request_denied", data.error_message ?? "unknown", {
        error_message: data.error_message,
        lat: latNum,
        lon: lonNum,
      })
      return NextResponse.json(
        {
          error: "Geocoding APIのリクエストが拒否されました",
          details: data.error_message,
        },
        { status: 502 }
      )
    }
    if (data.status === "OVER_QUERY_LIMIT") {
      logServerWarn(LOG_TAG, "over_query_limit", "Geocoding API quota exceeded", { lat: latNum, lon: lonNum })
      return NextResponse.json(
        { error: "Geocoding APIのクォータを超過しました" },
        { status: 429 }
      )
    }
    if (data.status !== "OK" || !Array.isArray(data.results) || data.results.length === 0) {
      logServerWarn(LOG_TAG, "no_results", data.status ?? "empty", { status: data.status, lat: latNum, lon: lonNum })
      return NextResponse.json({ city: "", status: data.status }, { status: 200 })
    }

    const city = extractCityFromAddressComponents(data.results[0].address_components || [])
    return NextResponse.json({ city }, { status: 200 })
  } catch (error) {
    logServerError(LOG_TAG, "get_geocode", error, {
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

/** address_components から最もローカルな地名だけを返す（locality > admin2 > admin1） */
function extractCityFromAddressComponents(components: Array<{ long_name: string; types: string[] }>): string {
  let locality = ""
  let admin2 = ""
  let admin1 = ""

  for (const c of components) {
    if (c.types.includes("locality")) locality = c.long_name
    if (c.types.includes("administrative_area_level_2")) admin2 = c.long_name
    if (c.types.includes("administrative_area_level_1")) admin1 = c.long_name
  }

  if (locality) return locality
  if (admin2) return admin2
  if (admin1) return admin1
  return ""
}
