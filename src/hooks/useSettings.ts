"use client"

import { useMemo } from "react"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import {
  DEFAULT_AUTO_ROTATION_ENABLED,
  DEFAULT_MOOD_TUNING_WEATHER_DISPLAY_MODE,
  DEFAULT_NOTE_EFFECT_ENABLED,
  DEFAULT_THEME_PREFERENCE,
  DEFAULT_TONEARM_VISIBLE,
  SETTINGS_STORAGE_KEYS,
  type MoodTuningWeatherDisplayMode,
  type ThemePreference,
} from "@/lib/constants"
import { isThemePreference, isMoodTuningWeatherDisplayMode, isBoolean } from "@/lib/validators"

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
