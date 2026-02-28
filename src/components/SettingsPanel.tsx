"use client"

import { useState, type ReactNode } from "react"
import GenreSelector from "@/components/GenreSelector"
import { useSettings } from "@/hooks/useSettings"
import { useWeather } from "@/contexts/WeatherContext"
import { Button } from "@/components/ui/button"
import { getOverlayStyles } from "@/lib/overlay-theme"
import {
  DEFAULT_THEME_PREFERENCE,
  type MoodTuningWeatherDisplayMode,
  type ThemePreference,
} from "@/lib/constants"
import {
  ArrowLeft,
  ChevronRight,
  Disc,
  Disc3,
  Music,
  Music2,
  Palette,
  RotateCw,
  Settings2,
} from "lucide-react"
import SpotifyIcon from "@/components/shared/SpotifyIcon"

interface SettingsPanelProps {
  isUnauthenticated: boolean
}

type SettingsView = "menu" | "favorite" | "appearance" | "playback"

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "time", label: "時間" },
  { value: "light", label: "ライト" },
  { value: "dark", label: "ダーク" },
  { value: "system", label: "システム" },
]

const MOOD_WEATHER_DISPLAY_OPTIONS: { value: MoodTuningWeatherDisplayMode; label: string }[] = [
  { value: "tuning", label: "Mood Tuningの天気" },
  { value: "actual", label: "現在の天気" },
]

interface ToggleSettingRowProps {
  icon: ReactNode
  label: string
  value: boolean
  onChange: (next: boolean) => void
  isDark: boolean
}

function ToggleSettingRow({ icon, label, value, onChange, isDark }: ToggleSettingRowProps) {
  const s = getOverlayStyles(isDark)
  return (
    <div className="flex items-center justify-between gap-3 w-full min-w-0">
      <div className={`flex items-center gap-2 text-xs sm:text-sm ${isDark ? "text-white/90" : "text-foreground/90"}`}>
        {icon}
        <span>{label}</span>
      </div>
      <Button
        type="button"
        size="sm"
        variant={value ? "default" : "outline"}
        className={`h-7 px-3 text-xs ${value ? s.toggleOn : s.toggleOff}`}
        onClick={() => onChange(!value)}
      >
        {value ? "ON" : "OFF"}
      </Button>
    </div>
  )
}

export default function SettingsPanel({ isUnauthenticated }: SettingsPanelProps) {
  const [view, setView] = useState<SettingsView>("menu")
  const { isOverlayThemeDark, themePreference, setThemePreference } = useWeather()
  const {
    autoRotationEnabled,
    setAutoRotationEnabled,
    tonearmVisible,
    setTonearmVisible,
    noteEffectEnabled,
    setNoteEffectEnabled,
    moodTuningWeatherDisplay,
    setMoodTuningWeatherDisplay,
  } = useSettings()

  const s = getOverlayStyles(isOverlayThemeDark)

  const wrapperClass = `w-full rounded-2xl backdrop-blur-sm border shadow-xl ${s.container}`
  const menuButtonClass = `h-10 justify-between px-3 text-sm ${
    isOverlayThemeDark ? "bg-transparent border-white/25 text-white/90 hover:bg-white/12 hover:text-white" : ""
  }`

  const shouldShowLoginButton = isUnauthenticated
  const accountButtonLabel = shouldShowLoginButton ? "Spotifyでログイン" : "ログアウト"
  const accountHref = shouldShowLoginButton ? "/api/auth/spotify" : "/api/auth/signout"
  const accountButtonClass = shouldShowLoginButton
    ? "w-full flex items-center justify-center gap-2 bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold rounded-full px-6"
    : "w-full flex items-center justify-center gap-2 bg-[#1DB954] hover:bg-red-500 text-black font-semibold rounded-full px-6"

  const sectionTitleMap: Record<Exclude<SettingsView, "menu">, string> = {
    favorite: "ジャンルを選択",
    appearance: "表示",
    playback: "再生",
  }
  const sectionIconMap: Record<Exclude<SettingsView, "menu">, ReactNode> = {
    favorite: <Music className="w-4 h-4" />,
    appearance: <Palette className="w-4 h-4" />,
    playback: <Settings2 className="w-4 h-4" />,
  }

  const optionBtnClass = (isSelected: boolean) =>
    `h-8 w-full justify-center px-3 text-xs ${isSelected ? s.buttonSelected : s.buttonUnselected}`

  return (
    <div className={`${wrapperClass} min-w-0 w-full`}>
      <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 w-full min-w-0">
        {view !== "menu" && (
          <div className="space-y-2.5 pb-1 mb-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={`h-8 px-2 ${s.backButton}`}
              onClick={() => setView("menu")}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              戻る
            </Button>
            {view !== "favorite" && (
              <p className={`text-base font-semibold tracking-wide ${s.title} flex items-center gap-2`}>
                {sectionIconMap[view]}
                {sectionTitleMap[view]}
              </p>
            )}
          </div>
        )}

        {view === "menu" && (
          <>
            <div className="space-y-3 w-full min-w-0">
              <div className={`flex items-center gap-2 text-sm font-medium ${s.title}`}>
                <Settings2 className="w-4 h-4" />
                設定
              </div>
              <div className="space-y-2 w-full min-w-0">
                <Button
                  type="button"
                  variant="outline"
                  className={`${menuButtonClass} w-full`}
                  onClick={() => setView("favorite")}
                >
                  <span className="flex items-center gap-2">
                    <Music className="w-4 h-4" />
                    ジャンルを選択
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className={`${menuButtonClass} w-full`}
                  onClick={() => setView("appearance")}
                >
                  <span className="flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    表示
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className={`${menuButtonClass} w-full`}
                  onClick={() => setView("playback")}
                >
                  <span className="flex items-center gap-2">
                    <Disc3 className="w-4 h-4" />
                    再生
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className={`pt-3 border-t ${s.border} space-y-2 w-full min-w-0`}>
              <p className={`text-xs font-medium ${s.muted}`}>アカウント</p>
              <Button
                type="button"
                className={accountButtonClass}
                onClick={() => {
                  window.location.href = accountHref
                }}
              >
                <SpotifyIcon />
                {accountButtonLabel}
              </Button>
            </div>
          </>
        )}

        {view === "favorite" && (
          <div className="pt-2">
            <GenreSelector flat />
          </div>
        )}

        {view === "appearance" && (
          <div className="pt-2 space-y-4">
            <div className="space-y-2">
              <p className={`text-xs ${s.muted}`}>UIテーマ</p>
              <div className="grid grid-cols-1 gap-2 w-full min-w-0">
                {THEME_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    size="sm"
                    variant={themePreference === option.value ? "default" : "outline"}
                    className={optionBtnClass(themePreference === option.value)}
                    onClick={() => setThemePreference(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className={`text-xs ${s.muted}`}>Mood Tuning中の天気表示</p>
              <div className="grid grid-cols-1 gap-2 w-full min-w-0">
                {MOOD_WEATHER_DISPLAY_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    size="sm"
                    variant={moodTuningWeatherDisplay === option.value ? "default" : "outline"}
                    className={optionBtnClass(moodTuningWeatherDisplay === option.value)}
                    onClick={() => setMoodTuningWeatherDisplay(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {view === "playback" && (
          <div className="pt-2 space-y-3 w-full min-w-0">
            <ToggleSettingRow
              icon={<RotateCw className="w-4 h-4" />}
              label="自動回転"
              value={autoRotationEnabled}
              onChange={setAutoRotationEnabled}
              isDark={isOverlayThemeDark}
            />
            <ToggleSettingRow
              icon={<Disc className="w-4 h-4" />}
              label="トーンアーム表示"
              value={tonearmVisible}
              onChange={setTonearmVisible}
              isDark={isOverlayThemeDark}
            />
            <ToggleSettingRow
              icon={<Music2 className="w-4 h-4" />}
              label="音符エフェクト"
              value={noteEffectEnabled}
              onChange={setNoteEffectEnabled}
              isDark={isOverlayThemeDark}
            />
          </div>
        )}

        {view === "appearance" && themePreference === DEFAULT_THEME_PREFERENCE && (
          <p className={`text-[11px] px-1 ${s.muted}`}>
            時間テーマは現地時刻に応じてオーバーレイ UI のライト/ダークを切り替えます。
          </p>
        )}
      </div>
    </div>
  )
}
