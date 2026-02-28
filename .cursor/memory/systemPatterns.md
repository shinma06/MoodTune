# System Patterns

## アーキテクチャ

### ディレクトリ構造（要点）

```
src/
├── app/
│   ├── actions/            # generateDashboard, saveToSpotify
│   ├── api/                # auth, weather, geocode
│   ├── PageClient.tsx      # PlaylistExplorer + OnboardingOrchestrator
│   ├── page.tsx
│   ├── layout.tsx
│   └── loading.tsx
├── components/
│   ├── shared/             # SpotifyIcon 等の共有コンポーネント
│   ├── onboarding/        # Login/GenreSelect/Tutorial
│   ├── PlaylistExplorer.tsx
│   ├── GenreSelector.tsx
│   ├── SettingsPanel.tsx
│   ├── WeatherMonitor.tsx
│   ├── WeatherMoodTuningPanel.tsx
│   └── WeatherAnimation.tsx
├── contexts/WeatherContext.tsx
├── hooks/
│   ├── useLocalStorage.ts
│   ├── useSettings.ts
│   ├── useVinylRotation.ts
│   ├── useSelectedGenres.ts   # ジャンル選択（localStorage 連携）
│   └── usePlaylistManager.ts  # プレイリスト状態・生成・更新・自動更新
├── lib/
│   ├── constants.ts
│   ├── validators.ts       # バリデーション関数（theme/genre/boolean 等）
│   ├── overlay-theme.ts    # オーバーレイのダーク/ライトスタイル（getOverlayStyles）
│   ├── utils.ts            # cn, mapWithConcurrency
│   ├── weather-fetch.ts    # WxTech/OWM 取得（weather route から利用）
│   ├── playlist-utils.ts
│   ├── weather-utils.ts
│   ├── spotify-*
│   └── wxtech-weather.ts
└── types/
```

### データフロー

1. `WeatherMonitor` が位置情報から `/api/weather` と `/api/geocode` を取得し、`WeatherContext` を更新  
2. `WeatherContext` が表示用導出値（`effectiveWeather`, `effectiveTimeOfDay`, `isCanvasBackgroundDark`, `isOverlayThemeDark`, `isMoodTuningApplied`）を一元提供  
3. `PlaylistExplorer` が `usePlaylistManager`（プレイリスト状態・生成・差分更新・自動更新）と `useSelectedGenres`（hooks）を利用し、3周ジェスチャーで再生成を発火  
4. `SettingsPanel` が Select Genre / Appearance / Playback / Account を管理。Select Genre は `GenreSelector`（flat）を表示し、パネル閉じ時に差分のみ再生成  
5. `OnboardingOrchestrator` が `login -> genre-select -> tutorial` 導線を制御  
6. オーバーレイ（モーダル・パネル）のスタイルは `lib/overlay-theme.ts` の `getOverlayStyles(isOverlayThemeDark)` で統一  

## 技術スタック

- Framework: Next.js 16 (App Router)
- Language: TypeScript
- UI: Tailwind CSS 4.x + shadcn/ui + Lucide React
- AI: Vercel AI SDK + OpenAI（ログイン時）
- Weather: WxTech 優先、OpenWeatherMap フォールバック、Google Geocoding
- Auth: Spotify PKCE（未ログイン利用を許可）

## 設計原則

- 決定的マッピングは静的定数で定義（`BACKGROUNDS`, `WEATHER_ICON_MAP` など）
- 導出ロジックは単一ソース化（`WeatherContext`）
- `themePreference`（overlay）と `isCanvasBackgroundDark`（視認性）を分離
- バリデーションは `lib/validators.ts`、オーバーレイスタイルは `getOverlayStyles()` に集約
- YAGNI と最小スコープを優先し、重複実装を避ける
