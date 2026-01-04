"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import WeatherMonitor from "./WeatherMonitor"
import { useWeather } from "@/contexts/WeatherContext"
import { getWeatherBackground, getTimeOfDay, type WeatherType } from "@/lib/weather-background"

type Playlist = {
    id: string
    genre: string
    title: string
    coverUrl: string
    vinylColor: string
    accentColor: string
}

const playlists: Playlist[] = [
    {
        id: "1",
        genre: "チルアウト",
        title: "冬の午後のジャズ",
        coverUrl: "/cozy-winter-jazz-album-cover.jpg",
        vinylColor: "from-amber-900 to-amber-950",
        accentColor: "#d97706",
    },
    {
        id: "2",
        genre: "アンビエント",
        title: "雨音とピアノ",
        coverUrl: "/rain-piano-ambient-album-cover.jpg",
        vinylColor: "from-slate-700 to-slate-900",
        accentColor: "#64748b",
    },
    {
        id: "3",
        genre: "クラシック",
        title: "穏やかな朝のための弦楽",
        coverUrl: "/classical-morning-strings-album-cover.jpg",
        vinylColor: "from-emerald-800 to-emerald-950",
        accentColor: "#059669",
    },
    {
        id: "4",
        genre: "ローファイヒップホップ",
        title: "作業用BGM",
        coverUrl: "/lofi-hiphop-study-music-album-cover.jpg",
        vinylColor: "from-purple-900 to-purple-950",
        accentColor: "#7c3aed",
    },
    {
        id: "5",
        genre: "アコースティック",
        title: "夕暮れのフォークソング",
        coverUrl: "/sunset-folk-acoustic-album-cover.jpg",
        vinylColor: "from-orange-800 to-orange-950",
        accentColor: "#ea580c",
    },
]

export default function PlaylistExplorer() {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [rotation, setRotation] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const [startX, setStartX] = useState(0)
    const [startY, setStartY] = useState(0)
    const [startRotation, setStartRotation] = useState(0)
    const [totalRotation, setTotalRotation] = useState(0) // 累積回転角度を追跡
    const vinylRef = useRef<HTMLDivElement>(null)
    const { weatherType } = useWeather()
    const [currentHour, setCurrentHour] = useState(new Date().getHours())

    const currentPlaylist = playlists[currentIndex]

    // 時間の更新（1分ごと）
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentHour(new Date().getHours())
        }, 60000) // 1分ごとに更新
        return () => clearInterval(timer)
    }, [])

    // 背景色の計算
    const timeOfDay = getTimeOfDay(currentHour)
    const weather = (weatherType || "Clear") as WeatherType
    const background = getWeatherBackground(weather, timeOfDay)

    // 角度を-180から180の範囲に正規化
    const normalizeAngle = (angle: number): number => {
        let normalized = angle % 360
        if (normalized > 180) {
            normalized -= 360
        } else if (normalized < -180) {
            normalized += 360
        }
        return normalized
    }

    // 2つの角度間の最短角度差を計算（-180から180の範囲）
    const getAngleDifference = (angle1: number, angle2: number): number => {
        let diff = angle2 - angle1
        if (diff > 180) {
            diff -= 360
        } else if (diff < -180) {
            diff += 360
        }
        return diff
    }

    const calculateRotationFromDrag = (clientX: number, clientY: number): number => {
        if (!vinylRef.current) return 0

        const rect = vinylRef.current.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2

        const startAngleRad = Math.atan2(startY - centerY, startX - centerX)
        const currentAngleRad = Math.atan2(clientY - centerY, clientX - centerX)

        // ラジアンを度数に変換
        const startAngleDeg = (startAngleRad * 180) / Math.PI
        const currentAngleDeg = (currentAngleRad * 180) / Math.PI

        // 角度差を計算（360度境界を考慮）
        const angleDiff = getAngleDifference(startAngleDeg, currentAngleDeg)

        return angleDiff
    }

    const handleTouchStart = (e: React.TouchEvent) => {
        setIsDragging(true)
        setStartX(e.touches[0].clientX)
        setStartY(e.touches[0].clientY)
        setStartRotation(rotation)
        setTotalRotation(0) // ドラッグ開始時に累積角度をリセット
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return
        const angleDiff = calculateRotationFromDrag(e.touches[0].clientX, e.touches[0].clientY)
        const newRotation = startRotation + angleDiff
        setRotation(newRotation)
        setTotalRotation(angleDiff) // 累積回転角度を更新
    }

    const handleTouchEnd = useCallback(() => {
        if (!isDragging) return
        setIsDragging(false)

        // 累積回転角度を使用して判定（より正確）
        const rotationDiff = totalRotation
        const ROTATION_THRESHOLD = 45 // 閾値を45度に調整（より明確な判定）

        if (rotationDiff >= ROTATION_THRESHOLD) {
            // 時計回りで次のページへ
            setCurrentIndex((prev) => (prev + 1) % playlists.length)
            setRotation(0)
            setStartRotation(0)
            setTotalRotation(0)
        } else if (rotationDiff <= -ROTATION_THRESHOLD) {
            // 反時計回りで前のページへ
            setCurrentIndex((prev) => (prev - 1 + playlists.length) % playlists.length)
            setRotation(0)
            setStartRotation(0)
            setTotalRotation(0)
        } else {
            // 閾値未満の場合は元の位置に戻る
            setRotation(0)
            setStartRotation(0)
            setTotalRotation(0)
        }
    }, [isDragging, totalRotation, playlists.length])

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true)
        setStartX(e.clientX)
        setStartY(e.clientY)
        setStartRotation(rotation)
        setTotalRotation(0) // ドラッグ開始時に累積角度をリセット
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return
        const angleDiff = calculateRotationFromDrag(e.clientX, e.clientY)
        const newRotation = startRotation + angleDiff
        setRotation(newRotation)
        setTotalRotation(angleDiff) // 累積回転角度を更新
    }

    const handleMouseUp = () => {
        handleTouchEnd()
    }

    useEffect(() => {
        const handleGlobalMouseUp = () => {
            if (isDragging) {
                handleTouchEnd()
            }
        }
        const handleGlobalMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                const angleDiff = calculateRotationFromDrag(e.clientX, e.clientY)
                const newRotation = startRotation + angleDiff
                setRotation(newRotation)
                setTotalRotation(angleDiff) // 累積回転角度を更新
            }
        }
        window.addEventListener("mouseup", handleGlobalMouseUp)
        window.addEventListener("mousemove", handleGlobalMouseMove)
        return () => {
            window.removeEventListener("mouseup", handleGlobalMouseUp)
            window.removeEventListener("mousemove", handleGlobalMouseMove)
        }
    }, [isDragging, startRotation, startX, startY, handleTouchEnd])

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-between p-6 pb-8 overflow-hidden touch-none transition-all duration-1000 ease-in-out"
            style={{
                background: `linear-gradient(to bottom, ${background.from}, ${background.via || background.from}, ${background.to})`,
            }}
        >
            {/* Weather Section */}
            <WeatherMonitor />

            {/* Vinyl Record Section */}
            <div className="flex-1 flex items-center justify-center w-full max-w-md relative">
                <p className="absolute top-0 left-1/2 -translate-x-1/2 text-center text-[10px] text-muted-foreground/70 font-light whitespace-nowrap">
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
                        {playlists.map((_, i) => (
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
            <div className="w-full max-w-md space-y-6 pb-4">
                <div className="text-center space-y-3">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground font-light">{currentPlaylist.genre}</p>
                    <h2 className="text-2xl font-serif text-foreground leading-tight text-balance">{currentPlaylist.title}</h2>
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

