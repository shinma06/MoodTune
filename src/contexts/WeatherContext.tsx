"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import type { TimeOfDay } from "@/lib/weather-background"

interface WeatherContextType {
  weatherType: string | null
  setWeatherType: (weather: string | null) => void
  actualWeatherType: string | null // APIから取得した実際の天気
  setActualWeatherType: (weather: string | null) => void
  testTimeOfDay: TimeOfDay | null
  setTestTimeOfDay: (timeOfDay: TimeOfDay | null) => void
  isTestMode: boolean
  setIsTestMode: (isTestMode: boolean) => void
}

const WeatherContext = createContext<WeatherContextType | undefined>(undefined)

export function WeatherProvider({ children }: { children: ReactNode }) {
  const [weatherType, setWeatherType] = useState<string | null>(null)
  const [actualWeatherType, setActualWeatherType] = useState<string | null>(null)
  const [testTimeOfDay, setTestTimeOfDay] = useState<TimeOfDay | null>(null)
  const [isTestMode, setIsTestMode] = useState(false)

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

