"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Cloud, CloudRain, Sun, CloudSnow, Wind } from "lucide-react"

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

const weatherConditions = [
  { icon: Sun, label: "晴れ", temp: "8°C", description: "冬の晴れた午後" },
  { icon: Cloud, label: "曇り", temp: "5°C", description: "曇り空の穏やかな日" },
  { icon: CloudRain, label: "雨", temp: "6°C", description: "雨音が心地よい" },
  { icon: CloudSnow, label: "雪", temp: "-2°C", description: "静かに降る雪" },
  { icon: Wind, label: "風", temp: "4°C", description: "風の強い冬の日" },
]

export default function PlaylistExplorer() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [rotation, setRotation] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [startY, setStartY] = useState(0)
  const [startRotation, setStartRotation] = useState(0)
  const [currentWeather] = useState(weatherConditions[0])
  const [currentTime, setCurrentTime] = useState(new Date())
  const vinylRef = useRef<HTMLDivElement>(null)

  const currentPlaylist = playlists[currentIndex]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatDateTime = (date: Date) => {
    const year = date.getFullYear().toString().slice(-2)
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const day = date.getDate().toString().padStart(2, "0")
    const hours = date.getHours().toString().padStart(2, "0")
    const minutes = date.getMinutes().toString().padStart(2, "0")
    const weekdays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]
    const weekday = weekdays[date.getDay()]

    return {
      dateString: `${year}/${month}/${day}/${weekday}`,
      timeString: `${hours}:${minutes}`,
    }
  }

  const { dateString, timeString } = formatDateTime(currentTime)

  const calculateRotationFromDrag = (clientX: number, clientY: number) => {
    if (!vinylRef.current) return 0

    const rect = vinylRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const startAngle = Math.atan2(startY - centerY, startX - centerX)
    const currentAngle = Math.atan2(clientY - centerY, clientX - centerX)

    const angleDiff = ((currentAngle - startAngle) * 180) / Math.PI

    return angleDiff
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
    setStartX(e.touches[0].clientX)
    setStartY(e.touches[0].clientY)
    setStartRotation(rotation)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    const angleDiff = calculateRotationFromDrag(e.touches[0].clientX, e.touches[0].clientY)
    setRotation(startRotation + angleDiff)
  }

  const handleTouchEnd = () => {
    if (!isDragging) return
    setIsDragging(false)

    const rotationDiff = rotation - startRotation

    if (rotationDiff >= 40) {
      // 時計回りで次のページへ
      setCurrentIndex((prev) => (prev + 1) % playlists.length)
      setRotation(0)
      setStartRotation(0)
    } else if (rotationDiff <= -40) {
      // 反時計回りで前のページへ
      setCurrentIndex((prev) => (prev - 1 + playlists.length) % playlists.length)
      setRotation(0)
      setStartRotation(0)
    } else {
      // 40°未満の場合は元の位置に戻る
      setRotation(0)
      setStartRotation(0)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setStartX(e.clientX)
    setStartY(e.clientY)
    setStartRotation(rotation)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    const angleDiff = calculateRotationFromDrag(e.clientX, e.clientY)
    setRotation(startRotation + angleDiff)
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
        setRotation(startRotation + angleDiff)
      }
    }
    window.addEventListener("mouseup", handleGlobalMouseUp)
    window.addEventListener("mousemove", handleGlobalMouseMove)
    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp)
      window.removeEventListener("mousemove", handleGlobalMouseMove)
    }
  }, [isDragging, startRotation, startX, startY])

  const WeatherIcon = currentWeather.icon

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-between p-6 pb-8 overflow-hidden touch-none">
      {/* Weather Section */}
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between gap-4">
          {/* 左: 日時（控えめに） */}
          <div className="text-left">
            <p className="text-[10px] text-muted-foreground/60 font-light tracking-wide">{dateString}</p>
            <p className="text-sm text-muted-foreground/80 font-light">{timeString}</p>
          </div>

          {/* 右: 天気と気温（目立たせる） */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-muted-foreground/70 font-light">{currentWeather.description}</p>
              <p className="text-2xl font-serif text-foreground">{currentWeather.temp}</p>
            </div>
            <WeatherIcon className="w-10 h-10 text-accent" strokeWidth={1.5} />
          </div>
        </div>
      </div>

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
