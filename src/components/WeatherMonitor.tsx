"use client"

import { useState, useEffect } from "react"
import { Cloud, CloudRain, Sun, CloudSnow, Wind, LucideIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

// OpenWeatherMap APIレスポンスの型定義
interface WeatherApiResponse {
    main: {
        temp: number
        feels_like: number
        temp_min: number
        temp_max: number
        pressure: number
        humidity: number
    }
    name: string
    weather: Array<{
        id: number
        main: string
        description: string
        icon: string
    }>
    coord: {
        lat: number
        lon: number
    }
}

// 天気データの型定義
interface WeatherData {
    icon: LucideIcon
    temp: string
    city: string
    description: string
}

// 天候の種類に応じたアイコンのマッピング
const getWeatherIcon = (weatherMain: string): LucideIcon => {
    const iconMap: Record<string, LucideIcon> = {
        Clear: Sun,
        Clouds: Cloud,
        Rain: CloudRain,
        Drizzle: CloudRain,
        Thunderstorm: CloudRain,
        Snow: CloudSnow,
        Mist: Cloud,
        Fog: Cloud,
        Haze: Cloud,
        Dust: Wind,
        Sand: Wind,
        Ash: Wind,
        Squall: Wind,
        Tornado: Wind,
    }
    return iconMap[weatherMain] || Sun
}

type WeatherState =
    | { status: "loading"; message: string }
    | { status: "error"; message: string }
    | { status: "success"; data: WeatherData }

export default function WeatherMonitor() {
    const [currentTime, setCurrentTime] = useState<Date | null>(null)
    const [weatherState, setWeatherState] = useState<WeatherState>({
        status: "loading",
        message: "位置情報を取得中...",
    })

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

    // 天気データの取得
    useEffect(() => {
        const fetchWeather = async (lat: number, lon: number) => {
            try {
                setWeatherState({ status: "loading", message: "天気を確認中..." })

                const response = await fetch(`/api/weather?lat=${lat}&lon=${lon}`)

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}))
                    throw new Error(errorData.error || "天気情報の取得に失敗しました")
                }

                const data: WeatherApiResponse = await response.json()

                const weatherData: WeatherData = {
                    icon: getWeatherIcon(data.weather[0]?.main || "Clear"),
                    temp: `${Math.round(data.main.temp)}°C`,
                    city: data.name,
                    description: data.weather[0]?.description || "",
                }

                setWeatherState({ status: "success", data: weatherData })
            } catch (error) {
                setWeatherState({
                    status: "error",
                    message: error instanceof Error ? error.message : "エラーが発生しました",
                })
            }
        }

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
                fetchWeather(latitude, longitude)
            },
            (error) => {
                let errorMessage = "位置情報の取得に失敗しました"
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = "位置情報の許可が必要です"
                        break
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = "位置情報が利用できません"
                        break
                    case error.TIMEOUT:
                        errorMessage = "位置情報の取得がタイムアウトしました"
                        break
                }
                setWeatherState({ status: "error", message: errorMessage })
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        )
    }, [])

    const formatDateTime = (date: Date) => {
        const year = date.getFullYear().toString().slice(-2)
        const month = (date.getMonth() + 1).toString().padStart(2, "0")
        const day = date.getDate().toString().padStart(2, "0")
        const hours = date.getHours().toString().padStart(2, "0")
        const minutes = date.getMinutes().toString().padStart(2, "0")
        const weekdays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]
        const weekday = weekdays[date.getDay()]

        return {
            dateString: `${year}/${month}/${day}/${weekday}`,
            timeString: `${hours}:${minutes}`,
        }
    }

    const dateTime = currentTime ? formatDateTime(currentTime) : { dateString: "--/--/--/---", timeString: "--:--" }
    const { dateString, timeString } = dateTime

    const handleRetry = () => {
        setWeatherState({ status: "loading", message: "位置情報を取得中..." })
        // 位置情報の再取得
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords
                    fetch(`/api/weather?lat=${latitude}&lon=${longitude}`)
                        .then(async (response) => {
                            if (!response.ok) {
                                const errorData = await response.json().catch(() => ({}))
                                throw new Error(errorData.error || "天気情報の取得に失敗しました")
                            }
                            return response.json()
                        })
                        .then((data: WeatherApiResponse) => {
                            const weatherData: WeatherData = {
                                icon: getWeatherIcon(data.weather[0]?.main || "Clear"),
                                temp: `${Math.round(data.main.temp)}°C`,
                                city: data.name,
                                description: data.weather[0]?.description || "",
                            }
                            setWeatherState({ status: "success", data: weatherData })
                        })
                        .catch((error) => {
                            setWeatherState({
                                status: "error",
                                message: error instanceof Error ? error.message : "エラーが発生しました",
                            })
                        })
                },
                (error) => {
                    let errorMessage = "位置情報の取得に失敗しました"
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = "位置情報の許可が必要です"
                            break
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = "位置情報が利用できません"
                            break
                        case error.TIMEOUT:
                            errorMessage = "位置情報の取得がタイムアウトしました"
                            break
                    }
                    setWeatherState({ status: "error", message: errorMessage })
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0,
                }
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

                    {weatherState.status === "success" && (
                        <>
                            <div className="text-right">
                                <p className="text-2xl font-serif text-foreground">{weatherState.data.temp}</p>
                                <p className="text-xs text-muted-foreground/70 font-light">{weatherState.data.city}</p>
                                {weatherState.data.description && (
                                    <p className="text-[10px] text-muted-foreground/60 font-light">{weatherState.data.description}</p>
                                )}
                            </div>
                            <weatherState.data.icon className="w-10 h-10 text-accent" strokeWidth={1.5} />
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
