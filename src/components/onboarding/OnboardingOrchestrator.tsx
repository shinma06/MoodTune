"use client"

import { useEffect, useRef, useState } from "react"
import {
  AVAILABLE_GENRES,
  DEFAULT_SELECTED_GENRES,
  ONBOARDING_COMPLETED_KEY,
  GENRE_STORAGE_KEY,
  type Genre,
} from "@/lib/constants"
import LoginModal from "./LoginModal"
import TutorialModal from "./TutorialModal"
import GenreSelectModal from "./GenreSelectModal"

type ModalType = "login" | "genre-select" | "tutorial" | null

function isDefaultGenres(genres: Genre[]): boolean {
  if (genres.length === 0) return true
  if (genres.length !== DEFAULT_SELECTED_GENRES.length) return false
  const defaultSet = new Set<Genre>(DEFAULT_SELECTED_GENRES)
  return genres.every((g) => defaultSet.has(g))
}

/** LocalStorage からジャンルを読み込み、AVAILABLE_GENRES で照合してサニタイズ */
function readGenresFromStorage(): Genre[] {
  try {
    const raw = localStorage.getItem(GENRE_STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((v): v is Genre =>
      typeof v === "string" && AVAILABLE_GENRES.includes(v as Genre)
    )
  } catch {
    return []
  }
}

/** フロー: login → genre-select（スキップ不可）→ tutorial（スキップ可）→ null */
function determineInitialModal(isUnauthenticated: boolean): ModalType {
  if (isUnauthenticated) return "login"

  const completed = localStorage.getItem(ONBOARDING_COMPLETED_KEY) === "true"
  if (completed) return null

  const genres = readGenresFromStorage()
  if (isDefaultGenres(genres)) return "genre-select"

  return "tutorial"
}

interface Props {
  isUnauthenticated: boolean
  loginAction: () => Promise<void>
  /** 初期化完了時に呼ばれる。needsGenreSelect: ジャンル選択モーダルが必要か */
  onInitialized?: (needsGenreSelect: boolean) => void
  /** ジャンル選択モーダルが完了したときに呼ばれる */
  onGenreSelectDone?: () => void
}

export default function OnboardingOrchestrator({ isUnauthenticated, loginAction, onInitialized, onGenreSelectDone }: Props) {
  const [modal, setModal] = useState<ModalType>(null)
  const [initialized, setInitialized] = useState(false)
  const onInitializedRef = useRef(onInitialized)
  onInitializedRef.current = onInitialized

  useEffect(() => {
    const initial = determineInitialModal(isUnauthenticated)
    setModal(initial)
    setInitialized(true)
    onInitializedRef.current?.(initial === "genre-select")
  }, [isUnauthenticated])

  const handleGenreSelectComplete = () => {
    const completed = localStorage.getItem(ONBOARDING_COMPLETED_KEY) === "true"
    setModal(completed ? null : "tutorial")
    onGenreSelectDone?.()
  }

  const handleTutorialComplete = () => {
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, "true")
    setModal(null)
  }

  if (!initialized) return null

  if (modal === "login") {
    return <LoginModal loginAction={loginAction} />
  }

  if (modal === "genre-select") {
    return <GenreSelectModal onComplete={handleGenreSelectComplete} />
  }

  if (modal === "tutorial") {
    return <TutorialModal onComplete={handleTutorialComplete} />
  }

  return null
}
