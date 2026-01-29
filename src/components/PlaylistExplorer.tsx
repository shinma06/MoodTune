"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import WeatherMonitor from "./WeatherMonitor"
import WeatherAnimation from "./WeatherAnimation"
import WeatherTestPanel from "./WeatherTestPanel"
import GenreSelector, { useSelectedGenres } from "./GenreSelector"
import { useWeather } from "@/contexts/WeatherContext"
import { getWeatherBackground, getTimeOfDay, type WeatherType, isDarkBackground } from "@/lib/weather-background"
import { normalizeWeatherType } from "@/lib/weather-utils"
import { formatGradientBackground } from "@/lib/weather-background-utils"
import { useVinylRotation } from "@/hooks/useVinylRotation"
import { getGenreThemeColors } from "@/lib/constants"
import { Music } from "lucide-react"
import { Button } from "@/components/ui/button"
import { generateDashboard, type DashboardItem } from "@/app/actions/generateDashboard"
import type { TimeOfDay } from "@/lib/weather-background"
import type { Genre } from "@/lib/constants"

interface PlaylistExplorerProps {
  playlists?: DashboardItem[]
}

/** プレイリストが空のときの表示用ダミー */
const EMPTY_PLAYLIST: DashboardItem = {
  id: "empty",
  genre: "---",
  title: "プレイリストがありません",
  query: "",
  imageUrl: "",
}

/** ジャンル配列が変更されたか（順序に依存しない） */
function hasGenresChanged(prev: string[], current: string[]): boolean {
  if (prev.length !== current.length) return true
  const sortedPrev = [...prev].sort()
  const sortedCurrent = [...current].sort()
  return sortedPrev.some((g, i) => g !== sortedCurrent[i])
}

/** ジャンル配列の差分（追加・削除・変更なし）を算出 */
function getGenresDiff(prev: string[], current: string[]) {
  const prevSet = new Set(prev)
  const currentSet = new Set(current)
  
  return {
    added: current.filter(g => !prevSet.has(g)),
    removed: prev.filter(g => !currentSet.has(g)),
    unchanged: current.filter(g => prevSet.has(g)),
  }
}

/** 画像URLを返す（空の場合はプレースホルダー） */
function getImageUrl(url: string | undefined | null): string {
  if (!url || url.trim() === "") {
    return "/placeholder.svg"
  }
  return url
}

export default function PlaylistExplorer({ playlists: initialPlaylists }: PlaylistExplorerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const { weatherType, actualWeatherType, testTimeOfDay, isTestMode, playlistAutoUpdate, playlistRefreshTrigger } = useWeather()
  const [currentHour, setCurrentHour] = useState(new Date().getHours())
  const [showSettings, setShowSettings] = useState(false)
  const [selectedGenres, isGenresInitialized] = useSelectedGenres()
  const [playlists, setPlaylists] = useState<DashboardItem[] | null>(initialPlaylists ?? null)
  const [isLoading, setIsLoading] = useState(false)
  
  /** パネルを開いた時点のジャンル（閉じたときの差分計算用） */
  const genresOnOpenRef = useRef<string[]>([])
  /** リロード後の初回同期を1回だけ行うためのフラグ */
  const hasPerformedInitialSyncRef = useRef(false)
  /** 時間帯・天気の自動更新用の前回値 */
  const prevTimeOfDayRef = useRef<TimeOfDay | null>(null)
  const prevActualWeatherRef = useRef<string | null>(null)
  
  /** 生成失敗時は空のままローディング表示を継続（静的フォールバックは使わない） */
  const displayPlaylists = useMemo(() => {
    return playlists && playlists.length > 0 ? playlists : []
  }, [playlists])
  
  /** ローディング表示を出す条件（生成中 or 未取得・失敗でプレイリストが空） */
  const isLoadingOrEmpty = isLoading || displayPlaylists.length === 0
  
  /** 常に配列範囲内のインデックス */
  const safeCurrentIndex = useMemo(() => {
    if (displayPlaylists.length === 0) return 0
    return Math.min(currentIndex, displayPlaylists.length - 1)
  }, [currentIndex, displayPlaylists.length])
  
  const currentPlaylist = displayPlaylists[safeCurrentIndex] ?? EMPTY_PLAYLIST
  const vinylColors = getGenreThemeColors(currentPlaylist.genre)
  
  /** 現在の天気・時間帯・ジャンルでプレイリストを全件再生成 */
  const refreshPlaylists = useCallback(async () => {
    if (selectedGenres.length === 0) return
    setIsLoading(true)
    try {
      const weather = normalizeWeatherType(weatherType ?? "Clear") as WeatherType
      const calculatedTimeOfDay = getTimeOfDay(currentHour)
      const time = (isTestMode && testTimeOfDay ? testTimeOfDay : calculatedTimeOfDay) as TimeOfDay
      const generated = await generateDashboard(weather, time, selectedGenres as Genre[])
      setPlaylists(generated)
      setCurrentIndex(0)
    } catch (error) {
      console.error("Failed to refresh playlists:", error)
    } finally {
      setIsLoading(false)
    }
  }, [weatherType, currentHour, isTestMode, testTimeOfDay, selectedGenres])

  /** ジャンル差分に応じてプレイリストを更新（追加ジャンルのみAPI呼び出し） */
  const updatePlaylistsWithDiff = useCallback(async (
    currentGenres: string[],
    diff: { added: string[], removed: string[], unchanged: string[] }
  ) => {
    if (currentGenres.length === 0) return
    
    setIsLoading(true)
    try {
      const weather = normalizeWeatherType(weatherType ?? "Clear") as WeatherType
      const calculatedTimeOfDay = getTimeOfDay(currentHour)
      const time = (isTestMode && testTimeOfDay ? testTimeOfDay : calculatedTimeOfDay) as TimeOfDay
      
      const existingMap = new Map<string, DashboardItem>()
      if (playlists) {
        playlists.forEach(p => existingMap.set(p.genre, p))
      }
      
      const unchangedPlaylists = diff.unchanged
        .map(genre => existingMap.get(genre))
        .filter((p): p is DashboardItem => p !== undefined)
      
      let newPlaylists: DashboardItem[] = []
      if (diff.added.length > 0) {
        newPlaylists = await generateDashboard(
          weather,
          time,
          diff.added as Genre[]
        )
      }
      
      const allMap = new Map<string, DashboardItem>()
      unchangedPlaylists.forEach(p => allMap.set(p.genre, p))
      newPlaylists.forEach(p => allMap.set(p.genre, p))
      
      const finalPlaylists = currentGenres
        .map(genre => allMap.get(genre))
        .filter((p): p is DashboardItem => p !== undefined)
      
      setPlaylists(finalPlaylists)
      setCurrentIndex(0)
    } catch (error) {
      console.error("Failed to generate dashboard:", error)
    } finally {
      setIsLoading(false)
    }
  }, [weatherType, currentHour, isTestMode, testTimeOfDay, playlists])
  
  /** 設定パネルの開閉（閉じたときにジャンル変更があればプレイリスト再生成） */
  const handleToggleSettings = useCallback(() => {
    if (!showSettings) {
      genresOnOpenRef.current = [...selectedGenres]
      setShowSettings(true)
    } else {
      setShowSettings(false)
      if (hasGenresChanged(genresOnOpenRef.current, selectedGenres)) {
        const diff = getGenresDiff(genresOnOpenRef.current, selectedGenres)
        updatePlaylistsWithDiff(selectedGenres, diff)
      }
    }
  }, [showSettings, selectedGenres, updatePlaylistsWithDiff])

  /** localStorage のジャンル読み込み完了後、保存値と表示プレイリストが食い違っていれば同期 */
  useEffect(() => {
    if (!isGenresInitialized || hasPerformedInitialSyncRef.current) return
    hasPerformedInitialSyncRef.current = true
    
    const currentPlaylistGenres = playlists?.map(p => p.genre) ?? []
    if (hasGenresChanged(currentPlaylistGenres, selectedGenres)) {
      const diff = getGenresDiff(currentPlaylistGenres, selectedGenres)
      updatePlaylistsWithDiff(selectedGenres, diff)
    }
  }, [isGenresInitialized, selectedGenres, playlists, updatePlaylistsWithDiff])

  /** 時間帯（朝・昼・夕方・夜）が変わったタイミングでプレイリストを自動更新 */
  const calculatedTimeOfDayForEffect = getTimeOfDay(currentHour)
  const timeOfDayForAutoUpdate = isTestMode && testTimeOfDay ? testTimeOfDay : calculatedTimeOfDayForEffect
  useEffect(() => {
    if (!playlistAutoUpdate || !isGenresInitialized || selectedGenres.length === 0) return
    const prev = prevTimeOfDayRef.current
    prevTimeOfDayRef.current = timeOfDayForAutoUpdate
    if (prev !== null && prev !== timeOfDayForAutoUpdate) {
      refreshPlaylists()
    }
  }, [timeOfDayForAutoUpdate, playlistAutoUpdate, isGenresInitialized, selectedGenres.length, refreshPlaylists])

  /** パネルから「プレイリストを再生成」が押されたときに手動で再生成 */
  useEffect(() => {
    if (playlistRefreshTrigger === 0 || !isGenresInitialized || selectedGenres.length === 0) return
    refreshPlaylists()
  }, [playlistRefreshTrigger, isGenresInitialized, selectedGenres.length, refreshPlaylists])

  /** APIが天気の変更を示したタイミングでプレイリストを自動更新（手動設定中は対象外） */
  useEffect(() => {
    if (!playlistAutoUpdate || isTestMode || !isGenresInitialized || selectedGenres.length === 0) return
    const current = actualWeatherType ?? null
    const prev = prevActualWeatherRef.current
    prevActualWeatherRef.current = current
    if (prev !== null && prev !== current) {
      refreshPlaylists()
    }
  }, [actualWeatherType, playlistAutoUpdate, isTestMode, isGenresInitialized, selectedGenres.length, refreshPlaylists])

  /** 現在時刻を1分ごとに更新 */
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHour(new Date().getHours())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  const calculatedTimeOfDay = getTimeOfDay(currentHour)
  const timeOfDay = isTestMode && testTimeOfDay ? testTimeOfDay : calculatedTimeOfDay
  const weather = normalizeWeatherType(weatherType ?? "Clear")
  const background = getWeatherBackground(weather, timeOfDay)
  const isDark = isDarkBackground(weather, timeOfDay)
  const genreColorClass = isDark ? "text-white/80" : "text-muted-foreground"
  const titleColorClass = isDark ? "text-white" : "text-foreground"

  const {
    rotation,
    isDragging,
    vinylRef,
    handleMouseDown,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useVinylRotation({
    onRotationComplete: (direction) => {
      const length = displayPlaylists.length
      if (length === 0) return
      
      if (direction === "next") {
        setCurrentIndex((prev) => (prev + 1) % length)
      } else {
        setCurrentIndex((prev) => (prev - 1 + length) % length)
      }
    },
  })

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-between p-6 pb-8 overflow-hidden touch-none transition-all duration-1000 ease-in-out relative z-10"
            style={{
                background: formatGradientBackground(background),
            }}
        >
            {/* Weather Animation */}
            <WeatherAnimation weatherType={weatherType ? normalizeWeatherType(weatherType) : null} />

            {/* Weather Test Panel */}
            <WeatherTestPanel />

            {/* Settings Toggle Button（ジャンル選択・右下で天気と被らない） */}
            <div className="fixed bottom-4 right-4 z-50">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={handleToggleSettings}
                    className={`
                        w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border-border/50
                        ${showSettings ? "bg-primary text-primary-foreground" : ""}
                    `}
                >
                    <Music className="w-5 h-5" />
                </Button>
            </div>

            {/* Settings Panel with Genre Selector（ボタンの上に表示） */}
            {showSettings && (
                <div className="fixed bottom-16 right-4 z-50 w-80 max-w-[calc(100vw-2rem)]">
                    <GenreSelector />
                </div>
            )}

            {/* Weather Section */}
            <WeatherMonitor />

            {/* Vinyl Record Section */}
            <div className="flex-1 flex items-center justify-center w-full max-w-md relative z-10">
                <p className={`absolute top-0 left-1/2 -translate-x-1/2 text-center text-[10px] font-light whitespace-nowrap ${isDark ? "text-white/80" : "text-muted-foreground/70"}`}>
                    左右にスピンして他のプレイリストへ
                </p>

                <div className="relative w-72 h-72">
                    {/* 固定された影（回転しない） */}
                    <div className="absolute inset-0 rounded-full shadow-2xl pointer-events-none" />
                    
                    <div
                        ref={vinylRef}
                        className="relative w-full h-full cursor-grab active:cursor-grabbing select-none"
                        style={{
                            transform: `rotate(${rotation}deg)`,
                            transition: isDragging ? "none" : "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        }}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onMouseDown={handleMouseDown}
                        onMouseUp={handleMouseUp}
                    >
                        {/* Vinyl Disc */}
                        <div className="absolute inset-0 rounded-full overflow-hidden">
                            <div className={`absolute inset-0 bg-gradient-to-br ${vinylColors.vinylColor} opacity-90`} />
                            {[...Array(20)].map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute inset-0 rounded-full border border-white/5"
                                    style={{
                                        transform: `scale(${1 - i * 0.04})`,
                                    }}
                                />
                            ))}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-24 h-24 rounded-full bg-card shadow-xl flex items-center justify-center overflow-hidden">
                                    {isLoadingOrEmpty ? (
                                        <div className="w-20 h-20 rounded-full bg-muted/50 animate-pulse" />
                                    ) : (
                                        <img
                                            src={getImageUrl(currentPlaylist.imageUrl)}
                                            alt={currentPlaylist.title}
                                            className="w-20 h-20 rounded-full object-cover"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement
                                                target.src = "/placeholder.svg"
                                            }}
                                        />
                                    )}
                                </div>
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-4 h-4 rounded-full bg-background shadow-inner" />
                            </div>
                        </div>
                    </div>

                    {/* Indicator dots（ジャンルごとのテーマカラー） */}
                    <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {displayPlaylists.map((item, i) => {
                            const colors = getGenreThemeColors(item.genre)
                            const isActive = i === safeCurrentIndex
                            return (
                                <div
                                    key={i}
                                    className={`w-1.5 h-1.5 rounded-full transition-all ${isActive ? "w-6" : "bg-border"}`}
                                    style={isActive ? { backgroundColor: colors.accentColor } : {}}
                                />
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Playlist Info Section */}
            <div className="w-full max-w-md space-y-6 pb-4 relative z-10">
                <div className="text-center space-y-3">
                    <p className={`text-xs uppercase tracking-widest font-light ${genreColorClass}`}>
                        {isLoadingOrEmpty ? "読み込み中..." : currentPlaylist.genre}
                    </p>
                    <h2 className={`text-2xl font-serif leading-tight text-balance ${titleColorClass}`}>
                        {isLoadingOrEmpty ? "プレイリストを生成中" : currentPlaylist.title}
                    </h2>
                </div>

                <div className="flex items-center justify-center">
                    {isLoadingOrEmpty ? (
                        <div className="w-32 h-32 rounded-lg bg-muted/50 animate-pulse flex items-center justify-center">
                            <Music className={`w-8 h-8 ${isDark ? "text-white/30" : "text-muted-foreground/30"}`} />
                        </div>
                    ) : (
                        <img
                            src={getImageUrl(currentPlaylist.imageUrl)}
                            alt={currentPlaylist.title}
                            className="w-32 h-32 rounded-lg shadow-lg object-cover"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = "/placeholder.svg"
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

