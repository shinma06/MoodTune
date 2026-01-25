"use client"

import { useState, useEffect } from "react"
import WeatherMonitor from "./WeatherMonitor"
import WeatherAnimation from "./WeatherAnimation"
import WeatherTestPanel from "./WeatherTestPanel"
import { useWeather } from "@/contexts/WeatherContext"
import { getWeatherBackground, getTimeOfDay, type WeatherType, isDarkBackground } from "@/lib/weather-background"
import { normalizeWeatherType } from "@/lib/weather-utils"
import { formatGradientBackground } from "@/lib/weather-background-utils"
import { PLAYLISTS } from "@/lib/playlists"
import { useVinylRotation } from "@/hooks/useVinylRotation"

export default function PlaylistExplorer() {
    const [currentIndex, setCurrentIndex] = useState(0)
    const { weatherType, testTimeOfDay, isTestMode } = useWeather()
    const [currentHour, setCurrentHour] = useState(new Date().getHours())

    const currentPlaylist = PLAYLISTS[currentIndex]

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
                setCurrentIndex((prev) => (prev + 1) % PLAYLISTS.length)
            } else {
                setCurrentIndex((prev) => (prev - 1 + PLAYLISTS.length) % PLAYLISTS.length)
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

            {/* Weather Section */}
            <WeatherMonitor />

            {/* Vinyl Record Section */}
            <div className="flex-1 flex items-center justify-center w-full max-w-md relative z-10">
                <p className={`absolute top-0 left-1/2 -translate-x-1/2 text-center text-[10px] font-light whitespace-nowrap ${isDark ? "text-white/80" : "text-muted-foreground/70"}`}>
                    左右にスピンして他のプレイリストへ
                </p>

                <div className="relative w-72 h-72">
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
                        <div className="absolute inset-0 rounded-full overflow-hidden shadow-2xl">
                            <div className={`absolute inset-0 bg-gradient-to-br ${currentPlaylist.vinylColor} opacity-90`} />
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
                                        src={currentPlaylist.coverUrl || "/placeholder.svg"}
                                        alt={currentPlaylist.title}
                                        className="w-20 h-20 rounded-full object-cover"
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
                        {PLAYLISTS.map((_, i) => (
                            <div
                                key={i}
                                className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentIndex ? "w-6" : "bg-border"}`}
                                style={
                                    i === currentIndex
                                        ? {
                                            backgroundColor: currentPlaylist.accentColor,
                                        }
                                        : {}
                                }
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Playlist Info Section */}
            <div className="w-full max-w-md space-y-6 pb-4 relative z-10">
                <div className="text-center space-y-3">
                    <p className={`text-xs uppercase tracking-widest font-light ${genreColorClass}`}>{currentPlaylist.genre}</p>
                    <h2 className={`text-2xl font-serif leading-tight text-balance ${titleColorClass}`}>{currentPlaylist.title}</h2>
                </div>

                <div className="flex items-center justify-center">
                    <img
                        src={currentPlaylist.coverUrl || "/placeholder.svg"}
                        alt={currentPlaylist.title}
                        className="w-32 h-32 rounded-lg shadow-lg object-cover"
                    />
                </div>
            </div>
        </div>
    )
}

