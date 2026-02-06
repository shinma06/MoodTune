/**
 * Client-side API for MoodTune Python backend (YouTube Music).
 * Requests are proxied via Next.js rewrites: /api/py/* → localhost:8000
 *
 * 要件: genre, weather, timeOfDay, title(optional) でプレイリスト生成。
 * 実装は未実装（スタブ）。
 */

export interface YtMusicPlaylistResponse {
  url: string
  playlist_id: string
  query: string
}

/**
 * Create a YouTube Music playlist — 未実装（要件に沿ってバックエンド実装後に有効化すること）。
 */
export async function generateYtMusicPlaylist(
  _genre: string,
  _weather: string,
  _timeOfDay: string,
  _title?: string
): Promise<YtMusicPlaylistResponse> {
  throw new Error("YouTube Music integration is not implemented yet.")
}
