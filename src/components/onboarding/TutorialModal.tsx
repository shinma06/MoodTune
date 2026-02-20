"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"
import TutorialMediaPlaceholder from "./TutorialMediaPlaceholder"
import { useWeather } from "@/contexts/WeatherContext"

type TutorialStepType = "welcome" | "feature" | "paywall"

interface TutorialStep {
  stepType: TutorialStepType
  title: string
  description: React.ReactNode
  mediaPath?: string
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    stepType: "welcome",
    title: "MoodTuneへようこそ",
    description:
      "今いる場所の天気と時間帯に合わせて、最適な音楽プレイリストをAIが自動で提案します。",
    mediaPath: "/onboarding/step1.png",
  },
  {
    stepType: "feature",
    title: "天気と連動するプレイリスト",
    description:
      "雨の午後、晴れた朝、夜の街——それぞれの空気感にぴったりな音楽をAIが選曲します。位置情報を許可すると自動で取得します。",
    mediaPath: "/onboarding/step2.jpg",
  },
  {
    stepType: "feature",
    title: "レコードでジャンルを切り替え",
    description:
      "レコードを左右にスピンして、表示するジャンルを切り替えられます。",
    mediaPath: "/onboarding/step3.webm",
  },
  {
    stepType: "feature",
    title: "3周まわしてプレイリスト再生成",
    description:
      "右に3周まわすと表示中のジャンルのプレイリストを再構築、左に3周まわすと全ジャンルを一括再構築します。",
    mediaPath: "/onboarding/step4.webm",
  },
  {
    stepType: "feature",
    title: "Mood Tuningで気分に合わせる",
    description: (
      <>
        左下の<Sparkles className="inline w-3.5 h-3.5 mx-0.5 align-[-2px]" />ボタンから天気や時間帯を手動で変更できます。今の気分に合わせたプレイリストをいつでも作れます。
      </>
    ),
    mediaPath: "/onboarding/step5.webm",
  },
]

interface Props {
  onComplete: () => void
}

export default function TutorialModal({ onComplete }: Props) {
  const [currentStep, setCurrentStep] = useState(0)
  const { isOverlayThemeDark } = useWeather()

  const step = TUTORIAL_STEPS[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center backdrop-blur-sm bg-black/50 p-4">
      <div className={`w-full max-w-md h-[80dvh] max-h-[80dvh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden ${isOverlayThemeDark ? "bg-slate-900/95 border-white/10" : "bg-background/95 border-border/50"}`}>
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex gap-1.5">
            {TUTORIAL_STEPS.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i === currentStep
                    ? `w-4 h-1.5 ${isOverlayThemeDark ? "bg-white" : "bg-primary"}`
                    : i < currentStep
                    ? `w-1.5 h-1.5 ${isOverlayThemeDark ? "bg-white/60" : "bg-primary/50"}`
                    : `w-1.5 h-1.5 ${isOverlayThemeDark ? "bg-white/20" : "bg-border"}`
                }`}
              />
            ))}
          </div>
          <button
            onClick={onComplete}
            className={`text-xs transition-colors ${isOverlayThemeDark ? "text-white/40 hover:text-white/70" : "text-muted-foreground hover:text-foreground"}`}
          >
            スキップ
          </button>
        </div>

        {/* コンテンツ */}
        <div className="flex-1 overflow-hidden px-6 pb-2">
          <div className="flex h-full flex-col gap-4">
            <div className="min-h-0 flex-1">
              <TutorialMediaPlaceholder mediaPath={step.mediaPath} alt={step.title} className="h-full" />
            </div>
            <div className="space-y-2 shrink-0 pb-1">
            <h2 className={`text-lg font-semibold ${isOverlayThemeDark ? "text-white" : "text-foreground"}`}>
              {step.title.includes("Mood Tuning") ? (
                <>
                  <span className="text-rainbow">Mood Tuning</span>
                  {step.title.replace("Mood Tuning", "")}
                </>
              ) : step.title}
            </h2>
            <p className={`text-sm leading-relaxed ${isOverlayThemeDark ? "text-white/60" : "text-muted-foreground"}`}>{step.description}</p>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="px-6 pb-6 pt-2 flex gap-2">
          {!isFirstStep && (
            <Button
              onClick={() => setCurrentStep((prev) => prev - 1)}
              className={`flex-1 rounded-full font-semibold ${isOverlayThemeDark ? "bg-white/10 text-white hover:bg-white/20" : "bg-foreground/5 text-foreground hover:bg-foreground/10"}`}
            >
              戻る
            </Button>
          )}
          <Button
            onClick={isLastStep ? onComplete : () => setCurrentStep((prev) => prev + 1)}
            className={`flex-1 rounded-full font-semibold ${isOverlayThemeDark ? "bg-white text-slate-900 hover:bg-white/90" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}
          >
            {isLastStep ? "はじめる" : "次へ"}
          </Button>
        </div>
      </div>
    </div>
  )
}
