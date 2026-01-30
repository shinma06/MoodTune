# Tech Context

## 使用技術の選定理由

### Next.js 15 (App Router)
- **理由**: 最新のReact Server Components、優れたパフォーマンス、Vercelとの統合
- **App Router採用**: ファイルベースルーティング、レイアウト、Server Componentsの利点を活用

### TypeScript
- **理由**: 型安全性、開発体験の向上、リファクタリングの容易さ
- **設定**: 厳格な型チェック、明示的な型定義を推奨

### Tailwind CSS 4.x
- **理由**: ユーティリティファースト、高速開発、カスタマイズ性
- **使用方針**: カスタムCSSは最小限、globals.cssはアニメーション定義のみ

### shadcn/ui
- **理由**: カスタマイズ可能、アクセシビリティ対応、Radix UIベース
- **使用方針**: 既存コンポーネントを優先、不足時は`npx shadcn@latest add`で追加

### OpenWeatherMap API
- **理由**: 無料プランあり、日本語対応、信頼性
- **実装**: Next.js API Route（/api/weather）でプロキシ（APIキー保護）

### Vercel AI SDK（OpenAI）
- **理由**: プレイリストのタイトル・検索クエリをジャンル・天気・時間帯に応じて生成するため
- **使用方針**: Server Action（generateDashboard）内で `generateText` によりジャンル別のタイトル/クエリを生成

### NextAuth（Spotify）
- **理由**: Spotify 連携時はログインが必要。モック時は `NEXT_PUBLIC_USE_MOCK_SPOTIFY !== "false"` でログイン不要
- **実装**: `auth.ts` で Spotify Provider を設定。`app/api/auth/[...nextauth]` でルート

### Spotify Web API
- **理由**: プレイリストカバー画像の取得（モック時は picsum）。今後のビジョンで再生・保存にも利用予定
- **実装**: `lib/spotify-server.ts` でサーバー側クライアント。Server Action から呼び出し

## 開発環境

### 環境変数（現在の実装）

| 変数 | 必須 | 説明 |
|------|------|------|
| `OPENAI_API_KEY` | **Yes** | プレイリストタイトル・クエリ生成（Vercel AI SDK / OpenAI） |
| `NEXT_PUBLIC_WEATHER_API_KEY` | 天気利用時 | OpenWeatherMap API |
| `AUTH_SECRET` | Spotify 利用時 | NextAuth 用のランダム文字列 |
| `AUTH_SPOTIFY_ID` / `AUTH_SPOTIFY_SECRET` | Spotify 利用時 | Spotify OAuth |
| `NEXT_PUBLIC_USE_MOCK_SPOTIFY` | No | 省略または `true`: モック（ログイン不要）。`false`: Spotify ログイン有効 |

**最小構成（モック・デプロイ）**: `OPENAI_API_KEY` のみで動作。天気・Spotify はオプション。

### 開発サーバー
```bash
npm run dev
```

### ビルド
```bash
npm run build
npm start
```

## 依存関係の管理
- **パッケージマネージャー**: npm
- **バージョン管理**: package-lock.json
- **shadcn/ui追加**: `npx shadcn@latest add [component] --yes`

## パフォーマンス考慮事項
- **アニメーション**: CSSアニメーションを優先（JavaScriptアニメーションは避ける）
- **画像最適化**: Next.js Imageコンポーネント使用（必要時）
- **コード分割**: Next.jsの自動コード分割を活用

## ブラウザサポート
- モダンブラウザ（Chrome, Firefox, Safari, Edge）
- モバイルブラウザ対応
- 位置情報API対応が必要

