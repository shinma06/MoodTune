"use client"

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react"
import { getTimeOfDay, isDarkBackground, type TimeOfDay, type WeatherType } from "@/lib/weather-background"
import { normalizeWeatherType } from "@/lib/weather-utils"

interface WeatherContextType {
  /** クライアントで現在時刻が確定したか（SSR/初回は false。useEffect で true になり時間帯背景が有効になる） */
  isTimeInitialized: boolean
  /** 表示用の現在時（0–23）。マウント時と1分ごとに更新。 */
  displayHour: number
  /** moodTuningTimeOfDay を考慮した表示用時間帯（単一ソース） */
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
  /** Mood Tuning で手動設定した時間帯 */
  moodTuningTimeOfDay: TimeOfDay | null
  setMoodTuningTimeOfDay: (timeOfDay: TimeOfDay | null) => void
  /** Mood Tuning で手動設定中か（天気・時間帯を上書きしているか） */
  isMoodTuning: boolean
  setIsMoodTuning: (enabled: boolean) => void
  /** 時間帯・天気変更時にプレイリストを自動更新するか */
  playlistAutoUpdate: boolean
  setPlaylistAutoUpdate: (enabled: boolean) => void
  /** パネルから「プレイリストを再構築」が押されたときのトリガー（インクリメントで発火） */
  playlistRefreshTrigger: number
  requestPlaylistRefresh: () => void
}

const WeatherContext = createContext<WeatherContextType | undefined>(undefined)

export function WeatherProvider({ children }: { children: ReactNode }) {
  /** SSR/初回は false。useEffect でクライアント現地時刻を設定したあと true にし、時間帯に応じた背景を有効にする */
  const [isTimeInitialized, setIsTimeInitialized] = useState(false)
  const [displayHour, setDisplayHour] = useState(0)
  const [weatherType, setWeatherType] = useState<string | null>(null)
  const [actualWeatherType, setActualWeatherType] = useState<string | null>(null)
  const [moodTuningTimeOfDay, setMoodTuningTimeOfDay] = useState<TimeOfDay | null>(null)
  const [isMoodTuning, setIsMoodTuning] = useState(false)
  const [playlistAutoUpdate, setPlaylistAutoUpdate] = useState(true)
  const [playlistRefreshTrigger, setPlaylistRefreshTrigger] = useState(0)

  /** 表示用時刻の単一ソース。マウント時にクライアント現地時刻で設定し、1分ごとに更新。SSR のサーバー時刻に依存しない。 */
  useEffect(() => {
    setDisplayHour(new Date().getHours())
    setIsTimeInitialized(true)
    const timer = setInterval(() => setDisplayHour(new Date().getHours()), 60000)
    return () => clearInterval(timer)
  }, [])

  /** moodTuningTimeOfDay を考慮した表示用時間帯（単一ソース）。未初期化時は day を返し UI を明るいテーマに揃える。 */
  const effectiveTimeOfDay = useMemo<TimeOfDay>(() => {
    if (!isTimeInitialized) return "day"
    if (isMoodTuning && moodTuningTimeOfDay) {
      return moodTuningTimeOfDay
    }
    return getTimeOfDay(displayHour)
  }, [isTimeInitialized, isMoodTuning, moodTuningTimeOfDay, displayHour])

  /** normalizeWeatherType を適用した表示用天気（単一ソース） */
  const effectiveWeather = useMemo<WeatherType>(() => {
    return normalizeWeatherType(weatherType ?? "Clear")
  }, [weatherType])

  /** 背景が暗いかどうか（単一ソース）。未初期化時は false で中性背景時の UI と揃える。 */
  const isDark = useMemo(() => {
    if (!isTimeInitialized) return false
    return isDarkBackground(effectiveWeather, effectiveTimeOfDay)
  }, [isTimeInitialized, effectiveWeather, effectiveTimeOfDay])

  const requestPlaylistRefresh = () => {
    setPlaylistRefreshTrigger((prev) => prev + 1)
  }

  return (
    <WeatherContext.Provider
      value={{
        isTimeInitialized,
        displayHour,
        effectiveTimeOfDay,
        effectiveWeather,
        isDark,
        weatherType,
        setWeatherType,
        actualWeatherType,
        setActualWeatherType,
        moodTuningTimeOfDay,
        setMoodTuningTimeOfDay,
        isMoodTuning,
        setIsMoodTuning,
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

