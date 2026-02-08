import type { DashboardItem } from "@/types/dashboard"

/** ジャンル配列が変更されたか（順序に依存しない） */
export function hasGenresChanged(prev: string[], current: string[]): boolean {
  if (prev.length !== current.length) return true
  const sortedPrev = [...prev].sort()
  const sortedCurrent = [...current].sort()
  return sortedPrev.some((g, i) => g !== sortedCurrent[i])
}

/** ジャンル配列の差分（追加・削除・変更なし）を算出 */
export function getGenresDiff(prev: string[], current: string[]) {
  const prevSet = new Set(prev)
  const currentSet = new Set(current)

  return {
    added: current.filter((g) => !prevSet.has(g)),
    removed: prev.filter((g) => !currentSet.has(g)),
    unchanged: current.filter((g) => prevSet.has(g)),
  }
}

/** 画像URLを返す（空の場合はプレースホルダー） */
export function getImageUrl(url: string | undefined | null): string {
  if (!url || url.trim() === "") {
    return "/placeholder.svg"
  }
  return url
}

/** ローディング種別 */
export type LoadingMode = "initial" | "all" | "single" | "added" | "auto" | null

/** ローディング中のジャンル表示文言 */
export const LOADING_GENRE_TEXT = "プレイリストを構築中..."

/** ローディング中のタイトル表示文言 */
export function getLoadingTitleText(mode: LoadingMode): string {
  switch (mode) {
    case "initial":
      return "プレイリストを構築中"
    case "all":
      return "プレイリストを全件再構築中"
    case "single":
      return "プレイリストを再構築中"
    case "added":
      return "追加ジャンルのプレイリストを構築中"
    case "auto":
      return "天気・時間の変化に合わせて再構築中"
    default:
      return "プレイリストを構築中"
  }
}

/** プレイリストが空のときの表示用ダミー */
export const EMPTY_PLAYLIST: DashboardItem = {
  id: "empty",
  genre: "---",
  title: "プレイリストがありません",
  query: "",
  imageUrl: "",
}