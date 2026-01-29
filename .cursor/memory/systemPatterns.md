# System Patterns

## アーキテクチャ

### ディレクトリ構造
```
src/
├── app/              # Next.js App Router
│   ├── actions/      # Server Actions
│   │   └── generateDashboard.ts
│   ├── api/          # API Routes
│   ├── page.tsx      # メインページ
│   └── layout.tsx    # ルートレイアウト
├── components/       # Reactコンポーネント
│   ├── ui/           # shadcn/uiコンポーネント
│   ├── GenreSelector.tsx
│   ├── PlaylistExplorer.tsx
│   ├── WeatherMonitor.tsx
│   ├── WeatherAnimation.tsx
│   └── WeatherTestPanel.tsx
├── contexts/         # React Context
│   └── WeatherContext.tsx
├── hooks/            # カスタムフック
│   ├── useGeolocation.ts
│   ├── useLocalStorage.ts
│   └── useVinylRotation.ts
├── lib/              # ユーティリティ関数
│   ├── constants.ts        # 定数・ジャンル定義
│   ├── playlist-utils.ts   # プレイリスト関連ユーティリティ
│   ├── spotify-server.ts   # Spotify API クライアント
│   ├── weather-api.ts
│   ├── weather-background.ts
│   ├── weather-background-utils.ts
│   └── weather-utils.ts
└── types/            # TypeScript型定義
    ├── dashboard.ts  # DashboardItem
    └── weather.ts    # WeatherApiResponse, WeatherData
```

### データフロー
1. **WeatherMonitor**: 位置情報取得 → API呼び出し → WeatherContext更新
2. **PlaylistExplorer**: WeatherContextから天気取得 → 背景色計算 → 表示
3. **WeatherAnimation**: WeatherContextから天気取得 → アニメーション表示
4. **WeatherTestPanel**: 手動設定 → WeatherContext更新 → 全コンポーネントに反映

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
- **React Context**: WeatherContext（天気データ、テストモード）
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

