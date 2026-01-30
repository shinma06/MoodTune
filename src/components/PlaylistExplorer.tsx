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
import {
  useVinylRotation,
  REGENERATE_THRESHOLD_DEG,
  REGENERATE_ZONE_ENTRY_DEG,
} from "@/hooks/useVinylRotation"
import { getGenreThemeColors, REALISTIC_VINYL_THEME } from "@/lib/constants"
import {
  hasGenresChanged,
  getGenresDiff,
  getImageUrl,
  getLoadingGenreText,
  getLoadingTitleText,
  EMPTY_PLAYLIST,
  type LoadingMode,
} from "@/lib/playlist-utils"
import { Music } from "lucide-react"
import { Button } from "@/components/ui/button"
import { generateDashboard } from "@/app/actions/generateDashboard"
import type { DashboardItem } from "@/types/dashboard"
import type { TimeOfDay } from "@/lib/weather-background"
import type { Genre } from "@/lib/constants"

interface PlaylistExplorerProps {
  playlists?: DashboardItem[]
}

export default function PlaylistExplorer({ playlists: initialPlaylists }: PlaylistExplorerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const { displayHour, weatherType, actualWeatherType, testTimeOfDay, isTestMode, playlistAutoUpdate, playlistRefreshTrigger } = useWeather()
  /** 開いているパネル（null = 両方閉じている）。同時に1つだけ開く */
  const [openPanel, setOpenPanel] = useState<null | "mood" | "genre">(null)
  const [selectedGenres, isGenresInitialized] = useSelectedGenres()
  const [playlists, setPlaylists] = useState<DashboardItem[] | null>(initialPlaylists ?? null)
  const [isLoading, setIsLoading] = useState(false)
  /** 生成中の種別（初回 / 全件再生成 / 個別 / 追加ジャンルのみ）。表示文言の切り替え用 */
  const [loadingMode, setLoadingMode] = useState<LoadingMode>(null)
  
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
  /** 現実のレコード色を使うのは (1) 初期同期時の stale J-POP のみ (2) 空状態 のときのみ。それ以外は表示中のジャンルのテーマカラー */
  const isInitialSyncStaleJPop =
    isLoading &&
    playlists?.length === 1 &&
    currentPlaylist.genre === "J-POP" &&
    selectedGenres.length > 0 &&
    selectedGenres[0] !== "J-POP"
  const isEmpty = displayPlaylists.length === 0 || currentPlaylist.genre === "---"
  const useRealisticVinyl = isInitialSyncStaleJPop || isEmpty
  const vinylColors = useRealisticVinyl
    ? REALISTIC_VINYL_THEME
    : getGenreThemeColors(currentPlaylist.genre)
  
  /** ローディング中かどうかを ref で保持（useCallback 内で最新値を参照するため） */
  const isLoadingRef = useRef(false)
  isLoadingRef.current = isLoading

  /** 現在の天気・時間帯・ジャンルでプレイリストを全件再生成 */
  const refreshPlaylists = useCallback(async () => {
    if (selectedGenres.length === 0) return
    if (isLoadingRef.current) return // ローディング中は無視
    setLoadingMode("all")
    setIsLoading(true)
    try {
      const weather = normalizeWeatherType(weatherType ?? "Clear") as WeatherType
      const calculatedTimeOfDay = getTimeOfDay(displayHour)
      const time = (isTestMode && testTimeOfDay ? testTimeOfDay : calculatedTimeOfDay) as TimeOfDay
      const generated = await generateDashboard(weather, time, selectedGenres as Genre[])
      setPlaylists(generated)
      setCurrentIndex((prev) => Math.min(prev, Math.max(0, generated.length - 1)))
    } catch (error) {
      console.error("Failed to refresh playlists:", error)
    } finally {
      setIsLoading(false)
      setLoadingMode(null)
    }
  }, [weatherType, displayHour, isTestMode, testTimeOfDay, selectedGenres])

  /** 表示中の1ジャンルだけ現在の天気・時間で再生成（レコード右3周で発火） */
  const refreshPlaylistByGenre = useCallback(async (genre: Genre) => {
    if (!selectedGenres.includes(genre)) return
    if (isLoadingRef.current) return // ローディング中は無視
    setLoadingMode("single")
    setIsLoading(true)
    try {
      const weather = normalizeWeatherType(weatherType ?? "Clear") as WeatherType
      const calculatedTimeOfDay = getTimeOfDay(displayHour)
      const time = (isTestMode && testTimeOfDay ? testTimeOfDay : calculatedTimeOfDay) as TimeOfDay
      const generated = await generateDashboard(weather, time, [genre])
      const newItem = generated[0]
      if (!newItem) return
      setPlaylists((prev) => {
        if (!prev) return [newItem]
        return prev.map((p) => (p.genre === genre ? newItem : p))
      })
    } catch (error) {
      console.error("Failed to refresh playlist by genre:", error)
    } finally {
      setIsLoading(false)
      setLoadingMode(null)
    }
  }, [weatherType, displayHour, isTestMode, testTimeOfDay, selectedGenres])

  /** ジャンル差分に応じてプレイリストを更新（追加ジャンルのみAPI呼び出し。既存は currentPlaylists を再利用） */
  const updatePlaylistsWithDiff = useCallback(async (
    currentGenres: string[],
    diff: { added: string[], removed: string[], unchanged: string[] },
    currentPlaylists: DashboardItem[] | null,
    isInitialSync = false
  ) => {
    if (currentGenres.length === 0) return
    if (isLoadingRef.current) return // ローディング中は無視

    setLoadingMode(isInitialSync ? "initial" : "added")
    setIsLoading(true)
    try {
      const weather = normalizeWeatherType(weatherType ?? "Clear") as WeatherType
      const calculatedTimeOfDay = getTimeOfDay(displayHour)
      const time = (isTestMode && testTimeOfDay ? testTimeOfDay : calculatedTimeOfDay) as TimeOfDay
      
      const existingMap = new Map<string, DashboardItem>()
      if (currentPlaylists) {
        currentPlaylists.forEach(p => existingMap.set(p.genre, p))
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
      setLoadingMode(null)
    }
  }, [weatherType, displayHour, isTestMode, testTimeOfDay])
  
  /** ジャンル選択パネルの開閉（閉じたときにジャンル変更があればプレイリスト再生成） */
  const handleToggleSettings = useCallback(() => {
    if (openPanel !== "genre") {
      genresOnOpenRef.current = [...selectedGenres]
      setOpenPanel("genre")
    } else {
      setOpenPanel(null)
      if (hasGenresChanged(genresOnOpenRef.current, selectedGenres)) {
        const diff = getGenresDiff(genresOnOpenRef.current, selectedGenres)
        updatePlaylistsWithDiff(selectedGenres, diff, playlists)
      }
    }
  }, [openPanel, selectedGenres, playlists, updatePlaylistsWithDiff])

  /** localStorage のジャンル読み込み完了後、保存値と表示プレイリストが食い違っていれば同期 */
  useEffect(() => {
    if (!isGenresInitialized || hasPerformedInitialSyncRef.current) return
    hasPerformedInitialSyncRef.current = true
    
    const currentPlaylistGenres = playlists?.map(p => p.genre) ?? []
    if (hasGenresChanged(currentPlaylistGenres, selectedGenres)) {
      const diff = getGenresDiff(currentPlaylistGenres, selectedGenres)
      updatePlaylistsWithDiff(selectedGenres, diff, playlists, true)
    }
  }, [isGenresInitialized, selectedGenres, playlists, updatePlaylistsWithDiff])

  /** 実時刻の時間帯（朝・昼・夕方・夜）が変わったタイミングでプレイリストを自動更新（手動設定中は行わない） */
  const calculatedTimeOfDayForEffect = getTimeOfDay(displayHour)
  useEffect(() => {
    if (!playlistAutoUpdate || isTestMode || !isGenresInitialized || selectedGenres.length === 0) return
    const prev = prevTimeOfDayRef.current
    prevTimeOfDayRef.current = calculatedTimeOfDayForEffect
    if (prev !== null && prev !== calculatedTimeOfDayForEffect) {
      refreshPlaylists()
    }
  }, [calculatedTimeOfDayForEffect, playlistAutoUpdate, isTestMode, isGenresInitialized, selectedGenres.length, refreshPlaylists])

  /** プレイリスト生成中はパネルを閉じ、値変更を防ぐ（同期ずれ防止） */
  useEffect(() => {
    if (isLoading) setOpenPanel(null)
  }, [isLoading])

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

  const calculatedTimeOfDay = getTimeOfDay(displayHour)
  const timeOfDay = isTestMode && testTimeOfDay ? testTimeOfDay : calculatedTimeOfDay
  const weather = normalizeWeatherType(weatherType ?? "Clear")
  const background = getWeatherBackground(weather, timeOfDay)
  const isDark = isDarkBackground(weather, timeOfDay)
  const genreColorClass = isDark ? "text-white/80" : "text-muted-foreground"
  const titleColorClass = isDark ? "text-white" : "text-foreground"

  const {
    rotation,
    isDragging,
    cumulativeRotation,
    snapBackDurationMs,
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
    onRegenerateCurrent:
      displayPlaylists.length > 0 && currentPlaylist.genre !== "---"
        ? () => refreshPlaylistByGenre(currentPlaylist.genre as Genre)
        : undefined,
    onRegenerateAll:
      selectedGenres.length > 0 ? refreshPlaylists : undefined,
  })

  /** 3周フィードバック表示: ドラッグ中・戻り演出でない・1周超 */
  const showRegenerateFeedback =
    isDragging &&
    snapBackDurationMs === null &&
    Math.abs(cumulativeRotation) > REGENERATE_ZONE_ENTRY_DEG
  /** 3周までの進捗 0〜1（エフェクト強度用） */
  const regenerateProgress = showRegenerateFeedback
    ? Math.min(1, Math.abs(cumulativeRotation) / REGENERATE_THRESHOLD_DEG)
    : 0
  /** 3周フィードバックの文言 */
  const regenerateMessage = (() => {
    if (!showRegenerateFeedback) return null
    const abs = Math.abs(cumulativeRotation)
    if (cumulativeRotation >= REGENERATE_THRESHOLD_DEG) return "離すと再生成"
    if (cumulativeRotation <= -REGENERATE_THRESHOLD_DEG) return "離すと全件再生成"
    const remainingTurns = Math.ceil((REGENERATE_THRESHOLD_DEG - abs) / 360)
    return cumulativeRotation > 0
      ? `あと${remainingTurns}周で再生成`
      : `あと${remainingTurns}周で全件再生成`
  })()

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-between p-4 pb-20 sm:p-6 sm:pb-8 overflow-x-hidden overflow-y-auto transition-all duration-1000 ease-in-out relative z-10"
            style={{
                background: formatGradientBackground(background),
            }}
        >
            {/* Weather Animation */}
            <WeatherAnimation weatherType={weatherType ? normalizeWeatherType(weatherType) : null} />

            {/* Weather Test Panel（気分に合わせる）。ジャンルパネル開時または生成中はボタン非表示・生成中はパネルも閉じる */}
            <WeatherTestPanel
                isOpen={openPanel === "mood" && !isLoading}
                onOpen={() => setOpenPanel("mood")}
                onClose={() => setOpenPanel(null)}
                hideToggleButton={openPanel === "genre" || isLoading}
            />

            {/* Settings Toggle Button（ジャンル選択・右下）。気分パネル開時または生成中は非表示 */}
            {openPanel !== "mood" && !isLoading && (
            <Button
                variant="outline"
                size="icon"
                onClick={handleToggleSettings}
                className={`
                    fixed bottom-4 right-4 z-50 bg-background/80 backdrop-blur-sm
                    ${openPanel === "genre" ? "bg-primary text-primary-foreground" : ""}
                `}
            >
                <Music className="h-4 w-4" />
            </Button>
            )}

            {/* Settings Panel with Genre Selector（ボタンの上に表示）。生成中は非表示 */}
            {openPanel === "genre" && !isLoading && (
                <div className="fixed bottom-16 right-4 z-50 w-80 max-w-[calc(100vw-2rem)]">
                    <GenreSelector />
                </div>
            )}

            {/* Weather Section（縦幅が狭くても潰れないよう固定。items-center と同様に中央寄せを維持） */}
            <div className="shrink-0 w-full flex justify-center">
                <WeatherMonitor />
            </div>

            {/* Vinyl Record Section（縦幅が狭いときはレコードを縮小して重なりを防止） */}
            <div className="flex-1 min-h-0 flex items-center justify-center w-full max-w-md relative z-10 py-2">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 text-center space-y-0.5">
                    <p className={`text-[10px] font-light whitespace-nowrap ${isDark ? "text-white/80" : "text-muted-foreground/70"}`}>
                        左右にスピンして他のプレイリストへ
                    </p>
                    <p className={`text-[9px] font-light whitespace-nowrap ${isDark ? "text-white/60" : "text-muted-foreground/50"}`}>
                        右3周で再生成・左3周で全件再生成
                    </p>
                </div>

                <div
                    className="relative w-[min(18rem,42vh)] h-[min(18rem,42vh)] rounded-full transition-shadow duration-200"
                    style={
                        showRegenerateFeedback
                          ? {
                              boxShadow: `0 0 ${29 + regenerateProgress * 58}px ${vinylColors.accentColor}90, 0 0 ${14 + regenerateProgress * 29}px ${vinylColors.accentColor}60`,
                            }
                          : undefined
                    }
                >
                    {/* 固定された影（回転しない） */}
                    <div className="absolute inset-0 rounded-full shadow-2xl pointer-events-none" />
                    
                    <div
                        ref={vinylRef}
                        className={`relative w-full h-full select-none touch-none ${isLoading ? "pointer-events-none cursor-default" : "cursor-grab active:cursor-grabbing"}`}
                        style={{
                            transform: `rotate(${rotation}deg)`,
                            transition: isDragging
                              ? "none"
                              : snapBackDurationMs != null
                                ? `transform ${snapBackDurationMs}ms cubic-bezier(0.6, 0, 1, 1)`
                                : "none",
                        }}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onMouseDown={handleMouseDown}
                        onMouseUp={handleMouseUp}
                    >
                        {/* Vinyl Disc */}
                        <div className="absolute inset-0 rounded-full overflow-hidden">
                            <div className={`absolute inset-0 bg-gradient-to-br ${vinylColors.vinylColor} opacity-85`} />
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
                                <div className="w-[33%] h-[33%] min-w-12 min-h-12 max-w-24 max-h-24 rounded-full bg-card shadow-xl flex items-center justify-center overflow-hidden">
                                    {isLoadingOrEmpty ? (
                                        <div className="w-[83%] h-[83%] rounded-full bg-muted/50 animate-pulse" />
                                    ) : (
                                        <img
                                            src={getImageUrl(currentPlaylist.imageUrl)}
                                            alt={currentPlaylist.title}
                                            className="w-full h-full rounded-full object-cover"
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

                    {/* 3周フィードバック文言（1周超で表示、3周に近づくほど強調） */}
                    {regenerateMessage && (
                        <div
                            className="absolute left-1/2 -translate-x-1/2 -bottom-6 sm:-bottom-9 w-full text-center pointer-events-none transition-opacity duration-150"
                            style={{
                                opacity: 0.7 + regenerateProgress * 0.3,
                            }}
                        >
                            <span
                                className={`text-xs font-medium whitespace-nowrap ${
                                    isDark ? "text-white/90" : "text-foreground/90"
                                }`}
                            >
                                {regenerateMessage}
                            </span>
                        </div>
                    )}

                    {/* Indicator dots（ジャンルごとのテーマカラー。初期同期 stale J-POP または空状態のときはアクティブを現実のレコード色に合わせる） */}
                    <div className="absolute -bottom-8 sm:-bottom-12 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {displayPlaylists.map((item, i) => {
                            const colors = (useRealisticVinyl && i === safeCurrentIndex) ? REALISTIC_VINYL_THEME : getGenreThemeColors(item.genre)
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

            {/* Playlist Info Section（縦幅が狭いときは余白・画像を縮小） */}
            <div className="w-full max-w-md shrink-0 space-y-4 sm:space-y-6 pb-4 relative z-10">
                <div className="text-center space-y-2 sm:space-y-3">
                    <p className={`text-[10px] sm:text-xs uppercase tracking-widest font-light ${genreColorClass}`}>
                        {isLoadingOrEmpty ? getLoadingGenreText(loadingMode) : currentPlaylist.genre}
                    </p>
                    <h2 className={`text-xl sm:text-2xl font-serif leading-tight text-balance ${titleColorClass}`}>
                        {isLoadingOrEmpty ? getLoadingTitleText(loadingMode) : currentPlaylist.title}
                    </h2>
                </div>

                <div className="flex items-center justify-center">
                    {isLoadingOrEmpty ? (
                        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg bg-muted/50 animate-pulse flex items-center justify-center">
                            <Music className={`w-6 h-6 sm:w-8 sm:h-8 ${isDark ? "text-white/30" : "text-muted-foreground/30"}`} />
                        </div>
                    ) : (
                        <img
                            src={getImageUrl(currentPlaylist.imageUrl)}
                            alt={currentPlaylist.title}
                            className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg shadow-lg object-cover"
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

