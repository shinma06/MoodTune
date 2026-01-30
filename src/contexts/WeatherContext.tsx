"use client"

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react"
import { getTimeOfDay, isDarkBackground, type TimeOfDay, type WeatherType } from "@/lib/weather-background"
import { normalizeWeatherType } from "@/lib/weather-utils"

interface WeatherContextType {
  /** 表示用の現在時（0–23）。マウント時と1分ごとに更新。 */
  displayHour: number
  /** testTimeOfDay を考慮した表示用時間帯（単一ソース） */
  effectiveTimeOfDay: TimeOfDay
  /** normalizeWeatherType を適用した表示用天気（単一ソース） */
  effectiveWeather: WeatherType
  /** 背景が暗いかどうか（単一ソース） */
  isDark: boolean
  weatherType: string | null
  setWeatherType: (weather: string | null) => void
  /** APIから取得した実際の天気（手動設定をやめるときの復帰用） */
  actualWeatherType: string | null
  setActualWeatherType: (weather: string | null) => void
  testTimeOfDay: TimeOfDay | null
  setTestTimeOfDay: (timeOfDay: TimeOfDay | null) => void
  /** 手動で雰囲気（天気・時間帯）を設定しているか */
  isTestMode: boolean
  setIsTestMode: (isTestMode: boolean) => void
  /** 時間帯・天気変更時にプレイリストを自動更新するか */
  playlistAutoUpdate: boolean
  setPlaylistAutoUpdate: (enabled: boolean) => void
  /** パネルから「プレイリストを再生成」が押されたときのトリガー（インクリメントで発火） */
  playlistRefreshTrigger: number
  requestPlaylistRefresh: () => void
}

const WeatherContext = createContext<WeatherContextType | undefined>(undefined)

export function WeatherProvider({ children }: { children: ReactNode }) {
  const [displayHour, setDisplayHour] = useState(() => new Date().getHours())
  const [weatherType, setWeatherType] = useState<string | null>(null)
  const [actualWeatherType, setActualWeatherType] = useState<string | null>(null)
  const [testTimeOfDay, setTestTimeOfDay] = useState<TimeOfDay | null>(null)
  const [isTestMode, setIsTestMode] = useState(false)
  const [playlistAutoUpdate, setPlaylistAutoUpdate] = useState(true)
  const [playlistRefreshTrigger, setPlaylistRefreshTrigger] = useState(0)

  /** 表示用時刻の単一ソース。マウント時にクライアント現地時刻で補正し、1分ごとに更新（SSR/ハイドレーション・コンポーネント間のずれを防止） */
  useEffect(() => {
    setDisplayHour(new Date().getHours())
    const timer = setInterval(() => setDisplayHour(new Date().getHours()), 60000)
    return () => clearInterval(timer)
  }, [])

  /** testTimeOfDay を考慮した表示用時間帯（単一ソース） */
  const effectiveTimeOfDay = useMemo<TimeOfDay>(() => {
    if (isTestMode && testTimeOfDay) {
      return testTimeOfDay
    }
    return getTimeOfDay(displayHour)
  }, [isTestMode, testTimeOfDay, displayHour])

  /** normalizeWeatherType を適用した表示用天気（単一ソース） */
  const effectiveWeather = useMemo<WeatherType>(() => {
    return normalizeWeatherType(weatherType ?? "Clear")
  }, [weatherType])

  /** 背景が暗いかどうか（単一ソース） */
  const isDark = useMemo(() => {
    return isDarkBackground(effectiveWeather, effectiveTimeOfDay)
  }, [effectiveWeather, effectiveTimeOfDay])

  const requestPlaylistRefresh = () => {
    setPlaylistRefreshTrigger((prev) => prev + 1)
  }

  return (
    <WeatherContext.Provider
      value={{
        displayHour,
        effectiveTimeOfDay,
        effectiveWeather,
        isDark,
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
        playlistRefreshTrigger,
        requestPlaylistRefresh,
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

