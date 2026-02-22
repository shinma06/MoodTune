import SpotifyWebApi from "spotify-web-api-node"
import { auth } from "@/auth"
import { logServerError } from "@/lib/server-log"

const LOG_TAG = "Spotify Server"

/**
 * Spotify API クライアントを初期化して返す
 * Server Actions で使用するための共通化された関数
 *
 * @returns SpotifyWebApi インスタンス、またはトークンがない場合は null
 * @returns null セッションが存在しない、またはアクセストークンが取得できない場合
 */
export async function getSpotifyClient(): Promise<SpotifyWebApi | null> {
  try {
    const session = await auth()

    if (!session) return null

    const accessToken = session.accessToken
    if (!accessToken || typeof accessToken !== "string") return null

    const spotifyApi = new SpotifyWebApi()
    spotifyApi.setAccessToken(accessToken)

    return spotifyApi
  } catch (error) {
    logServerError(LOG_TAG, "get_spotify_client", error, {})
    return null
  }
}
