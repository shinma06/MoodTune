"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import WeatherMonitor from "./WeatherMonitor"
import WeatherAnimation from "./WeatherAnimation"
import WeatherMoodTuningPanel from "./WeatherMoodTuningPanel"
import GenreSelector, { useSelectedGenres } from "./GenreSelector"
import { useWeather } from "@/contexts/WeatherContext"
import { getWeatherBackground, type TimeOfDay } from "@/lib/weather-background"
import { normalizeWeatherType } from "@/lib/weather-utils"
import { formatGradientBackground, INITIAL_BACKGROUND_GRADIENT } from "@/lib/weather-background-utils"
import {
    useVinylRotation,
    REGENERATE_THRESHOLD_DEG,
    REGENERATE_ZONE_ENTRY_DEG,
} from "@/hooks/useVinylRotation"
import { getGenreThemeColors, REALISTIC_VINYL_THEME } from "@/lib/constants"
import {
    hasGenresChanged,
    getGenresDiff,
    getImageUrl,
    LOADING_GENRE_TEXT,
    getLoadingTitleText,
    EMPTY_PLAYLIST,
    type LoadingMode,
} from "@/lib/playlist-utils"
import { Music, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { generateDashboard } from "@/app/actions/generateDashboard"
import { saveToSpotify } from "@/app/actions/saveToSpotify"
import type { DashboardItem } from "@/types/dashboard"
import type { Genre } from "@/lib/constants"

interface PlaylistExplorerProps {
    playlists?: DashboardItem[]
    /** true の間はプレイリスト初期構築をスキップ（ジャンル選択モーダル表示中に使用） */
    suspended?: boolean
}

export default function PlaylistExplorer({ playlists: initialPlaylists, suspended = false }: PlaylistExplorerProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const { isTimeInitialized, actualWeatherType, actualTimeOfDay, isMoodTuning, effectiveWeather, effectiveTimeOfDay, playlistRefreshTrigger, isDark } = useWeather()
    /** 開いているパネル（null = 両方閉じている）。同時に1つだけ開く */
    const [openPanel, setOpenPanel] = useState<null | "mood" | "genre">(null)
    const [selectedGenres, isGenresInitialized] = useSelectedGenres()
    const [playlists, setPlaylists] = useState<DashboardItem[] | null>(initialPlaylists ?? null)
    const [isLoading, setIsLoading] = useState(false)
    /** 構築中の種別（初回 / 全件再構築 / 個別 / 追加ジャンルのみ）。表示文言の切り替え用 */
    const [loadingMode, setLoadingMode] = useState<LoadingMode>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)

    /** パネルを開いた時点のジャンル（閉じたときの差分計算用） */
    const genresOnOpenRef = useRef<string[]>([])
    /** リロード後の初回同期を1回だけ行うためのフラグ */
    const hasPerformedInitialSyncRef = useRef(false)
    /** 時間帯・天気の自動更新用の前回値 */
    const prevTimeOfDayRef = useRef<TimeOfDay | null>(null)
    const prevActualWeatherRef = useRef<string | null>(null)

    /** 構築失敗時は空のままローディング表示を継続（静的フォールバックは使わない） */
    const displayPlaylists = useMemo(() => {
        return playlists && playlists.length > 0 ? playlists : []
    }, [playlists])

    /** ローディング表示を出す条件（構築中 or 未取得・失敗でプレイリストが空） */
    const isLoadingOrEmpty = isLoading || displayPlaylists.length === 0

    /** 常に配列範囲内のインデックス */
    const safeCurrentIndex = useMemo(() => {
        if (displayPlaylists.length === 0) return 0
        return Math.min(currentIndex, displayPlaylists.length - 1)
    }, [currentIndex, displayPlaylists.length])

    const currentPlaylist = displayPlaylists[safeCurrentIndex] ?? EMPTY_PLAYLIST
    /** 現実のレコード色を使うのは (1) 初期同期時の stale J-POP のみ (2) 空状態 のときのみ。それ以外は表示中のジャンルのテーマカラー */
    const isInitialSyncStaleJPop =
        isLoading &&
        playlists?.length === 1 &&
        currentPlaylist.genre === "J-POP" &&
        selectedGenres.length > 0 &&
        selectedGenres[0] !== "J-POP"
    const isEmpty = displayPlaylists.length === 0 || currentPlaylist.genre === "---"
    const useRealisticVinyl = isInitialSyncStaleJPop || isEmpty
    const vinylColors = useRealisticVinyl
        ? REALISTIC_VINYL_THEME
        : getGenreThemeColors(currentPlaylist.genre)

    /** ローディング中かどうかを ref で保持（useCallback 内で最新値を参照するため） */
    const isLoadingRef = useRef(false)
    isLoadingRef.current = isLoading

    /** 現在の天気・時間帯・ジャンルでプレイリストを全件再構築。autoUpdate: true のときは自動更新（天気・時間帯変化）用の文言を表示 */
    const refreshPlaylists = useCallback(async (options?: { autoUpdate?: boolean }) => {
        if (selectedGenres.length === 0) return
        if (isLoadingRef.current) return // ローディング中は無視
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

    /** パネル閉時トリガー用 effect が refreshPlaylists の参照変更で再実行されないよう ref に保持 */
    const refreshPlaylistsRef = useRef(refreshPlaylists)
    refreshPlaylistsRef.current = refreshPlaylists

    /** 現在のジャンルの楽曲を "MoodTune" Spotify プレイリストに保存して開く */
    const handleSaveToSpotify = useCallback(async () => {
        if (isLoadingOrEmpty || isSaving) return
        setSaveError(null)
        setIsSaving(true)
        try {
            const result = await saveToSpotify(currentPlaylist.title, currentPlaylist.trackUris)
            if (result.success) {
                window.open(result.playlistUrl, "_blank", "noopener,noreferrer")
            } else {
                setSaveError(result.error)
            }
        } catch {
            setSaveError("Spotifyへの接続に失敗しました")
        } finally {
            setIsSaving(false)
        }
    }, [isLoadingOrEmpty, isSaving, currentPlaylist])

    /** 表示中の1ジャンルだけ現在の天気・時間で再構築（レコード右3周で発火） */
    const refreshPlaylistByGenre = useCallback(async (genre: Genre) => {
        if (!selectedGenres.includes(genre)) return
        if (isLoadingRef.current) return // ローディング中は無視
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

    /** ジャンル差分に応じてプレイリストを更新（追加ジャンルのみAPI呼び出し。既存は currentPlaylists を再利用） */
    const updatePlaylistsWithDiff = useCallback(async (
        currentGenres: string[],
        diff: { added: string[], removed: string[], unchanged: string[] },
        currentPlaylists: DashboardItem[] | null,
        isInitialSync = false
    ) => {
        if (currentGenres.length === 0) {
            setPlaylists([])
            setCurrentIndex(0)
            return
        }
        if (isLoadingRef.current) return // ローディング中は無視

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

    /** ジャンル選択パネルの開閉（閉じたときにジャンル変更があればプレイリスト再構築）。0件時は閉じない。 */
    const handleToggleSettings = useCallback(() => {
        if (openPanel !== "genre") {
            genresOnOpenRef.current = [...selectedGenres]
            setOpenPanel("genre")
        } else {
            if (selectedGenres.length === 0) return // 1つ以上選択するまで閉じない
            setOpenPanel(null)
            if (hasGenresChanged(genresOnOpenRef.current, selectedGenres)) {
                const diff = getGenresDiff(genresOnOpenRef.current, selectedGenres)
                updatePlaylistsWithDiff(selectedGenres, diff, playlists)
            }
        }
    }, [openPanel, selectedGenres, playlists, updatePlaylistsWithDiff])

    /** localStorage のジャンル読み込み完了後、保存値と表示プレイリストが食い違っていれば同期。suspended 中はスキップ */
    useEffect(() => {
        if (suspended || !isGenresInitialized || hasPerformedInitialSyncRef.current) return
        hasPerformedInitialSyncRef.current = true

        const currentPlaylistGenres = playlists?.map(p => p.genre) ?? []
        if (hasGenresChanged(currentPlaylistGenres, selectedGenres)) {
            const diff = getGenresDiff(currentPlaylistGenres, selectedGenres)
            updatePlaylistsWithDiff(selectedGenres, diff, playlists, true)
        }
    }, [suspended, isGenresInitialized, selectedGenres, playlists, updatePlaylistsWithDiff])

    /** 実時刻の時間帯が変わったタイミングでプレイリストを自動更新（手動設定中は行わない）。常に自動更新ONとして動作。 */
    useEffect(() => {
        if (isMoodTuning || !isGenresInitialized || selectedGenres.length === 0) return
        const prev = prevTimeOfDayRef.current
        prevTimeOfDayRef.current = actualTimeOfDay
        if (prev !== null && prev !== actualTimeOfDay) {
            refreshPlaylists({ autoUpdate: true })
        }
    }, [actualTimeOfDay, isMoodTuning, isGenresInitialized, selectedGenres.length, refreshPlaylists])

    /** プレイリスト構築中はパネルを閉じ、値変更を防ぐ（同期ずれ防止） */
    useEffect(() => {
        if (isLoading) setOpenPanel(null)
    }, [isLoading])

    /** Mood Tuning パネル閉時のみ: トリガーがインクリメントされたときだけ再構築。openPanel を依存に含めない＝パネル開閉で再実行されない（開くだけで全件再構築・Favorite Music 閉じで上書きするバグを防止）。ジャンルパネル開中は選択変更で発火しないよう openPanel === "genre" でガード。 */
    useEffect(() => {
        if (openPanel === "genre") return
        if (playlistRefreshTrigger === 0 || !isGenresInitialized || selectedGenres.length === 0) return
        refreshPlaylistsRef.current()
    }, [playlistRefreshTrigger, isGenresInitialized, selectedGenres.length])

    /** APIが天気の変更を示したタイミングでプレイリストを自動更新（手動設定中は対象外）。常に自動更新ONとして動作。 */
    useEffect(() => {
        if (isMoodTuning || !isGenresInitialized || selectedGenres.length === 0) return
        const current = actualWeatherType ?? null
        const prev = prevActualWeatherRef.current
        prevActualWeatherRef.current = current
        if (prev !== null && prev !== current) {
            refreshPlaylists({ autoUpdate: true })
        }
    }, [actualWeatherType, isMoodTuning, isGenresInitialized, selectedGenres.length, refreshPlaylists])

    /** 表示中の天気・時間が実際と異なる場合に Mood Tuning 表示を適用（パネル開閉に依存させず、動的プレビューも同一UIに） */
    const actualWeatherNorm = actualWeatherType ? normalizeWeatherType(actualWeatherType) : null
    const isMoodTuningApplied =
        actualWeatherNorm != null && effectiveWeather !== actualWeatherNorm || effectiveTimeOfDay !== actualTimeOfDay
    const backgroundStyle = isTimeInitialized
      ? formatGradientBackground(getWeatherBackground(effectiveWeather, effectiveTimeOfDay))
      : INITIAL_BACKGROUND_GRADIENT
    const genreColorClass = isDark ? "text-white/80" : "text-muted-foreground"
    const titleColorClass = isDark ? "text-white" : "text-foreground"

    const {
        rotation,
        isDragging,
        cumulativeRotation,
        snapBackDurationMs,
        vinylRef,
        handleMouseDown,
        handleMouseUp,
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd,
    } = useVinylRotation({
        onRotationComplete: (direction) => {
            const length = displayPlaylists.length
            if (length === 0) return

            if (direction === "next") {
                setCurrentIndex((prev) => (prev + 1) % length)
            } else {
                setCurrentIndex((prev) => (prev - 1 + length) % length)
            }
        },
        canPaginate: displayPlaylists.length > 1,
        onRegenerateCurrent:
            displayPlaylists.length > 0 && currentPlaylist.genre !== "---"
                ? () => refreshPlaylistByGenre(currentPlaylist.genre as Genre)
                : undefined,
        onRegenerateAll:
            selectedGenres.length > 0 ? refreshPlaylists : undefined,
    })

    /** 3周フィードバック表示: ドラッグ中・戻り演出でない・1周超 */
    const showRegenerateFeedback =
        isDragging &&
        snapBackDurationMs === null &&
        Math.abs(cumulativeRotation) > REGENERATE_ZONE_ENTRY_DEG
    /** 3周までの進捗 0〜1（エフェクト強度用） */
    const regenerateProgress = showRegenerateFeedback
        ? Math.min(1, Math.abs(cumulativeRotation) / REGENERATE_THRESHOLD_DEG)
        : 0
    /** 3周フィードバックの文言 */
    const regenerateMessage = (() => {
        if (!showRegenerateFeedback) return null
        const abs = Math.abs(cumulativeRotation)
        if (cumulativeRotation >= REGENERATE_THRESHOLD_DEG) return "離すと再構築"
        if (cumulativeRotation <= -REGENERATE_THRESHOLD_DEG) return "離すと全件再構築"
        const remainingTurns = Math.ceil((REGENERATE_THRESHOLD_DEG - abs) / 360)
        return cumulativeRotation > 0
            ? `あと${remainingTurns}周で再構築`
            : `あと${remainingTurns}周で全件再構築`
    })()

    return (
        <div
            className="h-dvh min-h-0 flex flex-col items-center justify-between p-4 pb-20 sm:p-6 sm:pb-8 overflow-hidden transition-all duration-1000 ease-in-out relative z-10"
            style={{
                background: backgroundStyle,
            }}
        >
            {/* Weather Animation */}
            <WeatherAnimation />

            {/* Mood Tuning パネル。ジャンルパネル開時または構築中はボタン非表示・構築中はパネルも閉じる */}
            <WeatherMoodTuningPanel
                isOpen={openPanel === "mood" && !isLoading}
                onOpen={() => setOpenPanel("mood")}
                onClose={() => setOpenPanel(null)}
                hideToggleButton={openPanel === "genre" || isLoading}
            />

            {/* Settings Toggle Button（ジャンル選択・右下）。気分パネル開時または構築中は非表示 */}
            {openPanel !== "mood" && !isLoading && (
                <Button
                    variant="outline"
                    size="icon"
                    onClick={handleToggleSettings}
                    disabled={openPanel === "genre" && selectedGenres.length === 0}
                    className={`
                      fixed bottom-12 right-4 z-50 size-[3.1rem] rounded-[1.2rem] bg-background/80 backdrop-blur-sm
                      [&_svg]:size-6
                      ${openPanel === "genre" ? "bg-primary text-primary-foreground" : ""}
                    `}
                    aria-label={openPanel === "genre" && selectedGenres.length === 0 ? "1つ以上ジャンルを選択すると閉じられます" : openPanel === "genre" ? "Favorite Musicパネルを閉じる" : "Favorite Musicパネルを開く"}
                >
                    <Music className="size-6" />
                </Button>
            )}

            {/* Settings Panel with Genre Selector（ボタンの上に表示）。構築中は非表示 */}
            {openPanel === "genre" && !isLoading && (
                <div className="fixed bottom-24 right-4 z-50 w-80 max-w-[calc(100vw-2rem)]">
                    <GenreSelector />
                </div>
            )}

            {/* Weather Section（縦幅が狭くても潰れないよう固定。items-center と同様に中央寄せを維持） */}
            <div className="shrink-0 w-full flex justify-center">
                <WeatherMonitor />
            </div>

            {/* Vinyl Record Section（縦幅が狭いときはレコードを縮小して重なりを防止） */}
            <div className="flex-1 min-h-0 flex flex-col items-center justify-center w-full max-w-md relative z-10 py-2 record-section-gap">
                {/* ヒントは高さを固定しレコード・ページネーションの位置を常に揃える（2行＋Mood Tuning時は text-base で行が伸びるため min-h で統一） */}
                <div
                    className={`text-center space-y-0.5 shrink-0 min-h-12 ${isLoading || openPanel === "mood" || openPanel === "genre" ? "invisible" : ""}`}
                    aria-hidden={isLoading || openPanel === "mood" || openPanel === "genre"}
                >
                    <p className={`text-[10px] font-light whitespace-nowrap flex items-center justify-center gap-1 ${isDark ? "text-white/80" : "text-muted-foreground/70"}`}>
                        {selectedGenres.length <= 1 ? (
                            <>
                                <Music className="w-3 h-3 shrink-0" aria-hidden />
                                お気に入りのジャンルを追加
                            </>
                        ) : (
                            "左右にスピンして他のプレイリストへ"
                        )}
                    </p>
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                        <p className={`text-[9px] font-light whitespace-nowrap ${isDark ? "text-white/60" : "text-muted-foreground/50"}`}>
                            {selectedGenres.length === 0
                                ? "1つ以上選択するとスピンで再構築できます"
                                : selectedGenres.length === 1
                                    ? "右3周でプレイリストを再構築"
                                    : "右3周でプレイリストを再構築・左3周で一括再構築"}
                        </p>
                        {isMoodTuningApplied && (
                            <span className="text-base font-semibold text-rainbow whitespace-nowrap">Mood Tuning</span>
                        )}
                    </div>
                </div>

                {/* レコードと3周メッセージをひとまとまりにし、下はページネーションに隙間なし */}
                <div className="flex flex-col items-center shrink-0">
                <div
                    className="relative w-[min(18rem,42vh)] h-[min(18rem,42vh)] rounded-full transition-shadow duration-200 shrink-0"
                    style={
                        showRegenerateFeedback
                            ? {
                                boxShadow: `0 0 ${29 + regenerateProgress * 58}px ${vinylColors.accentColor}90, 0 0 ${14 + regenerateProgress * 29}px ${vinylColors.accentColor}60`,
                            }
                            : undefined
                    }
                >
                    {/* 固定された影（回転しない） */}
                    <div className="absolute inset-0 rounded-full shadow-2xl pointer-events-none" />

                    <div
                        ref={vinylRef}
                        className={`relative w-full h-full select-none touch-none ${isLoading ? "pointer-events-none cursor-default" : "cursor-grab active:cursor-grabbing"}`}
                        style={{
                            transform: `rotate(${rotation}deg)`,
                            transition: isDragging
                                ? "none"
                                : snapBackDurationMs != null
                                    ? `transform ${snapBackDurationMs}ms cubic-bezier(0.6, 0, 1, 1)`
                                    : "none",
                        }}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onMouseDown={handleMouseDown}
                        onMouseUp={handleMouseUp}
                    >
                        {/* Vinyl Disc */}
                        <div className="absolute inset-0 rounded-full overflow-hidden">
                            <div className={`absolute inset-0 bg-linear-to-br ${vinylColors.vinylColor} opacity-92`} />
                            {[...Array(20)].map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute inset-0 rounded-full border border-white/5"
                                    style={{
                                        transform: `scale(${1 - i * 0.04})`,
                                    }}
                                />
                            ))}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-[33%] h-[33%] min-w-12 min-h-12 max-w-24 max-h-24 rounded-full bg-card shadow-xl flex items-center justify-center overflow-hidden">
                                    {isLoadingOrEmpty ? (
                                        <div className="w-[83%] h-[83%] rounded-full bg-muted/50 animate-pulse" />
                                    ) : (
                                        <img
                                            src={getImageUrl(currentPlaylist.imageUrl)}
                                            alt={currentPlaylist.title}
                                            className="w-full h-full rounded-full object-cover"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement
                                                target.src = "/placeholder.svg"
                                            }}
                                        />
                                    )}
                                </div>
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-4 h-4 rounded-full bg-background shadow-inner" />
                            </div>
                        </div>
                    </div>

                    {/* Tonearm overlay: scale/position from record-tonearm-reference.svg (record r=225, center 225,231.29; pivot 478.50,63.79; tonearm 332×366) */}
                    <div
                        className="absolute inset-0 pointer-events-none overflow-visible"
                        aria-hidden
                        style={{
                            // record-tonearm-reference: record diameter 450, tonearm 332×366 → width 332/450, height 366/450 of container
                            // Pivot (478.50,63.79) vs record center (225,231.29) → pivot at (106.33%, 12.78%) in container
                            // tonearm.svg pivot at (221.90/332, 63.79/366) → left/top so that pivot lands at (106.33%, 12.78%)
                            left: "57.06%",
                            top: "-1.40%",
                            width: "73.78%",
                            height: "81.33%",
                        }}
                    >
                        <svg
                            className="w-full h-full drop-shadow-md"
                            viewBox="0 0 332 366"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            preserveAspectRatio="xMidYMid meet"
                        >
                            <defs>
                                <filter id="tonearm-pivot-shadow" x="-50%" y="-50%" width="200%" height="200%">
                                    <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="black" floodOpacity="0.35" />
                                </filter>
                            </defs>
                            <circle cx="221.897" cy="63.7868" r="25" transform="rotate(-17.9996 221.897 63.7868)" fill={vinylColors.accentColor} filter="url(#tonearm-pivot-shadow)" />
                            <path d="M225.05 27.1963C225.797 24.1904 228.812 22.3346 231.832 23.021C234.902 23.7187 236.822 26.7769 236.116 29.8449L195.908 204.559C195.57 206.024 194.907 207.395 193.967 208.568L122.532 297.749C119.718 301.261 114.317 301.079 111.747 297.384C110.053 294.95 110.151 291.694 111.988 289.366L180.56 202.477C181.44 201.362 182.072 200.073 182.415 198.694L225.05 27.1963Z" fill="#D9D9D9" />
                            <path d="M104.424 330.4C102.784 332.775 99.4779 333.272 97.212 331.483L86.403 322.949C84.2033 321.213 83.8604 318.008 85.6428 315.845L116.761 278.088C118.499 275.979 121.609 275.656 123.743 277.364L131.256 283.374C133.306 285.014 133.739 287.96 132.247 290.12L104.424 330.4Z" fill={REALISTIC_VINYL_THEME.accentColor} />
                            <circle cx="140.805" cy="321.355" r="4.47665" transform="rotate(-56.8972 140.805 321.355)" fill={REALISTIC_VINYL_THEME.accentColor} />
                            <rect width="8.9533" height="25.5809" transform="translate(116.395 310.786) rotate(-56.8972)" fill={REALISTIC_VINYL_THEME.accentColor} />
                            <path d="M221.045 11.7671C221.513 9.02436 224.13 7.19152 226.868 7.68925L238.712 9.8427C241.53 10.355 243.342 13.125 242.683 15.9122L231.692 62.4163C231.212 64.4431 229.527 65.9607 227.461 66.2256L218.097 67.4262C214.764 67.8535 211.967 64.9374 212.532 61.6253L221.045 11.7671Z" fill={REALISTIC_VINYL_THEME.accentColor} />
                        </svg>
                    </div>
                </div>

                {/* 3周フィードバック文言（レコードとは少しあけ、ページネーションとは詰める。1行分のスペースは常に確保） */}
                <div
                    className={`mt-1.5 -mb-0.5 min-h-4 flex items-center justify-center w-full text-center shrink-0 transition-opacity duration-150 leading-none ${regenerateMessage ? "" : "invisible"}`}
                    style={regenerateMessage ? { opacity: 0.7 + regenerateProgress * 0.3 } : undefined}
                    aria-hidden={!regenerateMessage}
                >
                    <span
                        className={`text-xs font-medium whitespace-nowrap ${isDark ? "text-white/90" : "text-foreground/90"}`}
                    >
                        {regenerateMessage ?? "\u00A0"}
                    </span>
                </div>
                </div>

                {/* Indicator dots（ジャンルごとのテーマカラー。Mood Tuning 中は非選択ドットが1本の虹になる） */}
                <div className="flex gap-1.5 shrink-0">
                    {displayPlaylists.map((item, i) => {
                        const colors = (useRealisticVinyl && i === safeCurrentIndex) ? REALISTIC_VINYL_THEME : getGenreThemeColors(item.genre)
                        const isActive = i === safeCurrentIndex
                        const inactiveCount = Math.max(1, displayPlaylists.length - 1)
                        const inactiveIndex = i < safeCurrentIndex ? i : i - 1
                        const rainbowSliceStyle =
                          isMoodTuningApplied && !isActive
                            ? {
                                background: "linear-gradient(90deg, #ef4444, #f97316, #eab308, #22c55e, #06b6d4, #8b5cf6, #ec4899, #ef4444)",
                                backgroundSize: `${inactiveCount * 100}% 100%`,
                                backgroundPosition: `${-inactiveIndex * 100}% 0`,
                              }
                            : undefined
                        return (
                          <div
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${isActive ? "w-6" : isMoodTuningApplied ? "" : "bg-border"}`}
                            style={isActive ? { backgroundColor: colors.accentColor } : rainbowSliceStyle}
                          />
                        )
                    })}
                </div>
            </div>

            {/* Playlist Info Section（ページネーションとの幅を確保するため上に余白。ジャンル名〜Spotifyボタンの位置関係は固定） */}
            <div className="w-full max-w-md shrink-0 mt-5 sm:mt-6 space-y-4 sm:space-y-6 pb-4 relative z-10">
                <div className="text-center space-y-2 sm:space-y-3">
                    <p className={`text-[10px] sm:text-xs uppercase tracking-widest font-light ${genreColorClass}`}>
                        {isLoadingOrEmpty ? LOADING_GENRE_TEXT : currentPlaylist.genre}
                    </p>
                    <h2 className={`text-xl sm:text-2xl font-serif leading-tight text-balance ${isMoodTuningApplied ? "text-rainbow" : titleColorClass}`}>
                        {isLoadingOrEmpty ? getLoadingTitleText(loadingMode) : currentPlaylist.title}
                    </h2>
                </div>

                <div className="flex items-center justify-center">
                    {/* ジャケットは常に同一外寸のラッパーで配置を固定（非Mood Tuning時を基準）。虹枠は見た目だけ */}
                    <div className={`p-[2px] rounded-lg shrink-0 w-[calc(6rem+4px)] h-[calc(6rem+4px)] sm:w-[calc(8rem+4px)] sm:h-[calc(8rem+4px)] ${isMoodTuningApplied ? "bg-rainbow" : ""}`}>
                        {isLoadingOrEmpty ? (
                            <div className={`w-24 h-24 sm:w-32 sm:h-32 bg-muted/50 animate-pulse flex items-center justify-center ${isMoodTuningApplied ? "rounded-[calc(1rem-2px)]" : "rounded-lg"}`}>
                                <Music className={`w-6 h-6 sm:w-8 sm:h-8 ${isDark ? "text-white/30" : "text-muted-foreground/30"}`} />
                            </div>
                        ) : (
                            <img
                                src={getImageUrl(currentPlaylist.imageUrl)}
                                alt={currentPlaylist.title}
                                className={`w-24 h-24 sm:w-32 sm:h-32 shadow-lg object-cover ${isMoodTuningApplied ? "rounded-[calc(1rem-2px)]" : "rounded-lg"}`}
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.src = "/placeholder.svg"
                                }}
                            />
                        )}
                    </div>
                </div>

                {/* Spotify 再生ボタン（アプリのモックモード時は disabled で表示） */}
                {(() => {
                    const isMockMode = process.env.NEXT_PUBLIC_USE_MOCK !== "false"
                    const spotifyDisabled =
                        isMockMode ||
                        isLoadingOrEmpty ||
                        isSaving ||
                        currentPlaylist.trackUris.length === 0
                    const disabledReason = isMockMode
                        ? "Spotify連携時のみ利用できます"
                        : isSaving
                            ? null
                            : isLoadingOrEmpty
                              ? "プレイリストを読み込み中です"
                              : currentPlaylist.trackUris.length === 0
                                ? "再生できる曲を取得できませんでした。しばらく経ってからお試しください。"
                                : null
                    const buttonLabel = isMockMode
                        ? "Spotifyで再生（モック中）"
                        : isSaving
                            ? "保存中..."
                            : "Spotifyで再生"
                    return (
                        <div className="flex flex-col items-center gap-2">
                            <Button
                                onClick={handleSaveToSpotify}
                                disabled={spotifyDisabled}
                                className="flex items-center gap-2 bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold rounded-full px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                                    </svg>
                                )}
                                {buttonLabel}
                            </Button>
                            {disabledReason && (
                                <p className="text-xs text-white/60 text-center max-w-[240px]" role="status">
                                    {disabledReason}
                                </p>
                            )}
                            {saveError && (
                                <p className="text-xs text-red-400">{saveError}</p>
                            )}
                        </div>
                    )
                })()}
            </div>
        </div>
    )
}
