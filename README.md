# MoodTune

**天気と時間帯に合わせた音楽プレイリスト提案アプリ**

現在の天気・時間帯に応じた背景とアニメーションで、そのときの気分に合うプレイリストをレコード盤風 UI で探索できます。`Settings`（Select Genre / Appearance / Playback / Account）と `Mood Tuning`（天気・時間の手動設定）で好みに合わせて更新可能です。Spotify 連携はオプションで、非ログイン時でもアプリを利用できます。

---

## 主な機能

- **天気・時間帯連動**: 位置情報から天気を取得（WxTech 優先、日本 1km / 海外 5km。失敗時は OpenWeatherMap にフォールバック）
- **都市名の精度向上**: Google Geocoding API の逆ジオコーディングを利用（失敗時は OpenWeatherMap 都市名へフォールバック）
- **Settings パネル**: 2段階 UI（一覧 → 詳細）。`Select Genre` / `Appearance` / `Playback` / `Account` を1つのパネルに集約
- **Select Genre**: 21 ジャンルから最大 4 つ選択。選択は localStorage に保存され、パネルを閉じたときに差分だけ再生成
- **Appearance**: オーバーレイ UI テーマ（time / light / dark / system）と、Mood Tuning 中の天気表示モード（tuning / actual）を切り替え
- **Playback**: 自動回転、トーンアーム表示、音符エフェクトを切り替え
- **Mood Tuning**: 天気・時間帯を手動で変更してプレビュー。パネルを閉じるときに変更があれば全件再生成
- **レコード UI**: スワイプ/ドラッグでジャンル切替。右 3 周で表示中ジャンル再生成、左 3 周で全件再生成
- **オンボーディング**: 初回はログインモーダル（ログイン/ログインせずに使う）→ ジャンル選択モーダル → チュートリアルの順で案内
- **Spotify 保存**: `Spotifyで再生` で MoodTune プレイリスト 1 本を上書きまたは新規作成

---

## テクノロジースタック

| 分野         | 技術                                                          |
| ------------ | ------------------------------------------------------------- |
| Framework    | Next.js 16 (App Router)                                       |
| Language     | TypeScript                                                    |
| Styling      | Tailwind CSS 4, shadcn/ui, Lucide React                       |
| Auth         | Spotify PKCE (Authorization Code with PKCE)                   |
| AI           | Vercel AI SDK + OpenAI                                        |
| External API | WxTech, OpenWeatherMap, Google Geocoding API, Spotify Web API |

---

## 必要環境

- Node.js 20 以上推奨
- npm

---

## クイックスタート

### 1. インストール

```bash
git clone https://github.com/shinma06/MoodTune.git
cd MoodTune
npm install
```

### 2. 環境変数

`.env.local` を作成し、用途に応じて設定してください。

| 変数名                        | 必須               | 説明                                                                   |
| ----------------------------- | ------------------ | ---------------------------------------------------------------------- |
| `OPENAI_API_KEY`              | Spotifyログイン時  | ログイン済みユーザー向けのプレイリスト生成（非ログイン時は固定データ） |
| `AUTH_SECRET`                 | Spotify ログイン時 | セッション暗号化キー（32 文字以上推奨）                                |
| `AUTH_SPOTIFY_ID`             | Spotify ログイン時 | Spotify Client ID                                                      |
| `AUTH_SPOTIFY_SECRET`         | Spotify ログイン時 | Spotify Client Secret                                                  |
| `AUTH_URL` / `NEXTAUTH_URL`   | Spotify ログイン時 | 例: `http://127.0.0.1:3000`                                            |
| `WXTECH_API_KEY`              | 推奨               | WxTech API キー                                                        |
| `NEXT_PUBLIC_WEATHER_API_KEY` | フォールバック時   | OpenWeatherMap API キー                                                |
| `GOOGLE_GEOCODING_API_KEY`    | 都市名表示時       | Google Geocoding API キー                                              |

**最小構成（非ログイン）**: 環境変数なしで起動可能です（固定データで動作）。  
**Spotify連携を使う場合**: `OPENAI_API_KEY` と Spotify 認証関連の環境変数が必要です。

### 3. 開発サーバー

```bash
npm run dev
```

---

## 利用可能なスクリプト

| コマンド          | 説明                       |
| ----------------- | -------------------------- |
| `npm run dev`     | 開発サーバー起動           |
| `npm run dev:lan` | LAN 公開で開発サーバー起動 |
| `npm run build`   | 本番ビルド                 |
| `npm run start`   | 本番サーバー起動           |
| `npm run lint`    | ESLint 実行                |

---

## プロジェクト構造（抜粋）

```
src/
├── app/
│   ├── actions/            # generateDashboard, saveToSpotify
│   ├── api/
│   │   ├── auth/           # spotify, callback, signout, error
│   │   ├── geocode/        # 都市名逆ジオコーディング
│   │   └── weather/        # 天気API（lib/weather-fetch を利用）+ owm-city
│   ├── PageClient.tsx      # PlaylistExplorer + Onboarding
│   └── page.tsx
├── components/
│   ├── shared/             # SpotifyIcon 等
│   ├── onboarding/         # Login/GenreSelect/Tutorial モーダル
│   ├── PlaylistExplorer.tsx
│   ├── GenreSelector.tsx
│   ├── SettingsPanel.tsx
│   ├── FloatingNoteEffect.tsx
│   ├── WeatherMonitor.tsx
│   └── WeatherMoodTuningPanel.tsx
├── contexts/WeatherContext.tsx
├── hooks/
│   ├── useSettings.ts
│   ├── useSelectedGenres.ts
│   ├── usePlaylistManager.ts
│   └── useVinylRotation.ts
├── lib/                    # constants, validators, overlay-theme, weather-fetch, utils, spotify-*, weather-*
└── types/
```

---

## 今後の予定

- UIの改善

---

貢献方法は `CONTRIBUTING.md` を参照してください。
