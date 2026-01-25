"use client"

import { useState } from "react"
import { useWeather } from "@/contexts/WeatherContext"
import { getWeatherIcon, getWeatherThemeColor } from "@/lib/weather-utils"
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
import { X, Settings } from "lucide-react"

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
  } = useWeather()
  const [isOpen, setIsOpen] = useState(false)
  const [testWeatherType, setTestWeatherType] = useState<WeatherType>(
    (weatherType as WeatherType) || "Clear"
  )
  const [localTimeOfDay, setLocalTimeOfDay] = useState<TimeOfDay>(
    testTimeOfDay || "day"
  )

  // 選択時に自動適用
  const handleWeatherTypeChange = (type: WeatherType) => {
    setTestWeatherType(type)
    setWeatherType(type)
    setTestTimeOfDay(localTimeOfDay)
    setIsTestMode(true)
  }

  const handleTimeOfDayChange = (timeOfDay: TimeOfDay) => {
    setLocalTimeOfDay(timeOfDay)
    setTestTimeOfDay(timeOfDay)
    setIsTestMode(true)
  }

  const handleReset = () => {
    // 実際の天気に戻す
    if (actualWeatherType) {
      setWeatherType(actualWeatherType)
    } else {
      setWeatherType(null)
    }
    setTestTimeOfDay(null)
    setIsTestMode(false)
    // ローカル状態も実際の天気に戻す
    if (actualWeatherType) {
      setTestWeatherType(actualWeatherType as WeatherType)
    } else {
      setTestWeatherType("Clear")
    }
    setLocalTimeOfDay("day")
  }

  // テストモード時は時間帯を手動設定、そうでない場合は実際の時間を使用
  const currentWeatherType = isTestMode
    ? testWeatherType
    : (weatherType as WeatherType) || "Clear"

  return (
    <>
      {/* トグルボタン */}
      {!isOpen && (
        <Button
          variant="outline"
          size="icon"
          className="fixed top-4 right-4 z-50 bg-background/80 backdrop-blur-sm"
          onClick={() => setIsOpen(true)}
        >
          <Settings className="h-4 w-4" />
        </Button>
      )}

      {/* テストパネル */}
      {isOpen && (
        <Card className="fixed top-4 right-4 z-50 w-80 bg-background/95 backdrop-blur-sm shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">天気テストパネル</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription className="text-xs">
              天気と時間帯を手動で設定してテストできます
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 天気選択 */}
            <div className="space-y-2">
              <Label className="text-sm">天気</Label>
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

            {/* リセットボタン */}
            {isTestMode && (
              <div className="pt-2">
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  リセット
                </Button>
              </div>
            )}

            {/* 現在の状態表示 */}
            {isTestMode && (
              <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
                <div>
                  テストモード: <span className="font-mono">{currentWeatherType ? WEATHER_TYPE_LABELS[currentWeatherType] : "-"}</span>
                </div>
                <div>
                  時間帯: <span className="font-mono">{testTimeOfDay || localTimeOfDay ? TIME_OF_DAY_OPTIONS.find(opt => opt.value === (testTimeOfDay || localTimeOfDay))?.label : "-"}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  )
}

