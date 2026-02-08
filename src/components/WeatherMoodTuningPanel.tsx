"use client"

import { useState, useRef } from "react"
import { useWeather } from "@/contexts/WeatherContext"
import { getWeatherIcon, getWeatherThemeColor, normalizeWeatherType } from "@/lib/weather-utils"
import { getTimeOfDay } from "@/lib/weather-background"
import type { WeatherType, TimeOfDay } from "@/lib/weather-background"
import { WEATHER_TYPES, TIME_OF_DAY_OPTIONS, TIME_OF_DAY_LABELS, WEATHER_TYPE_LABELS } from "@/lib/constants"
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

interface WeatherMoodTuningPanelProps {
  /** 親で制御する場合の開閉状態 */
  isOpen?: boolean
  onOpen?: () => void
  onClose?: () => void
  /** true のときトグルボタンを非表示（他パネル開時） */
  hideToggleButton?: boolean
}

export default function WeatherMoodTuningPanel({
  isOpen: controlledIsOpen,
  onOpen: onOpenProp,
  onClose: onCloseProp,
  hideToggleButton = false,
}: WeatherMoodTuningPanelProps = {}) {
  const {
    displayHour,
    effectiveTimeOfDay,
    effectiveWeather,
    weatherType,
    setWeatherType,
    actualWeatherType,
    setActualWeatherType,
    moodTuningTimeOfDay,
    setMoodTuningTimeOfDay,
    isMoodTuning,
    setIsMoodTuning,
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
  /** パネルを開いた時点の「現在の天気・時間」（リセットボタン表示判定用） */
  const actualWeatherAtOpenRef = useRef<string | null>(null)
  const actualTimeOfDayAtOpenRef = useRef<TimeOfDay | null>(null)

  /** パネルを開く: この時点の天気・時間と「現在の天気・時間」をスナップショットしてから開く */
  const handleOpenPanel = () => {
    openedWeatherTypeRef.current = weatherType
    openedTimeOfDayRef.current = moodTuningTimeOfDay
    actualWeatherAtOpenRef.current = actualWeatherType
    actualTimeOfDayAtOpenRef.current = getTimeOfDay(displayHour)
    if (onOpenProp) onOpenProp()
    else setInternalOpen(true)
  }

  /** 天気・時間帯は即時Contextに反映（UIのみ。プレイリストは閉じたときのみ更新） */
  const handleWeatherTypeChange = (type: WeatherType) => {
    setWeatherType(type)
    setIsMoodTuning(true)
  }

  const handleTimeOfDayChange = (timeOfDay: TimeOfDay) => {
    setMoodTuningTimeOfDay(timeOfDay)
    setIsMoodTuning(true)
  }

  /** パネルを閉じる: 開いた時点の天気・時間と比べて変わっている場合のみプレイリストを再生成 */
  const handleClosePanel = () => {
    const openedWeather = openedWeatherTypeRef.current
    const openedTime = openedTimeOfDayRef.current
    const weatherChanged = weatherType !== openedWeather
    const timeChanged = moodTuningTimeOfDay !== openedTime
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
    setMoodTuningTimeOfDay(null)
    setIsMoodTuning(false)
  }

  /** 表示用: Context の単一ソースを使用（背景と常に一致） */
  const currentWeatherType = effectiveWeather
  const currentTimeOfDayLabel = TIME_OF_DAY_OPTIONS.find((opt) => opt.value === effectiveTimeOfDay)?.label ?? "-"
  /** 実際の天気・時間帯（API・displayHour。選択肢の「現在」強調用） */
  const actualWeatherTypeNormalized = actualWeatherType ? normalizeWeatherType(actualWeatherType) : null
  const actualTimeOfDay = getTimeOfDay(displayHour)

  /** パネルを閉じたうえで、表示中の天気・時間が実際と異なる場合のみ Mood Tuning 表示（虹色ボタン）を適用 */
  const isMoodTuningApplied =
    !isOpen &&
    (actualWeatherTypeNormalized != null && effectiveWeather !== actualWeatherTypeNormalized ||
      effectiveTimeOfDay !== actualTimeOfDay)

  /** パネルを開いた時点で「現在の天気・時間」と違う状態を設定していた場合のみリセットボタンを表示 */
  const actualWeatherAtOpenNorm = normalizeWeatherType(actualWeatherAtOpenRef.current ?? "Clear")
  const actualTimeAtOpen = actualTimeOfDayAtOpenRef.current ?? actualTimeOfDay
  const effectiveWeatherAtOpen =
    openedWeatherTypeRef.current != null ? normalizeWeatherType(openedWeatherTypeRef.current) : actualWeatherAtOpenNorm
  const effectiveTimeOfDayAtOpen = openedTimeOfDayRef.current ?? actualTimeAtOpen
  const showResetButton =
    isOpen &&
    (effectiveWeatherAtOpen !== actualWeatherAtOpenNorm || effectiveTimeOfDayAtOpen !== actualTimeAtOpen)

  return (
    <>
      {/* トグルボタン（ジャンルパネル開時は非表示）。Mood Tuning 中は虹色ボーダーのみ */}
      {!hideToggleButton && (
        <div className="fixed bottom-4 left-4 z-50">
          {isMoodTuningApplied ? (
            <div className="bg-rainbow p-[2px] rounded-[1.1rem]">
              <Button
                variant="outline"
                size="icon"
                className="size-[2.8rem] rounded-[calc(1.1rem-2px)] bg-background/95 backdrop-blur-sm border-0 [&_svg]:size-5"
                onClick={handleTogglePanel}
                aria-label={isOpen ? "Mood Tuningパネルを閉じる" : "Mood Tuningパネルを開く"}
              >
                <Sparkles className="size-5" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="icon"
              className={`size-[2.8rem] rounded-[1.1rem] backdrop-blur-sm [&_svg]:size-5 ${isOpen ? "bg-primary text-primary-foreground border-primary" : "bg-background/80"}`}
              onClick={handleTogglePanel}
              aria-label={isOpen ? "Mood Tuningパネルを閉じる" : "Mood Tuningパネルを開く"}
            >
              <Sparkles className="size-5" />
            </Button>
          )}
        </div>
      )}

      {isOpen && (
        <div className="fixed bottom-16 left-4 z-50 w-80 max-w-[calc(100vw-2rem)]">
          <Card className="w-full bg-background/80 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Mood Tuning
              </CardTitle>
              <CardDescription className="text-xs">
                天気や時間帯を選んで、今の気分に合わせたプレイリストを作成
              </CardDescription>
            </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">天気</Label>
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
                      className={`relative flex flex-col items-center gap-0.5 p-2 rounded-lg border-2 transition-all text-xs ${
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
                      <span className={`block leading-tight ${isSelected ? "text-primary font-medium" : ""}`}>
                        <span className="block">{TIME_OF_DAY_LABELS[option.value]}</span>
                        <span className="block text-[10px] opacity-90">{option.timeRange}</span>
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

            {showResetButton && (
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
