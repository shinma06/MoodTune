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
│   ├── onboarding/         # Login/GenreSelect/Tutorial
│   ├── PlaylistExplorer.tsx
│   ├── SettingsPanel.tsx
│   ├── WeatherMonitor.tsx
│   ├── WeatherMoodTuningPanel.tsx
│   └── WeatherAnimation.tsx
├── contexts/WeatherContext.tsx
├── hooks/                  # useLocalStorage, useSettings, useVinylRotation
├── lib/                    # constants, playlist-utils, weather-utils, spotify-*
└── types/
```

### データフロー

1. `WeatherMonitor` が位置情報から `/api/weather` と `/api/geocode` を取得し、`WeatherContext` を更新  
2. `WeatherContext` が表示用導出値（`effectiveWeather`, `effectiveTimeOfDay`, `isCanvasBackgroundDark`, `isOverlayThemeDark`, `isMoodTuningApplied`）を一元提供  
3. `PlaylistExplorer` が `useSelectedGenres` と Context を組み合わせ、初回構築・差分更新・自動更新・3周ジェスチャー再生成を制御  
4. `SettingsPanel` が Select Genre / Appearance / Playback / Account を管理し、必要最小限の再生成のみ実行  
5. `OnboardingOrchestrator` が `login -> genre-select -> tutorial` 導線を制御  

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
- YAGNI と最小スコープを優先し、重複実装を避ける
