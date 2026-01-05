import type { BackgroundGradient } from "./weather-background"

/**
 * 背景グラデーションをCSS linear-gradient文字列に変換
 * via2、via3、to2も含めて、最大7色の滑らかなグラデーションを生成
 */
export function formatGradientBackground(background: BackgroundGradient): string {
  const colors = [
    background.top,
    background.from,
    background.via,
    background.via2,
    background.via3,
    background.to,
    background.to2,
  ].filter(Boolean)
  return `linear-gradient(to bottom, ${colors.join(", ")})`
}

