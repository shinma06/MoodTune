# System Patterns

## アーキテクチャ

### ディレクトリ構造

```
src/
├── app/              # Next.js App Router
│   ├── actions/      # Server Actions
│   │   └── generateDashboard.ts
│   ├── api/          # API Routes
│   │   ├── auth/[...nextauth]/  # NextAuth (Spotify)
│   │   └── weather/  # 天気APIプロキシ
│   ├── page.tsx      # メインページ
│   └── layout.tsx    # ルートレイアウト
├── auth.ts           # NextAuth 設定
├── components/       # Reactコンポーネント
│   ├── ui/           # shadcn/uiコンポーネント
│   ├── GenreSelector.tsx   # Favorite Music パネル
│   ├── PlaylistExplorer.tsx
│   ├── WeatherMonitor.tsx
│   ├── WeatherAnimation.tsx
│   └── WeatherMoodTuningPanel.tsx  # Mood Tuning パネル
├── contexts/         # React Context
│   └── WeatherContext.tsx
├── hooks/            # カスタムフック
│   ├── useGeolocation.ts
│   ├── useLocalStorage.ts   # ジャンル選択の永続化（バリデーション・修復あり）
│   └── useVinylRotation.ts # レコード回転・3周で再生成
├── lib/              # ユーティリティ・APIクライアント
│   ├── constants.ts        # 定数・ジャンル定義
│   ├── playlist-utils.ts   # プレイリスト関連ユーティリティ
│   ├── spotify-server.ts   # Spotify API クライアント
│   ├── weather-api.ts
│   ├── weather-background.ts
│   ├── weather-background-utils.ts
│   └── weather-utils.ts
└── types/            # TypeScript型定義
    ├── dashboard.ts  # DashboardItem
    ├── next-auth.d.ts
    └── weather.ts    # WeatherApiResponse, WeatherData
```

### データフロー

1. **WeatherMonitor**: 位置情報取得 → `/api/weather` 呼び出し → WeatherContext 更新（actualWeatherType 等）。初回成功後は 10 分ごとに同座標でバックグラウンド再取得（Mood Tuning 中はポーリングしない。ローディング表示なし）
2. **PlaylistExplorer**: WeatherContext から effectiveWeather / effectiveTimeOfDay / isDark 取得 → 背景色計算 → 表示。useSelectedGenres（useLocalStorage）でジャンル取得。天気・時間帯の自動変化時（actualWeatherType / displayHour の effect）は playlistAutoUpdate かつ非 Mood Tuning 時のみ refreshPlaylists({ autoUpdate: true }) で全件再生成し、文言は LoadingMode "auto"（「天気・時間の変化に合わせて再生成中」）を表示
3. **GenreSelector**: ジャンル選択 → useLocalStorage で localStorage 更新 → 同一ページ内にカスタムイベントで通知。パネル閉じ時は PlaylistExplorer がジャンル差分を計算し追加分のみ generateDashboard 呼び出し
4. **WeatherAnimation**: WeatherContext から天気取得 → アニメーション表示
5. **WeatherMoodTuningPanel**（Mood Tuning）: 手動設定 → WeatherContext 更新 → 全コンポーネントに反映。パネル閉じ時、開いた時点から変更があれば requestPlaylistRefresh で全件再生成
6. **初回読み込み後**: PlaylistExplorer が isGenresInitialized 後に localStorage のジャンルと表示プレイリストを比較し、差異があれば updatePlaylistsWithDiff で同期

## 技術スタック

### フロントエンド

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.x
- **UI Components**: shadcn/ui (Radix UIベース)
- **Icons**: Lucide React
- **Fonts**: Geist (sans), Cormorant Garamond (serif)

### バックエンド/API

- **API Route**: Next.js API Routes
- **External API**: OpenWeatherMap API

### 状態管理

- **React Context**: WeatherContext（天気データ、表示用 effectiveTimeOfDay / effectiveWeather / isDark、Mood Tuning 状態 isMoodTuning / moodTuningTimeOfDay、playlistRefreshTrigger）
- **useLocalStorage**: ジャンル選択の永続化（key: selected-genres）。バリデーション（空配列は無効）と初回/他タブ時の修復。同一ページ内の変更では無効値もそのまま state に反映
- **Local State**: useState（各コンポーネントのローカル状態）

## デザインパターン

### コンポーネント設計

- **Functional Components**: 全て関数コンポーネント
- **Server Components First**: デフォルトでServer Component、必要時のみ'use client'
- **Composition**: 小さなコンポーネントを組み合わせて構築

### 状態管理パターン

- **Context API**: グローバルな天気データ
- **Props Drilling回避**: Contextで必要なデータを共有

### データ取得パターン

- **Client-side Fetching**: WeatherMonitorで位置情報取得後、API呼び出し
- **Error Handling**: try-catchとエラー状態の管理

## 命名規則

### ファイル名

- **Components**: PascalCase (例: `WeatherMonitor.tsx`)
- **Utilities**: kebab-case (例: `weather-utils.ts`)
- **Types**: kebab-case (例: `weather.ts`)

### 変数・関数名

- **Components**: PascalCase (例: `WeatherMonitor`)
- **Functions**: camelCase (例: `getWeatherIcon`)
- **Constants**: UPPER_SNAKE_CASE (例: `BACKGROUND_TOP_COLOR`)
- **Types/Interfaces**: PascalCase (例: `WeatherType`, `BackgroundGradient`)

### CSSクラス

- **Tailwind Utilities**: 標準のTailwindクラス
- **Custom Classes**: `.cursorrules`に従い、shadcn/uiコンポーネントを優先

## コーディング規約

### TypeScript

- 明示的な型定義を推奨
- `any`型の使用は禁止
- Interface/Typeは`types/`ディレクトリに集約

### React

- Hooksの使用は必要最小限
- `useCallback`, `useMemo`はパフォーマンスが必要な場合のみ
- 副作用は`useEffect`で管理

### スタイリング

- Tailwind CSSのみ使用（カスタムCSSは最小限）
- shadcn/uiコンポーネントを優先
- レスポンシブ: `sm:`, `md:`, `lg:`ブレークポイントを使用

## 設計原則（技術負債回避）

### シンプルさの追求

1. **YAGNI (You Aren't Gonna Need It)**
   - 「将来使うかも」で抽象化しない
   - 現在の要件を満たす最小限の実装を選ぶ

2. **DRY (Don't Repeat Yourself)**
   - 同じロジックは 1 箇所にまとめる
   - ただし、過度な共通化で可読性を損なわない

3. **単一責任の原則**
   - 1 つの関数・コンポーネントは 1 つの責務のみ
   - 肥大化したら分割を検討

### 決定的マッピングの静的化

入力→出力が常に一意に決まるロジックは、関数内オブジェクトではなく**静的定数**で定義する。

```typescript
// ✗ Bad: 関数呼び出しごとにオブジェクト生成
function getIcon(type: string) {
  const map = { Clear: Sun, Rain: CloudRain }
  return map[type]
}

// ✓ Good: 静的定数として定義
const WEATHER_ICON_MAP = { Clear: Sun, Rain: CloudRain }
function getIcon(type: string) {
  return WEATHER_ICON_MAP[type]
}
```

### 単一ソースの原則

同じ導出が必要な値は、1 箇所で計算して共有する。

- **Context で管理**: `effectiveWeather`, `effectiveTimeOfDay`, `isDark`, `displayHour`
- **共通関数**: `normalizeWeatherType`, `getTimeOfDay`, `isDarkBackground`

### 機能連携の意識

新機能を追加する前に、既存の連携ポイントを把握する:

1. **WeatherContext**: 天気・時間帯・表示状態の単一ソース
2. **useLocalStorage**: ジャンル選択の永続化・バリデーション
3. **PlaylistExplorer**: Context と localStorage を統合してプレイリスト管理

詳細は `.cursor/rules/pre-implementation-check.md` を参照
