"use client"

import { createContext, useContext, useState, ReactNode } from "react"

interface WeatherContextType {
  weatherType: string | null
  setWeatherType: (weather: string | null) => void
}

const WeatherContext = createContext<WeatherContextType | undefined>(undefined)

export function WeatherProvider({ children }: { children: ReactNode }) {
  const [weatherType, setWeatherType] = useState<string | null>(null)

  return (
    <WeatherContext.Provider value={{ weatherType, setWeatherType }}>
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

