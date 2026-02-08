# MoodTune

**天気と時間帯に合わせた音楽プレイリスト提案アプリ**

現在の天気・時間帯に応じた背景とアニメーションで、そのときの気分に合うプレイリストをレコード盤風 UI で探索できます。Favorite Music（ジャンル選択）と Mood Tuning（天気・時間の手動設定）で好みに合わせて更新可能。Spotify 連携は必須とするが、本アプリは**開発途中**のため、現状は未設定時はモックモードでログイン不要で動作します。

---

## 主な機能

- **Weather Driven** — 位置情報から現在の天気を取得（WxTech 優先: 日本は 1km メッシュ ピンポイント、海外は 5km メッシュ 世界天気予報。失敗時は OpenWeatherMap にフォールバック）。都市名は Google Geocoding API（逆ジオコーディング）で取得し、失敗時は OpenWeatherMap の地名にフォールバック。朝/昼/夕方/夜で背景グラデーションとテーマが変化
- **Weather Animation** — 雨・雪・雲・霧など、天気に応じたビジュアルで没入感のある UI
- **Favorite Music** — 21 ジャンルから 1〜8 個選択。選択はブラウザに保存され、パネルを閉じたときに変更分だけプレイリストを再生成
- **Mood Tuning** — 天気・時間帯を手動で切り替えてプレビュー。開発・テストや「今は夜の雨の気分」で試すのに便利
- **Vinyl UI** — スワイプ/ドラッグでプレイリストを切り替え。右に 3 周で表示中ジャンルを再生成、左に 3 周で全件再生成
- **AI-Generated** — OpenAI で天気・時間・ジャンルに応じたプレイリストタイトルと検索クエリを生成。Spotify 連携時はアートワーク取得、未連携時はモック画像

---

## テクノロジースタック

| 分野         | 技術                                                                                                                                   |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Framework    | Next.js 15 (App Router)                                                                                                                |
| Language     | TypeScript                                                                                                                             |
| Styling      | Tailwind CSS 4, shadcn/ui (Radix UI), Lucide React                                                                                     |
| Auth         | NextAuth v5 (Spotify)                                                                                                                  |
| AI           | Vercel AI SDK + OpenAI                                                                                                                 |
| External API | WxTech（天気・日本/世界）, Google Geocoding API（都市名）, OpenWeatherMap（天気・都市名フォールバック）, Spotify Web API（オプション） |

---

## 必要環境

- Node.js 18+
- npm / pnpm / yarn / bun のいずれか

---

## クイックスタート

### 1. リポジトリのクローンと依存関係のインストール

```bash
git clone https://github.com/your-org/MoodTune.git
cd MoodTune
npm install
```

### 2. 環境変数の設定

リポジトリルートに `.env.local` を作成し、必要な変数を設定します。

| 変数名                         | 必須               | 説明                                                                                                 |
| ------------------------------ | ------------------ | ---------------------------------------------------------------------------------------------------- |
| `OPENAI_API_KEY`               | **Yes**            | プレイリストのタイトル・検索クエリ生成用 OpenAI API キー                                             |
| `AUTH_SECRET`                  | 認証時             | NextAuth 用のランダム文字列（例: `openssl rand -base64 32`）。Spotify ログインを有効にする場合に必要 |
| `AUTH_SPOTIFY_ID`              | Spotify 時         | Spotify Developer の Client ID                                                                       |
| `AUTH_SPOTIFY_SECRET`          | Spotify 時         | Spotify Developer の Client Secret                                                                   |
| `NEXT_PUBLIC_USE_MOCK_SPOTIFY` | No                 | 未設定または `true`: モックモード（ログイン不要）。`false` で Spotify ログインを有効化               |
| `WXTECH_API_KEY`               | 天気 API 推奨      | WxTech API キー（日本: 1km メッシュ、海外: 5km メッシュ）。未設定時は OpenWeatherMap のみ使用        |
| `NEXT_PUBLIC_WEATHER_API_KEY`  | 天気フォールバック | OpenWeatherMap API キー（WxTech 失敗時または WxTech 未設定時に使用）                                 |
| `GOOGLE_GEOCODING_API_KEY`     | 都市名表示時       | Google Geocoding API キー（逆ジオコーディングで都市名取得）。未設定時は OpenWeatherMap の地名を表示  |

**最小構成（Spotify なし・モックで動かす場合）:** `OPENAI_API_KEY` のみ設定すれば起動できます。

**Spotify 連携について（備考）:** 現在、Spotify の開発者向けプラットフォームで新規アプリ（Client ID）の作成が制限されており、ダッシュボードからアプリを create できない状態が報告されています。既存の Client ID をお持ちでない場合はモックモードで利用してください。詳細は以下を参照してください。

- [Update on Developer Access and Platform Security \| Spotify for Developers](https://developer.spotify.com/blog/2026-02-06-update-on-developer-access-and-platform-security)（2026年2月〜 Development Mode の制限強化）
- [New developer apps silently disabled / integrations - Reddit](https://www.reddit.com/r/truespotify/comments/1q4sbi3/new_developer_apps_silently_disabled_integrations/)

### 3. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

---

## 利用可能なスクリプト

| コマンド        | 説明                               |
| --------------- | ---------------------------------- |
| `npm run dev`   | 開発サーバー起動（ホットリロード） |
| `npm run build` | 本番用ビルド                       |
| `npm run start` | 本番サーバー起動（`build` 実行後） |
| `npm run lint`  | ESLint でコードチェック            |

---

## プロジェクト構造（概要）

```
src/
├── app/                    # Next.js App Router
│   ├── actions/            # Server Actions（generateDashboard 等）
│   ├── api/                # API Routes（auth, weather, geocode プロキシ）
│   ├── page.tsx            # メインページ
│   ├── layout.tsx
│   └── loading.tsx
├── auth.ts                 # NextAuth 設定
├── components/              # React コンポーネント
│   ├── ui/                 # shadcn/ui
│   ├── PlaylistExplorer.tsx # レコード盤・プレイリスト表示
│   ├── GenreSelector.tsx   # Favorite Music パネル
│   ├── WeatherMonitor.tsx  # 位置・天気取得
│   ├── WeatherAnimation.tsx
│   └── WeatherMoodTuningPanel.tsx # Mood Tuning パネル
├── contexts/
│   └── WeatherContext.tsx  # 天気・時間帯・表示状態の単一ソース
├── hooks/
│   ├── useGeolocation.ts
│   ├── useLocalStorage.ts  # ジャンル選択の永続化
│   └── useVinylRotation.ts # レコード回転・3 周で再生成
├── lib/                    # ユーティリティ・API クライアント
│   ├── constants.ts        # ジャンル定義・定数
│   ├── playlist-utils.ts   # プレイリスト文言・LoadingMode 等
│   ├── spotify-server.ts
│   ├── weather-api.ts      # 天気・Geocoding 並列取得
│   ├── weather-background.ts
│   ├── weather-background-utils.ts  # 初期背景等
│   ├── weather-utils.ts    # 天気アイコン・テーマ色
│   └── wxtech-weather.ts   # WxTech 天気 API（日本/海外）
└── types/                  # TypeScript 型定義
```

---

## データフロー（要約）

1. **WeatherMonitor** — 位置情報 → `/api/weather`（天気）と `/api/geocode`（都市名）を並列取得 → WeatherContext 更新。初回成功後は 10 分ごとに同座標で再取得（Mood Tuning 中はスキップ）
2. **PlaylistExplorer** — WeatherContext から天気・時間帯・背景を取得。`useLocalStorage` でジャンルを取得し、プレイリスト表示・再生成を担当。天気・時間帯の変化時は自動更新 ON ならプレイリストを再生成
3. **GenreSelector** — ジャンル選択 → localStorage 更新。パネル閉じ時に PlaylistExplorer が差分を検知し、追加ジャンル分のみ API で再生成
4. **WeatherMoodTuningPanel (Mood Tuning)** — 手動で天気・時間を設定 → WeatherContext 更新 → 全コンポーネントに反映。パネル閉じ時に変更があればプレイリストを再生成

---

## デプロイ

[Vercel](https://vercel.com) にデプロイする場合:

1. リポジトリを Vercel にインポート
2. 環境変数（`OPENAI_API_KEY` 等）を設定
3. デプロイ

```bash
npm run build
```

が成功することを確認してからデプロイしてください。

---

## 今後の予定（未実装）

- **Spotify 連携の実装完了**
- 初回アクセス時のチュートリアル用モーダルの開発
- 未ログイン時のログイン用モーダルの開発
- AI エージェントによる Mood（天気・時間帯・ジャンル）に合わせたプレイリストの選曲
- プレイリストの Spotify 保存
- トークンリフレッシュの本番対応（Spotify アクセストークン期限切れ前にリフレッシュトークンで更新する処理を本番で安定動作させる）
- ユーザー設定（位置情報の手動再取得、天気の更新間隔の変更など）

---

## 参考リンク

- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [OpenWeatherMap API](https://openweathermap.org/api)（天気フォールバック）
- [WxTech（Weather News）](https://weathernews.com/)（天気・日本/世界）
- [Google Geocoding API](https://developers.google.com/maps/documentation/geocoding)（都市名）
- [Spotify Web API](https://developer.spotify.com/documentation/web-api)

---

貢献については [CONTRIBUTING.md](./CONTRIBUTING.md) を参照してください。
