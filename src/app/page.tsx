import { auth, signIn } from "@/auth"
import PlaylistExplorer from "@/components/PlaylistExplorer"
import { Button } from "@/components/ui/button"
import { Music } from "lucide-react"
import { generateDashboard, type DashboardItem } from "@/app/actions/generateDashboard"
import { getTimeOfDay } from "@/lib/weather-background"
import { normalizeWeatherType } from "@/lib/weather-utils"
import { DEFAULT_SELECTED_GENRES } from "@/lib/constants"
import type { WeatherType, TimeOfDay } from "@/lib/weather-background"

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_SPOTIFY === "true"

/**
 * Generate initial playlist data
 */
async function getInitialPlaylists(): Promise<DashboardItem[]> {
  const currentHour = new Date().getHours()
  const timeOfDay = getTimeOfDay(currentHour) as TimeOfDay
  const weather = normalizeWeatherType(null) as WeatherType

  try {
    return await generateDashboard(weather, timeOfDay, DEFAULT_SELECTED_GENRES)
  } catch (error) {
    console.error("Failed to generate initial dashboard:", error)
    return []
  }
}

export default async function Page() {
  // モックモードの場合はログイン不要
  if (USE_MOCK) {
    const initialPlaylists = await getInitialPlaylists()
    return <PlaylistExplorer playlists={initialPlaylists} />
  }

  // 通常モード: セッションを確認
  const session = await auth()

  // ログイン済みの場合はPlaylistExplorerを表示
  if (session) {
    const initialPlaylists = await getInitialPlaylists()
    return <PlaylistExplorer playlists={initialPlaylists} />
  }

  // 未ログインの場合はログインボタンを表示
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="text-center space-y-6 p-8">
        <div className="space-y-2">
          <Music className="w-16 h-16 mx-auto text-white/80" />
          <h1 className="text-3xl font-serif text-white">MoodTune</h1>
          <p className="text-white/60">天気と時間に合わせた音楽プレイリスト</p>
        </div>
        <form
          action={async () => {
            "use server"
            await signIn("spotify")
          }}
        >
          <Button
            type="submit"
            size="lg"
            className="bg-[#1DB954] hover:bg-[#1ed760] text-white font-medium px-8 py-6 text-lg"
          >
            Login with Spotify
          </Button>
        </form>
      </div>
    </div>
  )
}
