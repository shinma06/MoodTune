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
  },
  {
    stepType: "feature",
    title: "天気と連動するプレイリスト",
    description:
      "雨の午後、晴れた朝、夜の街——それぞれの空気感にぴったりな音楽をAIが選曲します。位置情報を許可すると自動で取得します。",
    mediaPath: "/onboarding/step2.gif",
  },
  {
    stepType: "feature",
    title: "レコードでジャンルを切り替え",
    description:
      "レコードを左右にスピンして、表示するジャンルを切り替えられます。",
    mediaPath: "/onboarding/step3.gif",
  },
  {
    stepType: "feature",
    title: "3周まわしてプレイリスト再生成",
    description:
      "右に3周まわすと表示中のジャンルのプレイリストを再構築、左に3周まわすと全ジャンルを一括再構築します。",
    mediaPath: "/onboarding/step4.gif",
  },
  {
    stepType: "feature",
    title: "Mood Tuningで気分に合わせる",
    description: (
      <>
        左下の<Sparkles className="inline w-3.5 h-3.5 mx-0.5 align-[-2px]" />ボタンから天気や時間帯を手動で変更できます。今の気分に合わせたプレイリストをいつでも作れます。
      </>
    ),
    mediaPath: "/onboarding/step5.gif",
  },
]

interface Props {
  onComplete: () => void
}

export default function TutorialModal({ onComplete }: Props) {
  const [currentStep, setCurrentStep] = useState(0)
  const { effectiveTimeOfDay } = useWeather()
  const isDark = effectiveTimeOfDay === "dusk" || effectiveTimeOfDay === "night"

  const step = TUTORIAL_STEPS[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm bg-black/50 p-4">
      <div className={`w-full max-w-md rounded-2xl border shadow-2xl flex flex-col max-h-[90vh] ${isDark ? "bg-slate-900/95 border-white/10" : "bg-background/95 border-border/50"}`}>
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex gap-1.5">
            {TUTORIAL_STEPS.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i === currentStep
                    ? `w-4 h-1.5 ${isDark ? "bg-white" : "bg-primary"}`
                    : i < currentStep
                    ? `w-1.5 h-1.5 ${isDark ? "bg-white/60" : "bg-primary/50"}`
                    : `w-1.5 h-1.5 ${isDark ? "bg-white/20" : "bg-border"}`
                }`}
              />
            ))}
          </div>
          <button
            onClick={onComplete}
            className={`text-xs transition-colors ${isDark ? "text-white/40 hover:text-white/70" : "text-muted-foreground hover:text-foreground"}`}
          >
            スキップ
          </button>
        </div>

        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto px-6 pb-2">
          <div className="mb-4">
            {step.stepType === "welcome" ? (
              <div className={`w-full aspect-video rounded-xl flex items-center justify-center ${isDark ? "bg-gradient-to-br from-purple-900/60 to-pink-900/40" : "bg-gradient-to-br from-amber-50 to-rose-50"}`}>
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                    </svg>
                  </div>
                  <p className={`text-xs font-serif tracking-wider ${isDark ? "text-white/60" : "text-muted-foreground"}`}>MoodTune</p>
                </div>
              </div>
            ) : (
              <TutorialMediaPlaceholder mediaPath={step.mediaPath} alt={step.title} />
            )}
          </div>

          <div className="space-y-2 mb-4">
            <h2 className={`text-lg font-semibold ${isDark ? "text-white" : "text-foreground"}`}>
              {step.title.includes("Mood Tuning") ? (
                <>
                  <span className="text-rainbow">Mood Tuning</span>
                  {step.title.replace("Mood Tuning", "")}
                </>
              ) : step.title}
            </h2>
            <p className={`text-sm leading-relaxed ${isDark ? "text-white/60" : "text-muted-foreground"}`}>{step.description}</p>
          </div>
        </div>

        {/* フッター */}
        <div className="px-6 pb-6 pt-2 flex gap-2">
          {!isFirstStep && (
            <Button
              onClick={() => setCurrentStep((prev) => prev - 1)}
              className={`flex-1 rounded-full font-semibold ${isDark ? "bg-white/10 text-white hover:bg-white/20" : "bg-foreground/5 text-foreground hover:bg-foreground/10"}`}
            >
              戻る
            </Button>
          )}
          <Button
            onClick={isLastStep ? onComplete : () => setCurrentStep((prev) => prev + 1)}
            className={`flex-1 rounded-full font-semibold ${isDark ? "bg-white text-slate-900 hover:bg-white/90" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}
          >
            {isLastStep ? "はじめる" : "次へ"}
          </Button>
        </div>
      </div>
    </div>
  )
}
