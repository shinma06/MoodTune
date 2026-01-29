"use client"

import { useState, useEffect, useRef } from "react"
import { useWeather } from "@/contexts/WeatherContext"
import { getWeatherIcon, getWeatherThemeColor, normalizeWeatherType } from "@/lib/weather-utils"
import { getTimeOfDay } from "@/lib/weather-background"
import type { WeatherType, TimeOfDay } from "@/lib/weather-background"
import { WEATHER_TYPES, TIME_OF_DAY_OPTIONS, WEATHER_TYPE_LABELS } from "@/lib/constants"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { X, Sparkles } from "lucide-react"

export default function WeatherTestPanel() {
  const {
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
    requestPlaylistRefresh,
  } = useWeather()
  const [isOpen, setIsOpen] = useState(false)
  const prevOpenRef = useRef(false)
  /** パネルを開いた時点の天気・時間（閉じたときに「開く前から変更があったか」の判定用） */
  const openedWeatherTypeRef = useRef<string | null>(null)
  const openedTimeOfDayRef = useRef<TimeOfDay | null>(null)

  /** パネルを開いたときに現在の天気・時間をスナップショット */
  useEffect(() => {
    const justOpened = isOpen && !prevOpenRef.current
    prevOpenRef.current = isOpen
    if (justOpened) {
      openedWeatherTypeRef.current = weatherType
      openedTimeOfDayRef.current = testTimeOfDay
    }
  }, [isOpen, weatherType, testTimeOfDay])

  /** 雰囲気（天気）・時間帯は即時Contextに反映（UIのみ。プレイリストは閉じたときのみ更新） */
  const handleWeatherTypeChange = (type: WeatherType) => {
    setWeatherType(type)
    setIsTestMode(true)
  }

  const handleTimeOfDayChange = (timeOfDay: TimeOfDay) => {
    setTestTimeOfDay(timeOfDay)
    setIsTestMode(true)
  }

  /** 閉じたとき: 開いた時点から天気・時間が変わっている場合のみプレイリストを再生成 */
  const handleClosePanel = () => {
    const weatherChanged = weatherType !== openedWeatherTypeRef.current
    const timeChanged = testTimeOfDay !== openedTimeOfDayRef.current
    if (weatherChanged || timeChanged) requestPlaylistRefresh()
    setIsOpen(false)
  }

  /** リセットは即時反映（Contextを実際の天気・時間に戻す。プレイリストは閉じたときに判定） */
  const handleReset = () => {
    if (actualWeatherType) {
      setWeatherType(actualWeatherType)
    } else {
      setWeatherType(null)
    }
    setTestTimeOfDay(null)
    setIsTestMode(false)
  }

  /** 表示用: Contextの現在値（即時反映のためパネル内外で同一） */
  const currentWeatherType = weatherType ? normalizeWeatherType(weatherType) : "Clear"
  const timeOfDayForDisplay: TimeOfDay = testTimeOfDay ?? (getTimeOfDay(new Date().getHours()) as TimeOfDay)
  const currentTimeOfDayLabel = TIME_OF_DAY_OPTIONS.find((opt) => opt.value === timeOfDayForDisplay)?.label ?? "-"

  return (
    <>
      {/* トグルボタン */}
      {!isOpen && (
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-4 left-4 z-50 bg-background/80 backdrop-blur-sm"
          onClick={() => setIsOpen(true)}
          aria-label="気分に合わせるパネルを開く"
        >
          <Sparkles className="h-4 w-4" />
        </Button>
      )}

      {isOpen && (
        <Card className="fixed bottom-4 left-4 z-50 w-80 bg-background/95 backdrop-blur-sm shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">気分に合わせる</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleClosePanel}
                aria-label="閉じる"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription className="text-xs">
              雰囲気や時間帯を選んで、今の気分に合わせたプレイリストを再生成できます
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">雰囲気（天気）</Label>
              <div className="grid grid-cols-3 gap-2">
                {WEATHER_TYPES.map((type) => {
                  const Icon = getWeatherIcon(type)
                  const color = getWeatherThemeColor(type)
                  const isSelected = currentWeatherType === type
                  return (
                    <button
                      key={type}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      }`}
                      onClick={() => handleWeatherTypeChange(type)}
                    >
                      <Icon className="w-5 h-5" style={{ color }} />
                      <span className="text-xs">{WEATHER_TYPE_LABELS[type]}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 時間帯選択 */}
            <div className="space-y-2">
              <Label className="text-sm">時間帯</Label>
              <div className="grid grid-cols-4 gap-2">
                {TIME_OF_DAY_OPTIONS.map((option) => {
                  const isSelected = timeOfDayForDisplay === option.value
                  return (
                    <button
                      key={option.value}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all text-xs ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      }`}
                      onClick={() => handleTimeOfDayChange(option.value)}
                    >
                      <span className={isSelected ? "text-primary font-medium" : ""}>
                        {option.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* プレイリストを再生成 */}
            <div className="pt-2 border-t">
              <Button
                onClick={requestPlaylistRefresh}
                variant="default"
                className="w-full"
                size="sm"
              >
                プレイリストを再生成
              </Button>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t">
              <Label className="text-sm">自動更新</Label>
              <Button
                variant={playlistAutoUpdate ? "default" : "outline"}
                size="sm"
                className="min-w-16"
                onClick={() => setPlaylistAutoUpdate(!playlistAutoUpdate)}
              >
                {playlistAutoUpdate ? "ON" : "OFF"}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground -mt-1">
              実際の時間・天気の変化でプレイリストを自動で再生成します
            </p>

            {isTestMode && (
              <div className="pt-2 flex flex-col gap-2">
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  実際の天気・時間に戻す
                </Button>
                <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
                  <div>
                    現在の設定: <span className="font-mono">{currentWeatherType ? WEATHER_TYPE_LABELS[currentWeatherType] : "-"}</span> / {currentTimeOfDayLabel}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  )
}

