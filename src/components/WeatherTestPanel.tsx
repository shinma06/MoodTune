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
  const [testWeatherType, setTestWeatherType] = useState<WeatherType>(
    weatherType ? normalizeWeatherType(weatherType) : "Clear"
  )
  const [localTimeOfDay, setLocalTimeOfDay] = useState<TimeOfDay>(
    testTimeOfDay || "day"
  )
  const [localPlaylistAutoUpdate, setLocalPlaylistAutoUpdate] = useState(playlistAutoUpdate)
  const prevOpenRef = useRef(false)

  /** パネルを開いたときにローカル状態をContextの現在値で同期（依存配列の長さは常に4で固定） */
  const panelSyncDeps: [boolean, string | null, TimeOfDay | null, boolean] = [
    isOpen,
    weatherType,
    testTimeOfDay,
    playlistAutoUpdate,
  ]
  useEffect(() => {
    const justOpened = isOpen && !prevOpenRef.current
    prevOpenRef.current = isOpen
    if (!justOpened) return
    setTestWeatherType(weatherType ? normalizeWeatherType(weatherType) : "Clear")
    setLocalTimeOfDay(testTimeOfDay ?? (getTimeOfDay(new Date().getHours()) as TimeOfDay))
    setLocalPlaylistAutoUpdate(playlistAutoUpdate)
  }, panelSyncDeps)

  /** 雰囲気・時間帯はパネル内のローカルのみ更新（閉じたときに適用） */
  const handleWeatherTypeChange = (type: WeatherType) => {
    setTestWeatherType(type)
  }

  const handleTimeOfDayChange = (timeOfDay: TimeOfDay) => {
    setLocalTimeOfDay(timeOfDay)
  }

  /** パネルを閉じたタイミングで設定をContextに反映 */
  const handleClosePanel = () => {
    setWeatherType(testWeatherType)
    setTestTimeOfDay(localTimeOfDay)
    setPlaylistAutoUpdate(localPlaylistAutoUpdate)
    setIsTestMode(true)
    setIsOpen(false)
  }

  const handleReset = () => {
    if (actualWeatherType) {
      setWeatherType(actualWeatherType)
    } else {
      setWeatherType(null)
    }
    setTestTimeOfDay(null)
    setIsTestMode(false)
    if (actualWeatherType) {
      setTestWeatherType(normalizeWeatherType(actualWeatherType))
    } else {
      setTestWeatherType("Clear")
    }
    setLocalTimeOfDay("day")
  }

  /** 表示用: パネル内ではローカル状態、パネル外ではContext */
  const currentWeatherType = isOpen
    ? testWeatherType
    : isTestMode
      ? testWeatherType
      : weatherType
        ? normalizeWeatherType(weatherType)
        : "Clear"
  const currentTimeOfDayLabel = isOpen
    ? TIME_OF_DAY_OPTIONS.find((opt) => opt.value === localTimeOfDay)?.label
    : testTimeOfDay || localTimeOfDay
      ? TIME_OF_DAY_OPTIONS.find((opt) => opt.value === (testTimeOfDay || localTimeOfDay))?.label
      : "-"

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
                  const isSelected = testWeatherType === type
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
                  const isSelected = localTimeOfDay === option.value
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
                variant={localPlaylistAutoUpdate ? "default" : "outline"}
                size="sm"
                className="min-w-16"
                onClick={() => setLocalPlaylistAutoUpdate(!localPlaylistAutoUpdate)}
              >
                {localPlaylistAutoUpdate ? "ON" : "OFF"}
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

