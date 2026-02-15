/**
 * API ルート用: クエリから緯度・経度をパースし、オプションで範囲チェックを行う。
 * 既存のエラーメッセージ・ステータスを維持する。
 */
export function parseLatLon(
  searchParams: URLSearchParams,
  options?: { validateRange?: boolean }
): { ok: true; lat: number; lon: number } | { ok: false; error: string; status: number } {
  const validateRange = options?.validateRange !== false
  const lat = searchParams.get("lat")
  const lon = searchParams.get("lon")

  if (!lat || !lon) {
    return {
      ok: false,
      error: "緯度(lat)と経度(lon)のパラメータが必要です",
      status: 400,
    }
  }

  const latNum = parseFloat(lat)
  const lonNum = parseFloat(lon)

  if (isNaN(latNum) || isNaN(lonNum)) {
    return {
      ok: false,
      error: "緯度(lat)と経度(lon)は数値である必要があります",
      status: 400,
    }
  }

  if (validateRange) {
    if (latNum < -90 || latNum > 90) {
      return {
        ok: false,
        error: "緯度は-90から90の範囲である必要があります",
        status: 400,
      }
    }
    if (lonNum < -180 || lonNum > 180) {
      return {
        ok: false,
        error: "経度は-180から180の範囲である必要があります",
        status: 400,
      }
    }
  }

  return { ok: true, lat: latNum, lon: lonNum }
}
