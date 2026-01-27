"use client"

import { useLocalStorage } from "@/hooks/useLocalStorage"
import {
  AVAILABLE_GENRES,
  MAX_SELECTED_GENRES,
  GENRE_STORAGE_KEY,
  DEFAULT_SELECTED_GENRES,
  type Genre,
} from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Music } from "lucide-react"

export default function GenreSelector() {
  const [selectedGenres, setSelectedGenres] = useLocalStorage<Genre[]>(
    GENRE_STORAGE_KEY,
    DEFAULT_SELECTED_GENRES
  )

  const toggleGenre = (genre: Genre) => {
    setSelectedGenres((prev) => {
      let newGenres: Genre[]
      
      if (prev.includes(genre)) {
        // 選択解除（少なくとも1つは選択されている必要がある）
        if (prev.length === 1) {
          return prev // 1つしか選択されていない場合は解除できない
        }
        newGenres = prev.filter((g) => g !== genre)
      } else {
        // 選択（最大数チェック）
        if (prev.length >= MAX_SELECTED_GENRES) {
          return prev // 最大数に達している場合は何もしない
        }
        newGenres = [...prev, genre]
      }
      
      return newGenres
    })
  }

  const isSelected = (genre: Genre) => selectedGenres.includes(genre)
  const isMaxReached = selectedGenres.length >= MAX_SELECTED_GENRES

  return (
    <Card className="w-full bg-background/80 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Music className="w-4 h-4" />
          ジャンル選択
          <span className="ml-auto text-xs font-normal text-muted-foreground">
            {selectedGenres.length}/{MAX_SELECTED_GENRES}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_GENRES.map((genre) => {
            const selected = isSelected(genre)
            const isOnlyOneSelected = selectedGenres.length === 1 && selected
            const disabled = (!selected && isMaxReached) || isOnlyOneSelected
            
            return (
              <Button
                key={genre}
                variant={selected ? "default" : "outline"}
                size="sm"
                onClick={() => toggleGenre(genre)}
                disabled={disabled}
                className={`
                  h-7 px-3 text-xs font-medium rounded-full transition-all
                  ${selected 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "hover:bg-muted/50"
                  }
                  ${disabled ? "opacity-50 cursor-not-allowed" : ""}
                `}
              >
                {selected && <Check className="w-3 h-3 mr-1" />}
                {genre}
              </Button>
            )
          })}
        </div>
        {isMaxReached && (
          <p className="mt-3 text-xs text-muted-foreground">
            最大{MAX_SELECTED_GENRES}個まで選択できます。変更するには選択済みのジャンルを解除してください。
          </p>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Hook to get selected genres from localStorage
 */
export function useSelectedGenres(): Genre[] {
  const [selectedGenres] = useLocalStorage<Genre[]>(
    GENRE_STORAGE_KEY,
    DEFAULT_SELECTED_GENRES
  )
  return selectedGenres
}
