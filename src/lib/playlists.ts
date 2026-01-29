/** 静的フォールバック用プレイリスト（テーマ色は constants の getGenreThemeColors で取得） */
export type Playlist = {
  id: string
  genre: string
  title: string
  coverUrl: string
}

export const PLAYLISTS: Playlist[] = [
  { id: "1", genre: "チルアウト", title: "冬の午後のジャズ", coverUrl: "/cozy-winter-jazz-album-cover.jpg" },
  { id: "2", genre: "アンビエント", title: "雨音とピアノ", coverUrl: "/rain-piano-ambient-album-cover.jpg" },
  { id: "3", genre: "クラシック", title: "穏やかな朝のための弦楽", coverUrl: "/classical-morning-strings-album-cover.jpg" },
  { id: "4", genre: "ローファイヒップホップ", title: "作業用BGM", coverUrl: "/lofi-hiphop-study-music-album-cover.jpg" },
  { id: "5", genre: "アコースティック", title: "夕暮れのフォークソング", coverUrl: "/sunset-folk-acoustic-album-cover.jpg" },
]

