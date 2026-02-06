/**
 * Client-side API for MoodTune Python backend (YouTube Music).
 * Requests are proxied via Next.js rewrites: /api/py/* → localhost:8000
 */

export interface YtMusicPlaylistResponse {
  url: string
  playlist_id: string
  query: string
}

/**
 * Create a YouTube Music playlist via the Python backend.
 *
 * @param genre - Music genre (e.g. "J-POP")
 * @param weather - Weather condition (e.g. "Clear")
 * @param timeOfDay - Time of day (e.g. "night")
 * @param title - Optional playlist title
 */
export async function generateYtMusicPlaylist(
  genre: string,
  weather: string,
  timeOfDay: string,
  title?: string
): Promise<YtMusicPlaylistResponse> {
  const res = await fetch("/api/py/generate_playlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      genre,
      weather,
      time_of_day: timeOfDay,
      title: title || undefined,
    }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: "Unknown error" }))
    throw new Error(body.detail || `HTTP ${res.status}`)
  }

  return res.json()
}
