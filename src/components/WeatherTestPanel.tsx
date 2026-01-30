"use client"

import { useState, useRef } from "react"
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
import { Sparkles } from "lucide-react"

interface WeatherTestPanelProps {
  /** 親で制御する場合の開閉状態 */
  isOpen?: boolean
  onOpen?: () => void
  onClose?: () => void
  /** true のときトグルボタンを非表示（他パネル開時） */
  hideToggleButton?: boolean
}

export default function WeatherTestPanel({
  isOpen: controlledIsOpen,
  onOpen: onOpenProp,
  onClose: onCloseProp,
  hideToggleButton = false,
}: WeatherTestPanelProps = {}) {
  const {
    displayHour,
    effectiveTimeOfDay,
    effectiveWeather,
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
  const [internalOpen, setInternalOpen] = useState(false)
  /** 親制御時は props を、そうでなければ内部 state を使う */
  const isOpen = onOpenProp !== undefined ? (controlledIsOpen ?? false) : internalOpen
  /** パネルを開いた時点の天気・時間（閉じたときに「開いた時点と変わっているか」の判定用） */
  const openedWeatherTypeRef = useRef<string | null>(null)
  const openedTimeOfDayRef = useRef<TimeOfDay | null>(null)

  /** パネルを開く: この時点の天気・時間をスナップショットしてから開く */
  const handleOpenPanel = () => {
    openedWeatherTypeRef.current = weatherType
    openedTimeOfDayRef.current = testTimeOfDay
    if (onOpenProp) onOpenProp()
    else setInternalOpen(true)
  }

  /** 雰囲気（天気）・時間帯は即時Contextに反映（UIのみ。プレイリストは閉じたときのみ更新） */
  const handleWeatherTypeChange = (type: WeatherType) => {
    setWeatherType(type)
    setIsTestMode(true)
  }

  const handleTimeOfDayChange = (timeOfDay: TimeOfDay) => {
    setTestTimeOfDay(timeOfDay)
    setIsTestMode(true)
  }

  /** パネルを閉じる: 開いた時点の天気・時間と比べて変わっている場合のみプレイリストを再生成 */
  const handleClosePanel = () => {
    const openedWeather = openedWeatherTypeRef.current
    const openedTime = openedTimeOfDayRef.current
    const weatherChanged = weatherType !== openedWeather
    const timeChanged = testTimeOfDay !== openedTime
    if (weatherChanged || timeChanged) {
      requestPlaylistRefresh()
    }
    if (onCloseProp) onCloseProp()
    else setInternalOpen(false)
  }

  /** トグル: 開くときはスナップショット、閉じるときは変更があれば再生成してから閉じる（ジャンル選択パネルと同じ方式） */
  const handleTogglePanel = () => {
    if (isOpen) {
      handleClosePanel()
    } else {
      handleOpenPanel()
    }
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

  /** 表示用: Context の単一ソースを使用（背景と常に一致） */
  const currentWeatherType = effectiveWeather
  const currentTimeOfDayLabel = TIME_OF_DAY_OPTIONS.find((opt) => opt.value === effectiveTimeOfDay)?.label ?? "-"
  /** 実際の天気・時間帯（API・displayHour。選択肢の「現在」強調用） */
  const actualWeatherTypeNormalized = actualWeatherType ? normalizeWeatherType(actualWeatherType) : null
  const actualTimeOfDay = getTimeOfDay(displayHour)

  return (
    <>
      {/* トグルボタン（ジャンルパネル開時は非表示） */}
      {!hideToggleButton && (
      <Button
        variant="outline"
        size="icon"
        className={`
          fixed bottom-4 left-4 z-50 bg-background/80 backdrop-blur-sm
          ${isOpen ? "bg-primary text-primary-foreground" : ""}
        `}
        onClick={handleTogglePanel}
        aria-label={isOpen ? "気分に合わせるパネルを閉じる" : "気分に合わせるパネルを開く"}
      >
        <Sparkles className="h-4 w-4" />
      </Button>
      )}

      {isOpen && (
        <div className="fixed bottom-16 left-4 z-50 w-80 max-w-[calc(100vw-2rem)]">
          <Card className="w-full bg-background/80 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                気分に合わせる
              </CardTitle>
              <CardDescription className="text-xs">
                雰囲気や時間帯を選んで、今の気分に合わせたプレイリストを再生成できます
              </CardDescription>
            </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">雰囲気（天気）</Label>
              <div className="grid grid-cols-3 gap-2">
                {WEATHER_TYPES.map((type) => {
                  const Icon = getWeatherIcon(type)
                  const color = getWeatherThemeColor(type)
                  const isSelected = currentWeatherType === type
                  const isActualWeather = actualWeatherTypeNormalized === type
                  return (
                    <button
                      key={type}
                      className={`relative flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10 ring-2 ring-primary/30 ring-offset-2 ring-offset-background"
                          : "border-border hover:bg-muted/50"
                      } ${isActualWeather && !isSelected ? "ring-2 ring-muted-foreground/40 ring-offset-2 ring-offset-background" : ""}`}
                      onClick={() => handleWeatherTypeChange(type)}
                    >
                      {isActualWeather && (
                        <span className="absolute -top-1 -right-1 rounded bg-muted-foreground px-1 text-[9px] font-medium text-background ring-1 ring-background">
                          現在
                        </span>
                      )}
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
                  const isSelected = effectiveTimeOfDay === option.value
                  const isActualTime = actualTimeOfDay === option.value
                  return (
                    <button
                      key={option.value}
                      className={`relative flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all text-xs ${
                        isSelected
                          ? "border-primary bg-primary/10 ring-2 ring-primary/30 ring-offset-2 ring-offset-background"
                          : "border-border hover:bg-muted/50"
                      } ${isActualTime && !isSelected ? "ring-2 ring-muted-foreground/40 ring-offset-2 ring-offset-background" : ""}`}
                      onClick={() => handleTimeOfDayChange(option.value)}
                    >
                      {isActualTime && (
                        <span className="absolute -top-1 -right-1 rounded bg-muted-foreground px-1 text-[9px] font-medium text-background ring-1 ring-background">
                          現在
                        </span>
                      )}
                      <span className={isSelected ? "text-primary font-medium" : ""}>
                        {option.label}
                      </span>
                    </button>
                  )
                })}
              </div>
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
        </div>
      )}
    </>
  )
}

