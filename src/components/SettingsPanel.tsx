"use client"

import { useState, type ReactNode } from "react"
import GenreSelector from "@/components/GenreSelector"
import { useSettings } from "@/hooks/useSettings"
import { useWeather } from "@/contexts/WeatherContext"
import { Button } from "@/components/ui/button"
import {
  DEFAULT_THEME_PREFERENCE,
  type MoodTuningWeatherDisplayMode,
  type ThemePreference,
} from "@/lib/constants"
import {
  ArrowLeft,
  ChevronRight,
  CloudSun,
  Disc,
  Disc3,
  Music,
  Music2,
  Palette,
  RotateCw,
  Settings2,
} from "lucide-react"

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
  isOverlayThemeDark: boolean
}

function ToggleSettingRow({
  icon,
  label,
  value,
  onChange,
  isOverlayThemeDark,
}: ToggleSettingRowProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div
        className={`flex items-center gap-2 text-xs sm:text-sm ${
          isOverlayThemeDark ? "text-white/90" : "text-foreground/90"
        }`}
      >
        {icon}
        <span>{label}</span>
      </div>
      <Button
        type="button"
        size="sm"
        variant={value ? "default" : "outline"}
        className={`h-7 px-3 text-xs ${
          isOverlayThemeDark
            ? value
              ? "bg-white text-slate-900 border-white hover:bg-white/90"
              : "bg-transparent border-white/30 text-white/80 hover:bg-white/10"
            : ""
        }`}
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

  const wrapperClass = isOverlayThemeDark
    ? "w-full rounded-2xl bg-slate-900/95 border border-white/10 shadow-xl"
    : "w-full rounded-2xl bg-background/80 backdrop-blur-sm border border-border/50 shadow-xl"
  const titleClass = isOverlayThemeDark ? "text-white" : "text-foreground"
  const helperTextClass = isOverlayThemeDark ? "text-white/60" : "text-muted-foreground"

  const isMockMode = process.env.NEXT_PUBLIC_USE_MOCK !== "false"
  const shouldShowLoginButton = isMockMode || isUnauthenticated
  const accountButtonLabel = shouldShowLoginButton ? "Spotifyでログイン" : "ログアウト"
  const accountHref = shouldShowLoginButton ? "/api/auth/spotify" : "/api/auth/signout"
  const accountButtonClass = shouldShowLoginButton
    ? "w-full flex items-center justify-center gap-2 bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold rounded-full px-6"
    : "w-full flex items-center justify-center gap-2 bg-[#1DB954] hover:bg-red-500 text-black font-semibold rounded-full px-6"
  const menuButtonClass = `h-10 justify-between px-3 text-sm ${
    isOverlayThemeDark ? "bg-transparent border-white/25 text-white/90 hover:bg-white/12 hover:text-white" : ""
  }`
  const backButtonClass = isOverlayThemeDark
    ? "text-white/80 hover:text-white hover:bg-white/10"
    : "text-muted-foreground hover:text-foreground"

  const sectionTitleMap: Record<Exclude<SettingsView, "menu">, string> = {
    favorite: "Select Genre",
    appearance: "Appearance",
    playback: "Playback",
  }
  const sectionIconMap: Record<Exclude<SettingsView, "menu">, ReactNode> = {
    favorite: <Music className="w-4 h-4" />,
    appearance: <Palette className="w-4 h-4" />,
    playback: <Settings2 className="w-4 h-4" />,
  }

  return (
    <div className={wrapperClass}>
      <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
        {view !== "menu" && (
          <div className="space-y-2.5 pb-1 mb-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={`h-8 px-2 ${backButtonClass}`}
              onClick={() => setView("menu")}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              戻る
            </Button>
            {view !== "favorite" && (
              <p className={`text-base font-semibold tracking-wide ${titleClass} flex items-center gap-2`}>
                {sectionIconMap[view]}
                {sectionTitleMap[view]}
              </p>
            )}
          </div>
        )}

        {view === "menu" && (
          <>
            <div className="space-y-3">
              <div className={`flex items-center gap-2 text-sm font-medium ${titleClass}`}>
                <Settings2 className="w-4 h-4" />
                Settings
              </div>
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  className={menuButtonClass}
                  onClick={() => setView("favorite")}
                >
                  <span className="flex items-center gap-2">
                    <Music className="w-4 h-4" />
                    Select Genre
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className={menuButtonClass}
                  onClick={() => setView("appearance")}
                >
                  <span className="flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Appearance
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className={menuButtonClass}
                  onClick={() => setView("playback")}
                >
                  <span className="flex items-center gap-2">
                    <Disc3 className="w-4 h-4" />
                    Playback
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className={`pt-3 border-t ${isOverlayThemeDark ? "border-white/10" : "border-border/50"} space-y-2`}>
              <p className={`text-xs font-medium ${helperTextClass}`}>Account</p>
              <Button
                type="button"
                className={accountButtonClass}
                onClick={() => {
                  window.location.href = accountHref
                }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                </svg>
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
              <p className={`text-xs ${helperTextClass}`}>UIテーマ</p>
              <div className="flex flex-wrap gap-2">
                {THEME_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    size="sm"
                    variant={themePreference === option.value ? "default" : "outline"}
                    className={`h-7 px-3 text-xs ${
                      isOverlayThemeDark
                        ? themePreference === option.value
                          ? "bg-white text-slate-900 border-white hover:bg-white/90"
                          : "bg-transparent border-white/30 text-white/80 hover:bg-white/10"
                        : ""
                    }`}
                    onClick={() => setThemePreference(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className={`text-xs ${helperTextClass}`}>Mood Tuning中の天気表示</p>
              <div className="flex flex-wrap gap-2">
                {MOOD_WEATHER_DISPLAY_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    size="sm"
                    variant={moodTuningWeatherDisplay === option.value ? "default" : "outline"}
                    className={`h-7 px-3 text-xs ${
                      isOverlayThemeDark
                        ? moodTuningWeatherDisplay === option.value
                          ? "bg-white text-slate-900 border-white hover:bg-white/90"
                          : "bg-transparent border-white/30 text-white/80 hover:bg-white/10"
                        : ""
                    }`}
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
          <div className="pt-2 space-y-3">
            <ToggleSettingRow
              icon={<RotateCw className="w-4 h-4" />}
              label="自動回転"
              value={autoRotationEnabled}
              onChange={setAutoRotationEnabled}
              isOverlayThemeDark={isOverlayThemeDark}
            />
            <ToggleSettingRow
              icon={<Disc className="w-4 h-4" />}
              label="トーンアーム表示"
              value={tonearmVisible}
              onChange={setTonearmVisible}
              isOverlayThemeDark={isOverlayThemeDark}
            />
            <ToggleSettingRow
              icon={<Music2 className="w-4 h-4" />}
              label="音符エフェクト"
              value={noteEffectEnabled}
              onChange={setNoteEffectEnabled}
              isOverlayThemeDark={isOverlayThemeDark}
            />
          </div>
        )}

        {view === "appearance" && themePreference === DEFAULT_THEME_PREFERENCE && (
          <p className={`text-[11px] px-1 ${helperTextClass}`}>
            時間テーマは現地時刻に応じてオーバーレイ UI のライト/ダークを切り替えます。
          </p>
        )}
      </div>
    </div>
  )
}
