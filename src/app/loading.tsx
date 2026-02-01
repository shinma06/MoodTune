import { INITIAL_BACKGROUND_GRADIENT } from "@/lib/weather-background-utils"

/**
 * ページ非同期ロード中のフォールバック。
 * メインコンテンツと同じ中性背景で、白い画面のまま待たせない。
 */
export default function Loading() {
  return (
    <div
      className="min-h-screen w-full"
      style={{ background: INITIAL_BACKGROUND_GRADIENT }}
      aria-hidden
    />
  )
}
