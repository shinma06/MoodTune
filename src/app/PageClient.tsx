"use client"

import { useState } from "react"
import PlaylistExplorer from "@/components/PlaylistExplorer"
import OnboardingOrchestrator from "@/components/onboarding/OnboardingOrchestrator"

interface Props {
  isUnauthenticated: boolean
}

export default function PageClient({ isUnauthenticated }: Props) {
  /** ジャンル選択モーダルが必要かどうかが確定するまで true（プレイリスト構築をブロック） */
  const [genreSelectPending, setGenreSelectPending] = useState(true)
  /** Spotify機能導線からログインモーダルを開くためのトリガー */
  const [loginModalTrigger, setLoginModalTrigger] = useState(0)

  return (
    <>
      <PlaylistExplorer
        suspended={genreSelectPending}
        isUnauthenticated={isUnauthenticated}
        onRequestLoginModal={() => setLoginModalTrigger((prev) => prev + 1)}
      />
      <OnboardingOrchestrator
        isUnauthenticated={isUnauthenticated}
        loginModalTrigger={loginModalTrigger}
        onInitialized={(needsGenreSelect) => setGenreSelectPending(needsGenreSelect)}
        onGenreSelectDone={() => setGenreSelectPending(false)}
      />
    </>
  )
}
