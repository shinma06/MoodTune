"use client"

import { useState } from "react"
import PlaylistExplorer from "@/components/PlaylistExplorer"
import OnboardingOrchestrator from "@/components/onboarding/OnboardingOrchestrator"

interface Props {
  isUnauthenticated: boolean
  loginAction: () => Promise<void>
}

export default function PageClient({ isUnauthenticated, loginAction }: Props) {
  /** ジャンル選択モーダルが必要かどうかが確定するまで true（プレイリスト構築をブロック） */
  const [genreSelectPending, setGenreSelectPending] = useState(true)

  return (
    <>
      <PlaylistExplorer suspended={genreSelectPending} />
      <OnboardingOrchestrator
        isUnauthenticated={isUnauthenticated}
        loginAction={loginAction}
        onInitialized={(needsGenreSelect) => setGenreSelectPending(needsGenreSelect)}
        onGenreSelectDone={() => setGenreSelectPending(false)}
      />
    </>
  )
}
