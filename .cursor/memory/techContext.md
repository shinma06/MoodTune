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

### 天気 API（WxTech 優先・OpenWeatherMap フォールバック）
- **WxTech**: 日本は 1km メッシュ ピンポイント、海外は 5km メッシュ 世界天気予報。高精度・世界対応
- **OpenWeatherMap**: WxTech 失敗時または WxTech 未設定時のフォールバック。無料プランあり
- **実装**: `GET /api/weather` で WxTech を先に呼び出し、レスポンスを OWM 互換に正規化。`lib/wxtech-weather.ts` で日本域判定・天気コード→WeatherType マッピング。API キーはサーバー側のみ（プロキシ）

### Google Geocoding API（逆ジオコーディング）
- **理由**: 緯度経度から市区町村レベルの地名を取得し、天気モニターに表示
- **実装**: `GET /api/geocode?lat=&lon=`。天気取得と `Promise.all` で並列呼び出し。失敗時は OWM の `name` にフォールバック。本番では Referer 送信、開発では送らない

### Vercel AI SDK（OpenAI）
- **理由**: プレイリストのタイトル・検索クエリをジャンル・天気・時間帯に応じて生成するため
- **使用方針**: Server Action（generateDashboard）内で `generateText` によりジャンル別のタイトル/クエリを生成

### Spotify PKCE（Authorization Code with PKCE）
- **理由**: Spotify ログイン必須（PKCE）
- **実装**: `lib/spotify-pkce.ts` で認可URL・トークン交換。`lib/spotify-session.ts` でセッション暗号化クッキーとトークンリフレッシュ。`auth.ts` は `getSession()` をラップして `auth()` でセッション取得。`GET /api/auth/spotify`, `GET /api/auth/spotify/callback`, `GET /api/auth/signout`

### Spotify Web API
- **理由**: プレイリストカバー画像の取得（Spotify Search。ヒットしない場合はフォールバック画像）、プレイリスト保存（MoodTune 1 本の上書き or 新規作成）
- **実装**: `lib/spotify-server.ts` で generateDashboard の Search 用。saveToSpotify はセッショントークンで直接 fetch（PUT /playlists/{id}/items、100曲超はチャンク）

## 開発環境

### 環境変数（現在の実装）

| 変数 | 必須 | 説明 |
|------|------|------|
| `OPENAI_API_KEY` | **Yes** | プレイリストタイトル・クエリ生成（Vercel AI SDK / OpenAI） |
| `AUTH_SECRET` | Spotify 利用時 | セッション暗号化用（32文字以上推奨） |
| `AUTH_SPOTIFY_ID` / `AUTH_SPOTIFY_SECRET` | Spotify 利用時 | Spotify PKCE（トークン交換・リフレッシュ） |
| `WXTECH_API_KEY` | 天気推奨 | WxTech API（日本 1km/海外 5km）。未設定時は OWM のみ |
| `NEXT_PUBLIC_WEATHER_API_KEY` | 天気フォールバック | OpenWeatherMap API（WxTech 失敗時または未設定時） |
| `GOOGLE_GEOCODING_API_KEY` | 都市名表示時 | Google Geocoding（逆ジオコーディング）。未設定時は OWM の地名にフォールバック |

**最小構成**: `OPENAI_API_KEY` 必須。Spotify 利用時は認証関連も設定。天気・都市名はオプション。

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

