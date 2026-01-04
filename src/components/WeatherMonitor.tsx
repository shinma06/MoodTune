"use client"

import { useState, useEffect, useCallback } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { useWeather } from "@/contexts/WeatherContext"
import type { WeatherState } from "@/types/weather"
import { formatDateTime, getGeolocationErrorMessage, GEOLOCATION_OPTIONS, getWeatherIcon, getWeatherThemeColor } from "@/lib/weather-utils"
import { getTimeOfDay, type WeatherType } from "@/lib/weather-background"
import { fetchWeatherData } from "@/lib/weather-api"

export default function WeatherMonitor() {
    const [currentTime, setCurrentTime] = useState<Date | null>(null)
    const [weatherState, setWeatherState] = useState<WeatherState>({
        status: "loading",
        message: "位置情報を取得中...",
    })
    const { setWeatherType } = useWeather()

    // 時計の更新（クライアントサイドでのみ実行）
    useEffect(() => {
        // 初回設定
        setCurrentTime(new Date())
        // 1秒ごとに更新
        const timer = setInterval(() => {
            setCurrentTime(new Date())
        }, 1000)
        return () => clearInterval(timer)
    }, [])

    // 天気データの取得と処理
    const handleWeatherFetch = useCallback(async (lat: number, lon: number) => {
        try {
            setWeatherState({ status: "loading", message: "天気を確認中..." })
            const { weatherData, weatherMain } = await fetchWeatherData(lat, lon)
            setWeatherType(weatherMain) // Contextに天気データを設定
            setWeatherState({ status: "success", data: weatherData })
        } catch (error) {
            setWeatherState({
                status: "error",
                message: error instanceof Error ? error.message : "エラーが発生しました",
            })
        }
    }, [setWeatherType])

    // 天気データの取得
    useEffect(() => {
        // 位置情報の取得
        if (!navigator.geolocation) {
            setWeatherState({
                status: "error",
                message: "位置情報サービスが利用できません",
            })
            return
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords
                handleWeatherFetch(latitude, longitude)
            },
            (error) => {
                setWeatherState({
                    status: "error",
                    message: getGeolocationErrorMessage(error),
                })
            },
            GEOLOCATION_OPTIONS
        )
    }, [handleWeatherFetch])


    const dateTime = currentTime ? formatDateTime(currentTime) : { dateString: "--/--/--/---", timeString: "--:--" }
    const { dateString, timeString } = dateTime

    // 時間帯の計算とアイコンの取得
    const currentHour = currentTime?.getHours() ?? new Date().getHours()
    const timeOfDay = getTimeOfDay(currentHour)
    const WeatherIcon = weatherState.status === "success" 
        ? getWeatherIcon(weatherState.data.weatherMain, timeOfDay)
        : null
    const iconColor = weatherState.status === "success"
        ? getWeatherThemeColor(weatherState.data.weatherMain as WeatherType, timeOfDay)
        : undefined

    const handleRetry = () => {
        setWeatherState({ status: "loading", message: "位置情報を取得中..." })
        // 位置情報の再取得
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords
                    handleWeatherFetch(latitude, longitude)
                },
                (error) => {
                    setWeatherState({
                        status: "error",
                        message: getGeolocationErrorMessage(error),
                    })
                },
                GEOLOCATION_OPTIONS
            )
        }
    }

    return (
        <div className="w-full max-w-md">
            <div className="flex items-center justify-between gap-4">
                {/* 左: 日時（控えめに） */}
                <div className="text-left">
                    <p className="text-[10px] text-muted-foreground/60 font-light tracking-wide">{dateString}</p>
                    <p className="text-sm text-muted-foreground/80 font-light">{timeString}</p>
                </div>

                {/* 右: 天気と気温 */}
                <div className="flex items-center gap-3">
                    {weatherState.status === "loading" && (
                        <div className="flex items-center gap-3">
                            <div className="text-right space-y-1">
                                <Skeleton className="h-6 w-16" />
                                <p className="text-xs text-muted-foreground/70 font-light">{weatherState.message}</p>
                            </div>
                            <Skeleton className="w-10 h-10 rounded-full" />
                        </div>
                    )}

                    {weatherState.status === "error" && (
                        <div className="flex flex-col items-end gap-2">
                            <p className="text-xs text-muted-foreground/70 font-light text-right">{weatherState.message}</p>
                            <Button variant="outline" size="sm" onClick={handleRetry}>
                                再試行
                            </Button>
                        </div>
                    )}

                    {weatherState.status === "success" && WeatherIcon && (
                        <>
                            <div className="text-right">
                                <p className="text-2xl font-serif text-foreground">{weatherState.data.temp}</p>
                                <p className="text-xs text-muted-foreground/70 font-light">{weatherState.data.city}</p>
                                {weatherState.data.description && (
                                    <p className="text-[10px] text-muted-foreground/60 font-light">{weatherState.data.description}</p>
                                )}
                            </div>
                            <WeatherIcon className="w-10 h-10" style={{ color: iconColor }} strokeWidth={1.5} />
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
