"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import {
  AVAILABLE_GENRES,
  MAX_SELECTED_GENRES,
  GENRE_STORAGE_KEY,
  DEFAULT_SELECTED_GENRES,
  type Genre,
} from "@/lib/constants"
import { getOverlayStyles } from "@/lib/overlay-theme"
import { dispatchStorageChange } from "@/hooks/useLocalStorage"
import { useWeather } from "@/contexts/WeatherContext"

interface Props {
  onComplete: (selectedGenres: Genre[]) => void
}

export default function GenreSelectModal({ onComplete }: Props) {
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>(DEFAULT_SELECTED_GENRES)
  const { isOverlayThemeDark } = useWeather()
  const s = getOverlayStyles(isOverlayThemeDark)

  const toggleGenre = (genre: Genre) => {
    setSelectedGenres((prev) => {
      if (prev.includes(genre)) return prev.filter((g) => g !== genre)
      if (prev.length >= MAX_SELECTED_GENRES) return prev
      return [...prev, genre]
    })
  }

  const handleComplete = () => {
    localStorage.setItem(GENRE_STORAGE_KEY, JSON.stringify(selectedGenres))
    dispatchStorageChange(GENRE_STORAGE_KEY)
    onComplete(selectedGenres)
  }

  const isMaxReached = selectedGenres.length >= MAX_SELECTED_GENRES

  const genreBtnClass = (selected: boolean, disabled: boolean) => {
    if (isOverlayThemeDark) {
      return `h-7 px-3 text-xs font-medium rounded-full border transition-all ${
        selected
          ? "bg-white text-slate-900 border-white"
          : "bg-transparent text-white/60 border-white/20 hover:border-white/50 hover:text-white/90"
      } ${disabled ? "opacity-30 cursor-not-allowed" : ""}`
    }
    return `h-7 px-3 text-xs font-medium rounded-full border transition-all ${
      selected
        ? "bg-primary text-primary-foreground border-primary"
        : "bg-transparent text-muted-foreground border-border hover:border-foreground/50 hover:text-foreground"
    } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm bg-black/50 p-4">
      <div className={`w-full max-w-md rounded-2xl ${s.container} border shadow-2xl flex flex-col max-h-[90vh]`}>
        <div className="px-6 pt-6 pb-4">
          <h2 className={`text-lg font-semibold ${s.title}`}>好きなジャンルを選ぼう</h2>
          <p className={`${s.muted} text-sm mt-1`}>最大{MAX_SELECTED_GENRES}つまで選択できます。</p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-2">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className={`text-xs ${s.muted}`}>
                {selectedGenres.length}/{MAX_SELECTED_GENRES}
              </span>
              {selectedGenres.length > 0 && (
                <button
                  onClick={() => setSelectedGenres([])}
                  className={`text-xs ${s.muted} hover:opacity-80 transition-colors`}
                >
                  選択解除
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_GENRES.map((genre) => {
                const selected = selectedGenres.includes(genre)
                const disabled = !selected && isMaxReached
                return (
                  <button
                    key={genre}
                    onClick={() => toggleGenre(genre)}
                    disabled={disabled}
                    className={genreBtnClass(selected, disabled)}
                  >
                    {selected && <Check className="w-3 h-3 mr-1 inline" />}
                    {genre}
                  </button>
                )
              })}
            </div>
            {selectedGenres.length === 0 && (
              <p className={`text-xs ${isOverlayThemeDark ? "text-amber-400" : "text-amber-600"}`}>1つ以上選択してください</p>
            )}
            {isMaxReached && (
              <p className={`text-xs ${s.muted}`}>
                最大{MAX_SELECTED_GENRES}個まで選択できます
              </p>
            )}
          </div>
        </div>

        <div className="px-6 pb-6 pt-4 space-y-2">
          <Button
            onClick={handleComplete}
            disabled={selectedGenres.length === 0}
            className={`w-full rounded-full ${isOverlayThemeDark ? s.buttonSelected : ""} font-semibold disabled:opacity-40`}
          >
            決定
          </Button>
          <p className={`text-center text-xs ${s.muted}`}>あとからいつでも変更できます</p>
        </div>
      </div>
    </div>
  )
}
