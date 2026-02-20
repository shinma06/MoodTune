# System Patterns

## アーキテクチャ

### ディレクトリ構造

```
src/
├── app/
│   ├── actions/            # generateDashboard, saveToSpotify
│   ├── api/
│   │   ├── auth/           # spotify, callback, signout, error
│   │   ├── geocode/        # 逆ジオコーディング
│   │   └── weather/        # weather, weather/owm-city
│   ├── PageClient.tsx      # PlaylistExplorer + Onboarding
│   ├── page.tsx
│   ├── layout.tsx
│   └── loading.tsx
├── auth.ts
├── components/
│   ├── onboarding/         # Login/GenreSelect/Tutorial
│   ├── GenreSelector.tsx
│   ├── PlaylistExplorer.tsx
│   ├── WeatherAnimation.tsx
│   ├── WeatherMonitor.tsx
│   └── WeatherMoodTuningPanel.tsx
├── contexts/WeatherContext.tsx
├── hooks/
├── lib/
└── types/
```

### データフロー

1. **WeatherMonitor**: 位置情報取得 → `/api/weather` と `/api/geocode` を呼び出し（必要時 `/api/weather/owm-city`）→ WeatherContext 更新。初回成功後は 10 分ポーリング（Mood Tuning 中は停止）
2. **WeatherContext**: `effectiveWeather` / `effectiveTimeOfDay` / `isCanvasBackgroundDark` / `isOverlayThemeDark` / `isMoodTuningApplied` を単一ソースとして提供
3. **PlaylistExplorer**: Context + `useSelectedGenres` を統合し、初回同期・差分更新・自動更新・3周ジェスチャー再生成を担当
4. **OnboardingOrchestrator**: `login -> genre-select -> tutorial` の初回導線を制御。ジャンル選択中はプレイリスト構築を `suspended` で停止
5. **GenreSelector**: 最大 4 ジャンルを localStorage 永続化。パネル閉じ時に差分だけ再生成
6. **WeatherMoodTuningPanel**: 手動設定を即時反映し、閉じる時点で変更があれば `requestPlaylistRefresh` で全件再生成

## 技術スタック

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.x + shadcn/ui
- **State**: React Context + localStorage
- **AI**: Vercel AI SDK + OpenAI（ログイン時に使用）
- **Weather**: WxTech 優先、OpenWeatherMap フォールバック、Google Geocoding
- **Auth**: Spotify PKCE（未ログイン利用を許容し、Spotify機能利用時に必要）

## 設計原則

- 決定的マッピングは静的定数化（`BACKGROUNDS`, `WEATHER_ICON_MAP` など）
- 導出値は単一ソース化（WeatherContext）
- YAGNI と最小スコープを優先
- 連携ポイント（WeatherContext / useLocalStorage / PlaylistExplorer）を崩さない
