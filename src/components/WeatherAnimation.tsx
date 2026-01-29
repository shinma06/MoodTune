"use client"

import { useWeather } from "@/contexts/WeatherContext"
import { getTimeOfDay } from "@/lib/weather-background"
import type { WeatherType } from "@/lib/weather-background"
import { normalizeWeatherType } from "@/lib/weather-utils"
import { useEffect, useState } from "react"

interface WeatherAnimationProps {
  /** 開発用: propsで天気タイプを上書き可能 */
  weatherType?: WeatherType | null
}

export default function WeatherAnimation({ weatherType: propWeatherType }: WeatherAnimationProps = {}) {
  const { weatherType: contextWeatherType } = useWeather()
  const [currentHour, setCurrentHour] = useState(new Date().getHours())
  const [showLightning, setShowLightning] = useState(false)

  const weatherType = propWeatherType ?? contextWeatherType

  /** マウント時に現地時刻で補正し、1分ごとに更新（SSR/ハイドレーションのずれ対策） */
  useEffect(() => {
    setCurrentHour(new Date().getHours())
    const timer = setInterval(() => {
      setCurrentHour(new Date().getHours())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  const timeOfDay = getTimeOfDay(currentHour)
  const weather = weatherType ? normalizeWeatherType(weatherType) : "Clear"

  useEffect(() => {
    if (weather === "Thunderstorm") {
      const interval = setInterval(() => {
        setShowLightning(true)
        setTimeout(() => setShowLightning(false), 100)
      }, Math.random() * 3000 + 2000)
      return () => clearInterval(interval)
    } else {
      setShowLightning(false)
    }
  }, [weather])

  if (!propWeatherType && !contextWeatherType) return null

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* 雷のフラッシュ */}
      {weather === "Thunderstorm" && showLightning && (
        <div className="absolute inset-0 bg-white/20 animate-pulse" />
      )}

      {/* 雨のアニメーション */}
      {(weather === "Rain" || weather === "Drizzle" || weather === "Thunderstorm") && (
        <div className="rain-container">
          {Array.from({
            length: weather === "Thunderstorm" ? 100 : weather === "Rain" ? 50 : 30,
          }).map((_, i) => (
            <div
              key={i}
              className="rain-drop"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${0.5 + Math.random() * 0.5}s`,
                opacity: weather === "Drizzle" ? 0.4 : 0.6,
              }}
            />
          ))}
        </div>
      )}

      {/* 雪のアニメーション */}
      {weather === "Snow" && (
        <div className="snow-container">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="snowflake"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`,
              }}
            >
              ❄
            </div>
          ))}
        </div>
      )}

      {/* 雲のアニメーション */}
      {weather === "Clouds" && (
        <div className="clouds-container">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="cloud"
              style={{
                left: `${i * 33}%`,
                animationDelay: `${i * 2}s`,
                animationDuration: `${20 + i * 5}s`,
              }}
            >
              ☁
            </div>
          ))}
        </div>
      )}

      {/* 霧/もやのアニメーション */}
      {(weather === "Mist" || weather === "Fog" || weather === "Haze") && (
        <div className="fog-container">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="fog-layer"
              style={{
                animationDelay: `${i * 3}s`,
                animationDuration: `${15 + i * 5}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* 画面の水滴効果（雨の場合） */}
      {(weather === "Rain" || weather === "Thunderstorm") && (
        <div className="water-drops">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="water-drop"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 10}s`,
              }}
            />
          ))}
        </div>
      )}

    </div>
  )
}

