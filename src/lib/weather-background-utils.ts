import type { BackgroundGradient } from "./weather-background"

/**
 * 時間帯が確定する前（SSR/初回クライアント）に使う中性背景。
 * サーバー時刻に依存せず、クライアント時刻確定後に正しい時間帯背景へ切り替える。
 */
export const INITIAL_BACKGROUND_GRADIENT =
  "linear-gradient(to bottom, #fafafa, #e5e7eb, #d1d5db, #9ca3af)"

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

