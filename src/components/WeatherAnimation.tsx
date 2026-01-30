"use client"

import { useWeather } from "@/contexts/WeatherContext"
import { useEffect, useState } from "react"

export default function WeatherAnimation() {
  // Context の単一ソースを使用（背景と常に一致）
  const { effectiveWeather, effectiveTimeOfDay, weatherType } = useWeather()
  const [showLightning, setShowLightning] = useState(false)

  // effectiveTimeOfDay は将来的に時間帯に応じたアニメーションで使用可能
  void effectiveTimeOfDay

  useEffect(() => {
    if (effectiveWeather === "Thunderstorm") {
      const interval = setInterval(() => {
        setShowLightning(true)
        setTimeout(() => setShowLightning(false), 100)
      }, Math.random() * 3000 + 2000)
      return () => clearInterval(interval)
    } else {
      setShowLightning(false)
    }
  }, [effectiveWeather])

  // weatherType が null（天気未取得）の場合はアニメーションを表示しない
  if (!weatherType) return null

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* 雷のフラッシュ */}
      {effectiveWeather === "Thunderstorm" && showLightning && (
        <div className="absolute inset-0 bg-white/20 animate-pulse" />
      )}

      {/* 雨のアニメーション */}
      {(effectiveWeather === "Rain" || effectiveWeather === "Drizzle" || effectiveWeather === "Thunderstorm") && (
        <div className="rain-container">
          {Array.from({
            length: effectiveWeather === "Thunderstorm" ? 100 : effectiveWeather === "Rain" ? 50 : 30,
          }).map((_, i) => (
            <div
              key={i}
              className="rain-drop"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${0.5 + Math.random() * 0.5}s`,
                opacity: effectiveWeather === "Drizzle" ? 0.4 : 0.6,
              }}
            />
          ))}
        </div>
      )}

      {/* 雪のアニメーション */}
      {effectiveWeather === "Snow" && (
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
      {effectiveWeather === "Clouds" && (
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
      {(effectiveWeather === "Mist" || effectiveWeather === "Fog" || effectiveWeather === "Haze") && (
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
      {(effectiveWeather === "Rain" || effectiveWeather === "Thunderstorm") && (
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

