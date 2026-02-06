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
 * Request body for POST /api/py/generate_playlist (aligned with api/main.py PlaylistRequest)
 */
interface GeneratePlaylistBody {
  genre: string
  weather: string
  time_of_day: string
}

/**
 * Create a YouTube Music playlist for the given genre/weather/time and return its URL.
 * Call from client so the request goes through Next.js rewrites (same-origin, no CORS).
 */
export async function generateYtMusicPlaylist(
  genre: string,
  weather: string,
  timeOfDay: string
): Promise<YtMusicPlaylistResponse> {
  const body: GeneratePlaylistBody = {
    genre,
    weather,
    time_of_day: timeOfDay,
  }
  const res = await fetch("/api/py/generate_playlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    let detail: string
    try {
      const json = JSON.parse(text) as { detail?: string }
      detail = json.detail ?? text
    } catch {
      detail = text || res.statusText
    }
    throw new Error(detail)
  }
  return res.json() as Promise<YtMusicPlaylistResponse>
}
