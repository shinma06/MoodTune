"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { generateDashboard } from "@/app/actions/generateDashboard"
import { hasGenresChanged, getGenresDiff, EMPTY_PLAYLIST, type LoadingMode } from "@/lib/playlist-utils"
import type { DashboardItem } from "@/types/dashboard"
import type { Genre } from "@/lib/constants"
import type { WeatherType, TimeOfDay } from "@/lib/weather-background"

interface UsePlaylistManagerOptions {
  initialPlaylists?: DashboardItem[]
  selectedGenres: Genre[]
  isGenresInitialized: boolean
  effectiveWeather: WeatherType
  effectiveTimeOfDay: TimeOfDay
  actualWeatherType: string | null
  actualTimeOfDay: TimeOfDay
  isMoodTuning: boolean
  playlistRefreshTrigger: number
  /** true の間は初期同期をスキップ */
  suspended: boolean
  /** ジャンルパネル開中は Mood Tuning トリガーで再構築しない */
  isGenrePanelOpen: boolean
}

export function usePlaylistManager({
  initialPlaylists,
  selectedGenres,
  isGenresInitialized,
  effectiveWeather,
  effectiveTimeOfDay,
  actualWeatherType,
  actualTimeOfDay,
  isMoodTuning,
  playlistRefreshTrigger,
  suspended,
  isGenrePanelOpen,
}: UsePlaylistManagerOptions) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [playlists, setPlaylists] = useState<DashboardItem[] | null>(initialPlaylists ?? null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMode, setLoadingMode] = useState<LoadingMode>(null)

  const hasPerformedInitialSyncRef = useRef(false)
  const prevTimeOfDayRef = useRef<TimeOfDay | null>(null)
  const prevActualWeatherRef = useRef<string | null>(null)
  const isLoadingRef = useRef(false)
  isLoadingRef.current = isLoading

  const displayPlaylists = useMemo(() => {
    return playlists && playlists.length > 0 ? playlists : []
  }, [playlists])

  const isLoadingOrEmpty = isLoading || displayPlaylists.length === 0

  const safeCurrentIndex = useMemo(() => {
    if (displayPlaylists.length === 0) return 0
    return Math.min(currentIndex, displayPlaylists.length - 1)
  }, [currentIndex, displayPlaylists.length])

  const currentPlaylist = displayPlaylists[safeCurrentIndex] ?? EMPTY_PLAYLIST

  const refreshPlaylists = useCallback(async (options?: { autoUpdate?: boolean }) => {
    if (selectedGenres.length === 0) return
    if (isLoadingRef.current) return
    setLoadingMode(options?.autoUpdate ? "auto" : "all")
    setIsLoading(true)
    try {
      const generated = await generateDashboard(effectiveWeather, effectiveTimeOfDay, selectedGenres as Genre[])
      setPlaylists(generated)
      setCurrentIndex((prev) => Math.min(prev, Math.max(0, generated.length - 1)))
    } catch (error) {
      console.error("Failed to refresh playlists:", error)
    } finally {
      setIsLoading(false)
      setLoadingMode(null)
    }
  }, [effectiveWeather, effectiveTimeOfDay, selectedGenres])

  const refreshPlaylistsRef = useRef(refreshPlaylists)
  refreshPlaylistsRef.current = refreshPlaylists

  const refreshPlaylistByGenre = useCallback(async (genre: Genre) => {
    if (!selectedGenres.includes(genre)) return
    if (isLoadingRef.current) return
    setLoadingMode("single")
    setIsLoading(true)
    try {
      const generated = await generateDashboard(effectiveWeather, effectiveTimeOfDay, [genre])
      const newItem = generated[0]
      if (!newItem) return
      setPlaylists((prev) => {
        if (!prev) return [newItem]
        return prev.map((p) => (p.genre === genre ? newItem : p))
      })
    } catch (error) {
      console.error("Failed to refresh playlist by genre:", error)
    } finally {
      setIsLoading(false)
      setLoadingMode(null)
    }
  }, [effectiveWeather, effectiveTimeOfDay, selectedGenres])

  const updatePlaylistsWithDiff = useCallback(async (
    currentGenres: string[],
    diff: { added: string[]; removed: string[]; unchanged: string[] },
    currentPlaylists: DashboardItem[] | null,
    isInitialSync = false
  ) => {
    if (currentGenres.length === 0) {
      setPlaylists([])
      setCurrentIndex(0)
      return
    }
    if (isLoadingRef.current) return

    setLoadingMode(isInitialSync ? "initial" : "added")
    setIsLoading(true)
    try {
      const existingMap = new Map<string, DashboardItem>()
      if (currentPlaylists) {
        currentPlaylists.forEach(p => existingMap.set(p.genre, p))
      }

      const unchangedPlaylists = diff.unchanged
        .map(genre => existingMap.get(genre))
        .filter((p): p is DashboardItem => p !== undefined)

      let newPlaylists: DashboardItem[] = []
      if (diff.added.length > 0) {
        newPlaylists = await generateDashboard(effectiveWeather, effectiveTimeOfDay, diff.added as Genre[])
      }

      const allMap = new Map<string, DashboardItem>()
      unchangedPlaylists.forEach(p => allMap.set(p.genre, p))
      newPlaylists.forEach(p => allMap.set(p.genre, p))

      const finalPlaylists = currentGenres
        .map(genre => allMap.get(genre))
        .filter((p): p is DashboardItem => p !== undefined)

      setPlaylists(finalPlaylists)
      setCurrentIndex(0)
    } catch (error) {
      console.error("Failed to generate dashboard:", error)
    } finally {
      setIsLoading(false)
      setLoadingMode(null)
    }
  }, [effectiveWeather, effectiveTimeOfDay])

  // Initial sync
  useEffect(() => {
    if (suspended || !isGenresInitialized || hasPerformedInitialSyncRef.current) return
    hasPerformedInitialSyncRef.current = true

    const currentPlaylistGenres = playlists?.map(p => p.genre) ?? []
    if (hasGenresChanged(currentPlaylistGenres, selectedGenres)) {
      const diff = getGenresDiff(currentPlaylistGenres, selectedGenres)
      updatePlaylistsWithDiff(selectedGenres, diff, playlists, true)
    }
  }, [suspended, isGenresInitialized, selectedGenres, playlists, updatePlaylistsWithDiff])

  // Auto-update on time-of-day change
  useEffect(() => {
    if (isMoodTuning || !isGenresInitialized || selectedGenres.length === 0) return
    const prev = prevTimeOfDayRef.current
    prevTimeOfDayRef.current = actualTimeOfDay
    if (prev !== null && prev !== actualTimeOfDay) {
      refreshPlaylists({ autoUpdate: true })
    }
  }, [actualTimeOfDay, isMoodTuning, isGenresInitialized, selectedGenres.length, refreshPlaylists])

  // Mood Tuning refresh trigger
  useEffect(() => {
    if (isGenrePanelOpen) return
    if (playlistRefreshTrigger === 0 || !isGenresInitialized || selectedGenres.length === 0) return
    refreshPlaylistsRef.current()
  }, [playlistRefreshTrigger, isGenresInitialized, selectedGenres.length, isGenrePanelOpen])

  // Auto-update on weather change
  useEffect(() => {
    if (isMoodTuning || !isGenresInitialized || selectedGenres.length === 0) return
    const current = actualWeatherType ?? null
    const prev = prevActualWeatherRef.current
    prevActualWeatherRef.current = current
    if (prev !== null && prev !== current) {
      refreshPlaylists({ autoUpdate: true })
    }
  }, [actualWeatherType, isMoodTuning, isGenresInitialized, selectedGenres.length, refreshPlaylists])

  return {
    playlists,
    currentIndex,
    setCurrentIndex,
    isLoading,
    loadingMode,
    displayPlaylists,
    isLoadingOrEmpty,
    safeCurrentIndex,
    currentPlaylist,
    refreshPlaylists,
    refreshPlaylistByGenre,
    updatePlaylistsWithDiff,
  }
}
