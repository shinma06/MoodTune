export type Playlist = {
  id: string
  genre: string
  title: string
  coverUrl: string
  vinylColor: string
  accentColor: string
}

export const PLAYLISTS: Playlist[] = [
  {
    id: "1",
    genre: "チルアウト",
    title: "冬の午後のジャズ",
    coverUrl: "/cozy-winter-jazz-album-cover.jpg",
    vinylColor: "from-amber-900 to-amber-950",
    accentColor: "#d97706",
  },
  {
    id: "2",
    genre: "アンビエント",
    title: "雨音とピアノ",
    coverUrl: "/rain-piano-ambient-album-cover.jpg",
    vinylColor: "from-slate-700 to-slate-900",
    accentColor: "#64748b",
  },
  {
    id: "3",
    genre: "クラシック",
    title: "穏やかな朝のための弦楽",
    coverUrl: "/classical-morning-strings-album-cover.jpg",
    vinylColor: "from-emerald-800 to-emerald-950",
    accentColor: "#059669",
  },
  {
    id: "4",
    genre: "ローファイヒップホップ",
    title: "作業用BGM",
    coverUrl: "/lofi-hiphop-study-music-album-cover.jpg",
    vinylColor: "from-purple-900 to-purple-950",
    accentColor: "#7c3aed",
  },
  {
    id: "5",
    genre: "アコースティック",
    title: "夕暮れのフォークソング",
    coverUrl: "/sunset-folk-acoustic-album-cover.jpg",
    vinylColor: "from-orange-800 to-orange-950",
    accentColor: "#ea580c",
  },
]

