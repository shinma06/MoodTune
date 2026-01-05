"use client"

import { useWeather } from "@/contexts/WeatherContext"
import { getTimeOfDay } from "@/lib/weather-background"
import type { WeatherType } from "@/lib/weather-background"
import { useEffect, useState } from "react"

interface WeatherAnimationProps {
  weatherType?: WeatherType | null // propsで天気タイプを渡せるように（開発用）
}

export default function WeatherAnimation({ weatherType: propWeatherType }: WeatherAnimationProps = {}) {
  const { weatherType: contextWeatherType } = useWeather()
  const [currentHour, setCurrentHour] = useState(new Date().getHours())
  const [showLightning, setShowLightning] = useState(false)

  // propsで渡された天気タイプを優先、なければContextから取得
  const weatherType = propWeatherType ?? contextWeatherType

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHour(new Date().getHours())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  const timeOfDay = getTimeOfDay(currentHour)
  const weather = (weatherType || "Clear") as WeatherType

  // 雷雨のフラッシュ効果
  useEffect(() => {
    if (weather === "Thunderstorm") {
      const interval = setInterval(() => {
        setShowLightning(true)
        setTimeout(() => setShowLightning(false), 100)
      }, Math.random() * 3000 + 2000) // 2-5秒間隔
      return () => clearInterval(interval)
    } else {
      setShowLightning(false)
    }
  }, [weather])

  // propsで天気タイプが渡されている場合は常に表示、Contextの場合は天気タイプがない場合は非表示
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

      {/* 砂塵のアニメーション */}
      {(weather === "Dust" || weather === "Sand") && (
        <div className="dust-container">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="dust-particle"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${4 + Math.random() * 3}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* 竜巻のアニメーション */}
      {weather === "Tornado" && (
        <div className="tornado-container">
          <div className="tornado-spiral" />
        </div>
      )}

      {/* スコールのアニメーション（強い風と雨） */}
      {weather === "Squall" && (
        <>
          <div className="rain-container">
            {Array.from({ length: 60 }).map((_, i) => (
              <div
                key={i}
                className="rain-drop squall-rain"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${0.3 + Math.random() * 0.3}s`,
                  transform: `rotate(${Math.random() * 20 - 10}deg)`,
                }}
              />
            ))}
          </div>
          <div className="wind-lines">
            {Array.from({ length: 15 }).map((_, i) => (
              <div
                key={i}
                className="wind-line"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

