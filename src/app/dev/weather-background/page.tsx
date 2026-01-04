"use client"

import { useState } from "react"
import {
  getWeatherBackground,
  getTimeOfDay,
  type WeatherType,
  type TimeOfDay,
} from "@/lib/weather-background"
import { getWeatherIcon, getWeatherThemeColor } from "@/lib/weather-utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

const weatherTypes: WeatherType[] = [
  "Clear",
  "Clouds",
  "Rain",
  "Drizzle",
  "Thunderstorm",
  "Snow",
  "Mist",
  "Fog",
  "Haze",
  "Dust",
  "Sand",
  "Ash",
  "Squall",
  "Tornado",
]

const timeOfDayOptions: { value: TimeOfDay; label: string }[] = [
  { value: "dawn", label: "朝 (6-9時)" },
  { value: "day", label: "昼 (9-17時)" },
  { value: "dusk", label: "夕方 (17-19時)" },
  { value: "night", label: "夜 (19-6時)" },
]

export default function WeatherBackgroundDevPage() {
  const [weatherType, setWeatherType] = useState<WeatherType>("Clear")
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState<TimeOfDay | null>(
    null
  )

  // 時間帯の設定（選択されていない場合はデフォルトで"day"）
  const timeOfDay = selectedTimeOfDay || "day"

  // 背景色の取得
  const background = getWeatherBackground(weatherType, timeOfDay)

  // グラデーションスタイルの生成
  const colors = [
    background.top,
    background.from,
    background.via,
    background.to
  ].filter(Boolean)
  const gradientStyle = `linear-gradient(to bottom, ${colors.join(', ')})`

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            天気・時間背景色テストツール
          </h1>
          <p className="text-muted-foreground">
            天気タイプと時間を設定して、背景色をテストできます
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 設定パネル */}
          <Card>
            <CardHeader>
              <CardTitle>設定</CardTitle>
              <CardDescription>
                天気タイプと時間を選択してください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 天気選択 */}
              <div className="space-y-3">
                <Label>天気</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {weatherTypes.map((type) => {
                    const Icon = getWeatherIcon(type)
                    const color = getWeatherThemeColor(type)
                    const isSelected = weatherType === type
                    return (
                      <div
                        key={type}
                        className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-md"
                            : "border-border hover:bg-muted/50 hover:border-primary/50"
                        }`}
                        onClick={() => setWeatherType(type)}
                      >
                        <div
                          className="p-2 rounded-full bg-muted/50 flex items-center justify-center"
                          style={{ backgroundColor: `${color}15` }}
                        >
                          <Icon className="w-6 h-6" style={{ color }} />
                        </div>
                        <div className="text-center">
                          <div className={`text-xs font-medium ${isSelected ? "text-primary" : ""}`}>
                            {type}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 時間帯選択 */}
              <div className="space-y-2">
                <Label htmlFor="time-of-day">時間帯</Label>
                <Select
                  value={selectedTimeOfDay || "day"}
                  onValueChange={(value) =>
                    setSelectedTimeOfDay(value as TimeOfDay)
                  }
                >
                  <SelectTrigger id="time-of-day">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOfDayOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* プレビューパネル */}
          <Card>
            <CardHeader>
              <CardTitle>プレビュー</CardTitle>
              <CardDescription>
                現在の設定による背景色のプレビュー
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 背景色プレビュー */}
              <div className="space-y-2">
                <Label>背景色プレビュー</Label>
                <div
                  className="w-full h-64 rounded-lg border-2 border-border shadow-lg transition-all duration-300"
                  style={{ background: gradientStyle }}
                />
              </div>

              {/* 背景色の値 */}
              <div className="space-y-2">
                <Label>背景色の値</Label>
                <div className="space-y-2 p-4 bg-muted rounded-lg font-mono text-sm">
                  {background.top && (
                    <div className="flex items-center gap-2">
                      <span className="w-16 text-muted-foreground">top:</span>
                      <span>{background.top}</span>
                      <div
                        className="w-8 h-8 rounded border border-border"
                        style={{ backgroundColor: background.top }}
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="w-16 text-muted-foreground">from:</span>
                    <span>{background.from}</span>
                    <div
                      className="w-8 h-8 rounded border border-border"
                      style={{ backgroundColor: background.from }}
                    />
                  </div>
                  {background.via && (
                    <div className="flex items-center gap-2">
                      <span className="w-16 text-muted-foreground">via:</span>
                      <span>{background.via}</span>
                      <div
                        className="w-8 h-8 rounded border border-border"
                        style={{ backgroundColor: background.via }}
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="w-16 text-muted-foreground">to:</span>
                    <span>{background.to}</span>
                    <div
                      className="w-8 h-8 rounded border border-border"
                      style={{ backgroundColor: background.to }}
                    />
                  </div>
                </div>
              </div>

              {/* 現在の設定情報 */}
              <div className="space-y-2">
                <Label>現在の設定</Label>
                <div className="p-4 bg-muted rounded-lg text-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">天気タイプ: </span>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const Icon = getWeatherIcon(weatherType, timeOfDay)
                        const color = getWeatherThemeColor(weatherType, timeOfDay)
                        return (
                          <>
                            <Icon className="w-5 h-5" style={{ color }} />
                            <span className="font-mono">{weatherType}</span>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">時間帯: </span>
                    <span className="font-mono">{timeOfDay}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

