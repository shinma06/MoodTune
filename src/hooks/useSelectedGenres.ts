"use client"

import { useLocalStorage } from "@/hooks/useLocalStorage"
import {
  GENRE_STORAGE_KEY,
  DEFAULT_SELECTED_GENRES,
  type Genre,
} from "@/lib/constants"
import { isValidGenreArray } from "@/lib/validators"

/**
 * localStorage から選択中のジャンルを取得するフック
 * @returns [selectedGenres, setSelectedGenres, isInitialized]
 */
export function useSelectedGenres(): [Genre[], (value: Genre[] | ((prev: Genre[]) => Genre[])) => void, boolean] {
  return useLocalStorage<Genre[]>(
    GENRE_STORAGE_KEY,
    DEFAULT_SELECTED_GENRES,
    { validate: isValidGenreArray }
  )
}
