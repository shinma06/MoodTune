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
import { Check, Music, XCircle } from "lucide-react"

/** localStorage から読み込んだ値が Genre[] として妥当かバリデーション（空配列は全解除状態として許可） */
function isValidGenreArray(value: unknown): value is Genre[] {
  if (!Array.isArray(value)) return false
  if (value.length > MAX_SELECTED_GENRES) return false
  return value.every((v) => typeof v === "string" && AVAILABLE_GENRES.includes(v as Genre))
}

export default function GenreSelector() {
  const [selectedGenres, setSelectedGenres] = useLocalStorage<Genre[]>(
    GENRE_STORAGE_KEY,
    DEFAULT_SELECTED_GENRES,
    { validate: isValidGenreArray }
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

  const clearAll = () => {
    setSelectedGenres([])
  }

  const isSelected = (genre: Genre) => selectedGenres.includes(genre)
  const isMaxReached = selectedGenres.length >= MAX_SELECTED_GENRES
  const isEmpty = selectedGenres.length === 0

  return (
    <Card className="w-full bg-background/80 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Music className="w-4 h-4" />
            Favorite Music
            <span className="text-xs font-normal text-muted-foreground">
              {selectedGenres.length}/{MAX_SELECTED_GENRES}
            </span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            disabled={isEmpty}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
            aria-label="すべて解除"
          >
            <XCircle className="w-3.5 h-3.5 mr-1" />
            選択解除
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isEmpty && (
          <p className="mb-3 text-xs text-amber-600 dark:text-amber-500">
            好みのジャンルを1つ以上選択してください
          </p>
        )}
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
 * localStorage から選択中のジャンルを取得するフック
 * @returns [selectedGenres, isInitialized] ジャンル配列と初期化完了フラグ
 */
export function useSelectedGenres(): [Genre[], boolean] {
  const [selectedGenres, , isInitialized] = useLocalStorage<Genre[]>(
    GENRE_STORAGE_KEY,
    DEFAULT_SELECTED_GENRES,
    { validate: isValidGenreArray }
  )
  return [selectedGenres, isInitialized]
}
