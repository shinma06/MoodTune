import type { Genre } from "./constants"

type TrackCandidate = { artist: string; title: string }

/** モック用：ジャンルごとのデフォルト10曲（GPT API を呼ばないときに使用） */
const MOCK_TRACKS: Record<Genre, TrackCandidate[]> = {
  "J-POP": [
    { artist: "Mock J-POP Artist 1", title: "Mock J-POP Track 1" },
    { artist: "Mock J-POP Artist 2", title: "Mock J-POP Track 2" },
    { artist: "Mock J-POP Artist 3", title: "Mock J-POP Track 3" },
    { artist: "Mock J-POP Artist 4", title: "Mock J-POP Track 4" },
    { artist: "Mock J-POP Artist 5", title: "Mock J-POP Track 5" },
    { artist: "Mock J-POP Artist 6", title: "Mock J-POP Track 6" },
    { artist: "Mock J-POP Artist 7", title: "Mock J-POP Track 7" },
    { artist: "Mock J-POP Artist 8", title: "Mock J-POP Track 8" },
    { artist: "Mock J-POP Artist 9", title: "Mock J-POP Track 9" },
    { artist: "Mock J-POP Artist 10", title: "Mock J-POP Track 10" },
  ],
  "J-Rock": Array.from({ length: 10 }, (_, i) => ({ artist: `Mock J-Rock Artist ${i + 1}`, title: `Mock J-Rock Track ${i + 1}` })),
  "J-HipHop": Array.from({ length: 10 }, (_, i) => ({ artist: `Mock J-HipHop Artist ${i + 1}`, title: `Mock J-HipHop Track ${i + 1}` })),
  "Hip Hop": Array.from({ length: 10 }, (_, i) => ({ artist: `Mock Hip Hop Artist ${i + 1}`, title: `Mock Hip Hop Track ${i + 1}` })),
  "Lo-fi Hip Hop": Array.from({ length: 10 }, (_, i) => ({ artist: `Mock Lofi Artist ${i + 1}`, title: `Mock Lofi Track ${i + 1}` })),
  "City Pop": Array.from({ length: 10 }, (_, i) => ({ artist: `Mock City Pop Artist ${i + 1}`, title: `Mock City Pop Track ${i + 1}` })),
  "R&B": Array.from({ length: 10 }, (_, i) => ({ artist: `Mock R&B Artist ${i + 1}`, title: `Mock R&B Track ${i + 1}` })),
  "J-R&B": Array.from({ length: 10 }, (_, i) => ({ artist: `Mock J-R&B Artist ${i + 1}`, title: `Mock J-R&B Track ${i + 1}` })),
  "Anime Song": Array.from({ length: 10 }, (_, i) => ({ artist: `Mock Anime Artist ${i + 1}`, title: `Mock Anime Track ${i + 1}` })),
  "Vocaloid": Array.from({ length: 10 }, (_, i) => ({ artist: `Mock Vocaloid Artist ${i + 1}`, title: `Mock Vocaloid Track ${i + 1}` })),
  "Idol Pop": Array.from({ length: 10 }, (_, i) => ({ artist: `Mock Idol Artist ${i + 1}`, title: `Mock Idol Track ${i + 1}` })),
  "K-POP (Boy)": Array.from({ length: 10 }, (_, i) => ({ artist: `Mock K-POP Boy Artist ${i + 1}`, title: `Mock K-POP Boy Track ${i + 1}` })),
  "K-POP (Girl)": Array.from({ length: 10 }, (_, i) => ({ artist: `Mock K-POP Girl Artist ${i + 1}`, title: `Mock K-POP Girl Track ${i + 1}` })),
  "EDM": Array.from({ length: 10 }, (_, i) => ({ artist: `Mock EDM Artist ${i + 1}`, title: `Mock EDM Track ${i + 1}` })),
  "House": Array.from({ length: 10 }, (_, i) => ({ artist: `Mock House Artist ${i + 1}`, title: `Mock House Track ${i + 1}` })),
  "Techno": Array.from({ length: 10 }, (_, i) => ({ artist: `Mock Techno Artist ${i + 1}`, title: `Mock Techno Track ${i + 1}` })),
  "Acoustic": Array.from({ length: 10 }, (_, i) => ({ artist: `Mock Acoustic Artist ${i + 1}`, title: `Mock Acoustic Track ${i + 1}` })),
  "Jazz": Array.from({ length: 10 }, (_, i) => ({ artist: `Mock Jazz Artist ${i + 1}`, title: `Mock Jazz Track ${i + 1}` })),
  "Piano": Array.from({ length: 10 }, (_, i) => ({ artist: `Mock Piano Artist ${i + 1}`, title: `Mock Piano Track ${i + 1}` })),
  "Chill Out": Array.from({ length: 10 }, (_, i) => ({ artist: `Mock Chill Artist ${i + 1}`, title: `Mock Chill Track ${i + 1}` })),
  "City Jazz": Array.from({ length: 10 }, (_, i) => ({ artist: `Mock City Jazz Artist ${i + 1}`, title: `Mock City Jazz Track ${i + 1}` })),
}

export type { TrackCandidate }

/** モック用：ジャンル・天気・時間帯からプレイリスト情報を組み立て（GPT 未使用） */
export function getMockPlaylistInfo(
  genres: Genre[],
  weatherLabel: string,
  timeLabel: string
): { genre: string; title: string; tracks: TrackCandidate[] }[] {
  return genres.map((genre) => ({
    genre,
    title: `${weatherLabel}の${timeLabel}に聴く${genre}`,
    tracks: MOCK_TRACKS[genre] ?? [],
  }))
}
