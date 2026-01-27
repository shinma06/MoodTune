"use client"

import { useState, useEffect } from "react"
import WeatherMonitor from "./WeatherMonitor"
import WeatherAnimation from "./WeatherAnimation"
import WeatherTestPanel from "./WeatherTestPanel"
import GenreSelector, { useSelectedGenres } from "./GenreSelector"
import { useWeather } from "@/contexts/WeatherContext"
import { getWeatherBackground, getTimeOfDay, type WeatherType, isDarkBackground } from "@/lib/weather-background"
import { normalizeWeatherType } from "@/lib/weather-utils"
import { formatGradientBackground } from "@/lib/weather-background-utils"
import { PLAYLISTS } from "@/lib/playlists"
import { useVinylRotation } from "@/hooks/useVinylRotation"
import { Music } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Genre } from "@/lib/constants"
import { generateDashboard, type DashboardItem } from "@/app/actions/generateDashboard"
import type { TimeOfDay } from "@/lib/weather-background"

interface PlaylistExplorerProps {
  playlists?: DashboardItem[]
}

// デフォルトのvinylColorとaccentColorを生成する関数
function getDefaultColors(index: number) {
  const colors = [
    { vinylColor: "from-amber-900 to-amber-950", accentColor: "#d97706" },
    { vinylColor: "from-slate-700 to-slate-900", accentColor: "#64748b" },
    { vinylColor: "from-emerald-800 to-emerald-950", accentColor: "#059669" },
    { vinylColor: "from-purple-900 to-purple-950", accentColor: "#7c3aed" },
    { vinylColor: "from-orange-800 to-orange-950", accentColor: "#ea580c" },
  ]
  return colors[index % colors.length]
}

export default function PlaylistExplorer({ playlists: initialPlaylists }: PlaylistExplorerProps = {}) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const { weatherType, testTimeOfDay, isTestMode } = useWeather()
    const [currentHour, setCurrentHour] = useState(new Date().getHours())
    const [showSettings, setShowSettings] = useState(false)
    const selectedGenres = useSelectedGenres()
    const [playlists, setPlaylists] = useState<DashboardItem[] | null>(initialPlaylists || null)
    const [isLoading, setIsLoading] = useState(false)
    
    // ジャンル変更時のコールバック
    const handleGenresChange = async (genres: Genre[]) => {
        if (genres.length === 0) return
        
        setIsLoading(true)
        try {
            const weather = normalizeWeatherType(weatherType || "Clear") as WeatherType
            const calculatedTimeOfDay = getTimeOfDay(currentHour)
            const time = (isTestMode && testTimeOfDay ? testTimeOfDay : calculatedTimeOfDay) as TimeOfDay
            
            const generatedPlaylists = await generateDashboard(weather, time, genres)
            setPlaylists(generatedPlaylists)
            setCurrentIndex(0) // リセット
        } catch (error) {
            console.error("Failed to generate dashboard:", error)
        } finally {
            setIsLoading(false)
        }
    }

    // 使用するプレイリストデータ（動的データがあればそれを使用、なければ静的データ）
    const displayPlaylists = playlists || PLAYLISTS.map((p, i) => ({
        id: p.id,
        genre: p.genre,
        title: p.title,
        query: "",
        imageUrl: p.coverUrl,
    }))
    
    const currentPlaylist = displayPlaylists[currentIndex]
    const defaultColors = getDefaultColors(currentIndex)

    // 時間の更新（1分ごと）
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentHour(new Date().getHours())
        }, 60000)
        return () => clearInterval(timer)
    }, [])

    // 背景色の計算
    const calculatedTimeOfDay = getTimeOfDay(currentHour)
    const timeOfDay = isTestMode && testTimeOfDay ? testTimeOfDay : calculatedTimeOfDay
    const weather = normalizeWeatherType(weatherType || "Clear")
    const background = getWeatherBackground(weather, timeOfDay)
    
    // 背景が暗いかどうかを判定
    const isDark = isDarkBackground(weather, timeOfDay)
    
    // 背景が暗い場合のテキスト色クラス
    const genreColorClass = isDark ? "text-white/80" : "text-muted-foreground"
    const titleColorClass = isDark ? "text-white" : "text-foreground"

    // レコード盤の回転管理
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
            if (direction === "next") {
                setCurrentIndex((prev) => (prev + 1) % displayPlaylists.length)
            } else {
                setCurrentIndex((prev) => (prev - 1 + displayPlaylists.length) % displayPlaylists.length)
            }
        },
    })

    // 画像URLの取得（空文字の場合はプレースホルダー）
    const getImageUrl = (url: string | undefined | null): string => {
        if (!url || url.trim() === "") {
            return "/placeholder.svg"
        }
        return url
    }

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

            {/* Settings Toggle Button */}
            <div className="fixed top-4 right-4 z-50">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowSettings(!showSettings)}
                    className={`
                        w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border-border/50
                        ${showSettings ? "bg-primary text-primary-foreground" : ""}
                    `}
                >
                    <Music className="w-5 h-5" />
                </Button>
            </div>

            {/* Settings Panel with Genre Selector */}
            {showSettings && (
                <div className="fixed top-16 right-4 z-50 w-80 max-w-[calc(100vw-2rem)]">
                    <GenreSelector onGenresChange={handleGenresChange} />
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
                            <div className={`absolute inset-0 bg-gradient-to-br ${defaultColors.vinylColor} opacity-90`} />
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
                                    <img
                                        src={getImageUrl(currentPlaylist.imageUrl)}
                                        alt={currentPlaylist.title}
                                        className="w-20 h-20 rounded-full object-cover"
                                        onError={(e) => {
                                            // 画像読み込みエラー時のフォールバック
                                            const target = e.target as HTMLImageElement
                                            target.src = "/placeholder.svg"
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-4 h-4 rounded-full bg-background shadow-inner" />
                            </div>
                        </div>
                    </div>

                    {/* Indicator dots */}
                    <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {displayPlaylists.map((_, i) => {
                            const colors = getDefaultColors(i)
                            return (
                                <div
                                    key={i}
                                    className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentIndex ? "w-6" : "bg-border"}`}
                                    style={
                                        i === currentIndex
                                            ? {
                                                backgroundColor: colors.accentColor,
                                            }
                                            : {}
                                    }
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
                        {isLoading ? "読み込み中..." : currentPlaylist.genre}
                    </p>
                    <h2 className={`text-2xl font-serif leading-tight text-balance ${titleColorClass}`}>
                        {isLoading ? "プレイリストを生成中" : currentPlaylist.title}
                    </h2>
                </div>

                <div className="flex items-center justify-center">
                    {isLoading ? (
                        <div className="w-32 h-32 rounded-lg bg-muted/50 animate-pulse flex items-center justify-center">
                            <Music className={`w-8 h-8 ${isDark ? "text-white/30" : "text-muted-foreground/30"}`} />
                        </div>
                    ) : (
                        <img
                            src={getImageUrl(currentPlaylist.imageUrl)}
                            alt={currentPlaylist.title}
                            className="w-32 h-32 rounded-lg shadow-lg object-cover"
                            onError={(e) => {
                                // 画像読み込みエラー時のフォールバック
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

