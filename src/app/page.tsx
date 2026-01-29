import { auth, signIn } from "@/auth"
import PlaylistExplorer from "@/components/PlaylistExplorer"
import { Button } from "@/components/ui/button"
import { Music } from "lucide-react"
import { generateDashboard, type DashboardItem } from "@/app/actions/generateDashboard"
import { getTimeOfDay } from "@/lib/weather-background"
import { normalizeWeatherType } from "@/lib/weather-utils"
import { DEFAULT_SELECTED_GENRES } from "@/lib/constants"
import type { WeatherType, TimeOfDay } from "@/lib/weather-background"

/** Spotify 未連携時は true。明示的に "false" でない限りモック（ログイン不要） */
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_SPOTIFY !== "false"

/** 初期表示用のプレイリストデータを生成 */
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
  if (USE_MOCK) {
    const initialPlaylists = await getInitialPlaylists()
    return <PlaylistExplorer playlists={initialPlaylists} />
  }

  const session = await auth()
  if (session) {
    const initialPlaylists = await getInitialPlaylists()
    return <PlaylistExplorer playlists={initialPlaylists} />
  }

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
