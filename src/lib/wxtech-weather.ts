import type { WeatherType } from "./weather-background"

/** 日本域の大まかな範囲（緯度・経度） */
const JAPAN_LAT_MIN = 24
const JAPAN_LAT_MAX = 46
const JAPAN_LON_MIN = 122
const JAPAN_LON_MAX = 154

export function isInJapan(lat: number, lon: number): boolean {
  return (
    lat >= JAPAN_LAT_MIN &&
    lat <= JAPAN_LAT_MAX &&
    lon >= JAPAN_LON_MIN &&
    lon <= JAPAN_LON_MAX
  )
}

/**
 * WxTech 天気コード(wx) を WeatherType に変換する。
 * 仕様は WxTech 天気コード(予報) に準拠。未定義は Clear にフォールバック。
 */
const WX_CODE_TO_WEATHER_TYPE: Record<number, WeatherType> = {
  100: "Clear",
  101: "Clear",
  102: "Clear",
  110: "Clear",
  111: "Clear",
  200: "Clouds",
  201: "Clouds",
  202: "Clouds",
  210: "Clouds",
  211: "Clouds",
  212: "Clouds",
  220: "Clouds",
  221: "Clouds",
  222: "Clouds",
  300: "Rain",
  301: "Rain",
  302: "Rain",
  303: "Rain",
  304: "Rain",
  305: "Rain",
  306: "Rain",
  307: "Rain",
  308: "Rain",
  309: "Rain",
  310: "Drizzle",
  311: "Drizzle",
  312: "Drizzle",
  313: "Drizzle",
  314: "Drizzle",
  315: "Drizzle",
  316: "Drizzle",
  317: "Drizzle",
  318: "Drizzle",
  319: "Drizzle",
  320: "Rain",
  321: "Rain",
  322: "Rain",
  323: "Rain",
  324: "Rain",
  325: "Rain",
  326: "Rain",
  327: "Rain",
  328: "Rain",
  329: "Rain",
  330: "Thunderstorm",
  331: "Thunderstorm",
  332: "Thunderstorm",
  333: "Thunderstorm",
  334: "Thunderstorm",
  335: "Thunderstorm",
  336: "Thunderstorm",
  337: "Thunderstorm",
  338: "Thunderstorm",
  339: "Thunderstorm",
  400: "Snow",
  401: "Snow",
  402: "Snow",
  403: "Snow",
  404: "Snow",
  405: "Snow",
  406: "Snow",
  407: "Snow",
  408: "Snow",
  409: "Snow",
  410: "Snow",
  411: "Snow",
  412: "Snow",
  413: "Snow",
  414: "Snow",
  415: "Snow",
  416: "Snow",
  417: "Snow",
  418: "Snow",
  419: "Snow",
  500: "Mist",
  501: "Fog",
  502: "Haze",
  503: "Mist",
  504: "Fog",
  505: "Haze",
}

export function wxCodeToWeatherType(wx: number): WeatherType {
  return WX_CODE_TO_WEATHER_TYPE[wx] ?? "Clear"
}

/**
 * WxTech Data API の Base URL（api. サブドメインは付けない）
 * 公式エンドポイント:
 * - 1kmメッシュ天気予報(Short Range / 72h): {base}/api/v1/ss1wx
 * - 5kmメッシュ世界予報(Global Forecast):     {base}/api/v2/global/wx
 */
export const WXTECH_API_BASE = "https://wxtech.weathernews.com"
