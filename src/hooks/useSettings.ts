"use client"

import { useMemo } from "react"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import {
  DEFAULT_AUTO_ROTATION_ENABLED,
  DEFAULT_MOOD_TUNING_WEATHER_DISPLAY_MODE,
  DEFAULT_NOTE_EFFECT_ENABLED,
  DEFAULT_THEME_PREFERENCE,
  DEFAULT_TONEARM_VISIBLE,
  MOOD_TUNING_WEATHER_DISPLAY_MODES,
  SETTINGS_STORAGE_KEYS,
  THEME_PREFERENCES,
  type MoodTuningWeatherDisplayMode,
  type ThemePreference,
} from "@/lib/constants"

const isThemePreference = (value: unknown): value is ThemePreference => {
  return typeof value === "string" && THEME_PREFERENCES.includes(value as ThemePreference)
}

const isMoodTuningWeatherDisplayMode = (value: unknown): value is MoodTuningWeatherDisplayMode => {
  return (
    typeof value === "string" &&
    MOOD_TUNING_WEATHER_DISPLAY_MODES.includes(value as MoodTuningWeatherDisplayMode)
  )
}

const isBoolean = (value: unknown): value is boolean => typeof value === "boolean"

export function useSettings() {
  const [themePreference, setThemePreference, isThemeInitialized] = useLocalStorage<ThemePreference>(
    SETTINGS_STORAGE_KEYS.themePreference,
    DEFAULT_THEME_PREFERENCE,
    { validate: isThemePreference }
  )
  const [autoRotationEnabled, setAutoRotationEnabled, isAutoRotationInitialized] = useLocalStorage<boolean>(
    SETTINGS_STORAGE_KEYS.autoRotationEnabled,
    DEFAULT_AUTO_ROTATION_ENABLED,
    { validate: isBoolean }
  )
  const [tonearmVisible, setTonearmVisible, isTonearmInitialized] = useLocalStorage<boolean>(
    SETTINGS_STORAGE_KEYS.tonearmVisible,
    DEFAULT_TONEARM_VISIBLE,
    { validate: isBoolean }
  )
  const [noteEffectEnabled, setNoteEffectEnabled, isNoteEffectInitialized] = useLocalStorage<boolean>(
    SETTINGS_STORAGE_KEYS.noteEffectEnabled,
    DEFAULT_NOTE_EFFECT_ENABLED,
    { validate: isBoolean }
  )
  const [moodTuningWeatherDisplay, setMoodTuningWeatherDisplay, isMoodWeatherDisplayInitialized] =
    useLocalStorage<MoodTuningWeatherDisplayMode>(
      SETTINGS_STORAGE_KEYS.moodTuningWeatherDisplay,
      DEFAULT_MOOD_TUNING_WEATHER_DISPLAY_MODE,
      { validate: isMoodTuningWeatherDisplayMode }
    )

  const isInitialized = useMemo(() => {
    return (
      isThemeInitialized &&
      isAutoRotationInitialized &&
      isTonearmInitialized &&
      isNoteEffectInitialized &&
      isMoodWeatherDisplayInitialized
    )
  }, [
    isThemeInitialized,
    isAutoRotationInitialized,
    isTonearmInitialized,
    isNoteEffectInitialized,
    isMoodWeatherDisplayInitialized,
  ])

  return {
    themePreference,
    setThemePreference,
    autoRotationEnabled,
    setAutoRotationEnabled,
    tonearmVisible,
    setTonearmVisible,
    noteEffectEnabled,
    setNoteEffectEnabled,
    moodTuningWeatherDisplay,
    setMoodTuningWeatherDisplay,
    isInitialized,
  }
}
