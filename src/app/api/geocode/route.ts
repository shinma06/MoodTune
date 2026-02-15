import { NextRequest, NextResponse } from "next/server"
import { parseLatLon } from "@/lib/parse-lat-lon"

/**
 * Google Geocoding API (reverse) で緯度経度から都市名を取得する。
 * GET /api/geocode?lat=35.68&lon=139.76
 */
export async function GET(request: NextRequest) {
  try {
    const parsed = parseLatLon(request.nextUrl.searchParams, { validateRange: false })
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status })
    }
    const { lat: latNum, lon: lonNum } = parsed

    const apiKey = process.env.GOOGLE_GEOCODING_API_KEY
    if (!apiKey) {
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
    const data = await response.json()

    if (data.status === "REQUEST_DENIED") {
      console.error("Google API Error Detail:", data.error_message)
      return NextResponse.json(
        {
          error: "Geocoding APIのリクエストが拒否されました",
          details: data.error_message,
        },
        { status: 502 }
      )
    }
    if (data.status === "OVER_QUERY_LIMIT") {
      return NextResponse.json(
        { error: "Geocoding APIのクォータを超過しました" },
        { status: 429 }
      )
    }
    if (data.status !== "OK" || !Array.isArray(data.results) || data.results.length === 0) {
      return NextResponse.json({ city: "", status: data.status }, { status: 200 })
    }

    const city = extractCityFromAddressComponents(data.results[0].address_components || [])
    return NextResponse.json({ city }, { status: 200 })
  } catch (error) {
    console.error("Geocoding APIエラー:", error)
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
