"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import type { TimeOfDay } from "@/lib/weather-background"

interface WeatherContextType {
  weatherType: string | null
  setWeatherType: (weather: string | null) => void
  /** APIから取得した実際の天気（テストモードリセット用） */
  actualWeatherType: string | null
  setActualWeatherType: (weather: string | null) => void
  testTimeOfDay: TimeOfDay | null
  setTestTimeOfDay: (timeOfDay: TimeOfDay | null) => void
  isTestMode: boolean
  setIsTestMode: (isTestMode: boolean) => void
  /** 時間帯・天気変更時にプレイリストを自動更新するか */
  playlistAutoUpdate: boolean
  setPlaylistAutoUpdate: (enabled: boolean) => void
}

const WeatherContext = createContext<WeatherContextType | undefined>(undefined)

export function WeatherProvider({ children }: { children: ReactNode }) {
  const [weatherType, setWeatherType] = useState<string | null>(null)
  const [actualWeatherType, setActualWeatherType] = useState<string | null>(null)
  const [testTimeOfDay, setTestTimeOfDay] = useState<TimeOfDay | null>(null)
  const [isTestMode, setIsTestMode] = useState(false)
  const [playlistAutoUpdate, setPlaylistAutoUpdate] = useState(true)

  return (
    <WeatherContext.Provider
      value={{
        weatherType,
        setWeatherType,
        actualWeatherType,
        setActualWeatherType,
        testTimeOfDay,
        setTestTimeOfDay,
        isTestMode,
        setIsTestMode,
        playlistAutoUpdate,
        setPlaylistAutoUpdate,
      }}
    >
      {children}
    </WeatherContext.Provider>
  )
}

export function useWeather() {
  const context = useContext(WeatherContext)
  if (context === undefined) {
    throw new Error("useWeather must be used within a WeatherProvider")
  }
  return context
}

