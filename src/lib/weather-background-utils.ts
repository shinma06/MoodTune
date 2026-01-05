import type { BackgroundGradient } from "./weather-background"

/**
 * 背景グラデーションをCSS linear-gradient文字列に変換
 */
export function formatGradientBackground(background: BackgroundGradient): string {
  const colors = [
    background.top,
    background.from,
    background.via,
    background.to,
  ].filter(Boolean)
  return `linear-gradient(to bottom, ${colors.join(", ")})`
}

