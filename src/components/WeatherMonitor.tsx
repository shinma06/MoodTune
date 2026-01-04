"use client"

import { useState, useEffect } from "react"
import { Cloud, CloudRain, Sun, CloudSnow, Wind, LucideIcon } from "lucide-react"

type WeatherData = {
  icon: LucideIcon
  label: string
  temp: string
  description?: string
}

const weatherConditions: WeatherData[] = [
  { icon: Sun, label: "晴れ", temp: "8°C", description: "冬の晴れた午後" },
  { icon: Cloud, label: "曇り", temp: "5°C", description: "曇り空の穏やかな日" },
  { icon: CloudRain, label: "雨", temp: "6°C", description: "雨音が心地よい" },
  { icon: CloudSnow, label: "雪", temp: "-2°C", description: "静かに降る雪" },
  { icon: Wind, label: "風", temp: "4°C", description: "風の強い冬の日" },
]

export default function WeatherMonitor() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [currentWeather] = useState<WeatherData>(weatherConditions[0])

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
  const WeatherIcon = currentWeather.icon

  return (
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
            <p className="text-2xl font-serif text-foreground">{currentWeather.temp}</p>
          </div>
          <WeatherIcon className="w-10 h-10 text-accent" strokeWidth={1.5} />
        </div>
      </div>
    </div>
  )
}

