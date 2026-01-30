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
│   └── WeatherTestPanel.tsx  # Mood Tuning パネル
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

1. **WeatherMonitor**: 位置情報取得 → `/api/weather` 呼び出し → WeatherContext 更新（actualWeatherType 等）
2. **PlaylistExplorer**: WeatherContext から effectiveWeather / effectiveTimeOfDay / isDark 取得 → 背景色計算 → 表示。useSelectedGenres（useLocalStorage）でジャンル取得
3. **GenreSelector**: ジャンル選択 → useLocalStorage で localStorage 更新 → 同一ページ内にカスタムイベントで通知。パネル閉じ時は PlaylistExplorer がジャンル差分を計算し追加分のみ generateDashboard 呼び出し
4. **WeatherAnimation**: WeatherContext から天気取得 → アニメーション表示
5. **WeatherTestPanel**（Mood Tuning）: 手動設定 → WeatherContext 更新 → 全コンポーネントに反映。パネル閉じ時、開いた時点から変更があれば requestPlaylistRefresh で全件再生成
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

- **React Context**: WeatherContext（天気データ、表示用 effectiveTimeOfDay / effectiveWeather / isDark、テストモード、playlistRefreshTrigger）
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
