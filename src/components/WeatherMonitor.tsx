"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { useWeather } from "@/contexts/WeatherContext"
import type { WeatherState } from "@/types/weather"
import { formatDateTime, getWeatherIcon, getWeatherThemeColor, getWeatherThemeColorForDark, normalizeWeatherType } from "@/lib/weather-utils"
import { fetchWeatherData } from "@/lib/weather-api"
import { useGeolocation } from "@/hooks/useGeolocation"

export default function WeatherMonitor() {
    const [currentTime, setCurrentTime] = useState<Date | null>(null)
    const [weatherState, setWeatherState] = useState<WeatherState>({
        status: "loading",
        message: "位置情報を取得中...",
    })
    const { effectiveTimeOfDay, isDark, setWeatherType, setActualWeatherType, weatherType, isMoodTuning } = useWeather()

    const isMoodTuningRef = useRef(isMoodTuning)
    useEffect(() => {
        isMoodTuningRef.current = isMoodTuning
    }, [isMoodTuning])

    /** ポーリング用：最後に取得成功した座標。バックグラウンド再取得で位置情報を再要求しない */
    const lastCoordsRef = useRef<{ lat: number; lon: number } | null>(null)

    /** 初回のみ位置情報を要求するためのフラグ（再レンダーで getCurrentPosition が繰り返し呼ばれるのを防ぐ） */
    const initialRequestDoneRef = useRef(false)

    useEffect(() => {
        setCurrentTime(new Date())
        const timer = setInterval(() => {
            setCurrentTime(new Date())
        }, 1000)
        return () => clearInterval(timer)
    }, [])

    const handleWeatherFetch = useCallback(async (lat: number, lon: number, options?: { background?: boolean }) => {
        const isBackground = options?.background === true
        try {
            if (!isBackground) {
                setWeatherState({ status: "loading", message: "天気を確認中..." })
            }
            const { weatherData, weatherMain } = await fetchWeatherData(lat, lon)
            setActualWeatherType(weatherMain)
            if (!isMoodTuningRef.current) {
                setWeatherType(weatherMain)
            }
            setWeatherState({ status: "success", data: weatherData })
            lastCoordsRef.current = { lat, lon }
        } catch (error) {
            if (!isBackground) {
                setWeatherState({
                    status: "error",
                    message: error instanceof Error ? error.message : "エラーが発生しました",
                })
            }
        }
    }, [setWeatherType, setActualWeatherType])

    /** 10分ごとに天気を再取得。Mood Tuning 中は行わない。初回成功後に lastCoordsRef が設定されてから有効。バックグラウンドで実行しローディング表示は出さない。 */
    useEffect(() => {
        const intervalMs = 10 * 60 * 1000
        const timer = setInterval(() => {
            if (isMoodTuningRef.current) return
            const coords = lastCoordsRef.current
            if (coords) {
                handleWeatherFetch(coords.lat, coords.lon, { background: true })
            }
        }, intervalMs)
        return () => clearInterval(timer)
    }, [handleWeatherFetch])

    const onGeolocationSuccess = useCallback(
        (position: GeolocationPosition) => {
            const { latitude, longitude } = position.coords
            handleWeatherFetch(latitude, longitude)
        },
        [handleWeatherFetch]
    )
    const onGeolocationError = useCallback((error: string) => {
        setWeatherState({ status: "error", message: error })
    }, [])

    const { requestGeolocation } = useGeolocation({
        onSuccess: onGeolocationSuccess,
        onError: onGeolocationError,
    })

    useEffect(() => {
        if (initialRequestDoneRef.current) return
        initialRequestDoneRef.current = true
        requestGeolocation()
    }, [requestGeolocation])


    const dateTime = currentTime ? formatDateTime(currentTime) : { dateString: "--/--/--/---", timeString: "--:--" }
    const { dateString, timeString } = dateTime

    // アイコン・気温表示用（天気取得成功時のみ表示）
    const displayWeatherType = isMoodTuning && weatherType
        ? normalizeWeatherType(weatherType)
        : weatherState.status === "success"
        ? normalizeWeatherType(weatherState.data.weatherMain)
        : null
    
    const WeatherIcon = displayWeatherType
        ? getWeatherIcon(displayWeatherType, effectiveTimeOfDay)
        : null
    
    // isDark は Context の単一ソースから取得（背景と常に一致）
    const iconColor = displayWeatherType
        ? isDark
            ? getWeatherThemeColorForDark(displayWeatherType, effectiveTimeOfDay)
            : getWeatherThemeColor(displayWeatherType, effectiveTimeOfDay)
        : undefined
    
    const textColorClass = isDark ? "text-white" : ""
    const mutedTextColorClass = isDark ? "text-white/80" : "text-muted-foreground/60"
    const mutedTextColorClass2 = isDark ? "text-white/70" : "text-muted-foreground/70"
    const mutedTextColorClass3 = isDark ? "text-white/60" : "text-muted-foreground/80"

    const handleRetry = () => {
        setWeatherState({ status: "loading", message: "位置情報を取得中..." })
        requestGeolocation()
    }

    return (
        <div className="w-full max-w-md relative z-10">
            <div className="flex items-center justify-between gap-4">
                {/* 左: 日時（控えめに） */}
                <div className="text-left">
                    <p className={`text-[10px] font-light tracking-wide ${mutedTextColorClass}`}>{dateString}</p>
                    <p className={`text-sm font-light ${mutedTextColorClass3}`}>{timeString}</p>
                </div>

                {/* 右: 天気と気温 */}
                <div className="flex items-center gap-3">
                    {weatherState.status === "loading" && (
                        <div className="flex items-center gap-3">
                            <div className="text-right space-y-1">
                                <Skeleton className="h-6 w-16" />
                                <p className={`text-xs font-light ${mutedTextColorClass2}`}>{weatherState.message}</p>
                            </div>
                            <Skeleton className="w-10 h-10 rounded-full" />
                        </div>
                    )}

                    {weatherState.status === "error" && (
                        <div className="flex flex-col items-end gap-2">
                            <p className={`text-xs font-light text-right ${mutedTextColorClass2}`}>{weatherState.message}</p>
                            <Button variant="outline" size="sm" onClick={handleRetry}>
                                再試行
                            </Button>
                        </div>
                    )}

                    {weatherState.status === "success" && WeatherIcon && (
                        <>
                            <div className="text-right">
                                <p className={`text-2xl font-serif ${textColorClass || "text-foreground"}`}>{weatherState.data.temp}</p>
                                <p className={`text-xs font-light ${mutedTextColorClass2}`}>{weatherState.data.city}</p>
                                {weatherState.data.description && (
                                    <p className={`text-[10px] font-light ${mutedTextColorClass}`}>{weatherState.data.description}</p>
                                )}
                            </div>
                            <WeatherIcon 
                                className="w-10 h-10" 
                                style={{ color: iconColor }} 
                                strokeWidth={1.5} 
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
